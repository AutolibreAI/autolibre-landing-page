import { google } from 'googleapis';

/** Pestaña de destino en el Google Sheet de proveedores. */
const PROVIDER_TAB = 'Proveedores';
/** Los encabezados estan en la fila 2; los datos arrancan en la 3. */
const FIRST_DATA_ROW = 3;
/** Mensaje precargado del link de redireccion a WhatsApp. */
const WHATSAPP_MESSAGE = 'Hola! Vengo de AutoLibre y necesito ayuda';

/** Auth con service account (misma cuenta que usa el backend, con scope de escritura). */
function buildAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error('Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.');
  }
  // Tolera comillas colgadas y \n escapados o reales (como quede pegada en el .env).
  let key = rawKey.trim();
  if (key.startsWith('"')) key = key.slice(1);
  if (key.endsWith('"')) key = key.slice(0, -1);
  key = key.replace(/\\n/g, '\n').trim();

  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

/**
 * Servicios del form -> opciones exactas de la lista `Listas!A2:A` (la columna
 * "Servicio / rubro" es un desplegable de seleccion multiple: solo acepta esos
 * valores, separados por coma). "Otro" no se mapea: va a Notas.
 */
const SERVICE_TO_SHEET_OPTION: Readonly<Record<string, string>> = {
  'Service y mantenimiento': 'Taller mecanico general',
  Frenos: 'Frenos',
  Suspensión: 'Suspension y amortiguadores',
  Electricidad: 'Electricidad / inyeccion / scanner',
  'Chapa y pintura': 'Chapa y pintura',
  'Diagnóstico OBD': 'Diagnostico OBD2',
  Neumáticos: 'Gomeria fija',
  'Inspecciones pre-compra': 'Peritaje / inspeccion pre-compra',
  Lavadero: 'Lavadero en local',
  Detailing: 'Detailing en local',
  Baterías: 'Venta y cambio de baterias en local',
  'Tren delantero': 'Tren delantero',
};

export interface ProviderSubmission {
  readonly taller: string;
  readonly whatsapp: string;
  readonly email: string;
  readonly direccion: string;
  readonly services: string[];
  readonly serviceOther?: string;
  readonly brandSpecialized?: 'yes' | 'no' | null;
  readonly brands: string[];
  readonly vehicleTypes: string[];
  readonly fuelTypes: string[];
  readonly howFound?: string;
  readonly howFoundOther?: string;
}

/**
 * Normaliza a formato internacional sin simbolos (como estan cargados los
 * numeros en la columna "WhatsApp / Tel."): 5491125120472.
 */
function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  if (!digits.startsWith('54')) digits = `54${digits}`;
  // Movil argentino cargado sin el 9 (54 + 10 digitos) -> 549...
  if (!digits.startsWith('549') && digits.length === 12) {
    digits = `549${digits.slice(2)}`;
  }
  return digits;
}

/** Link de wa.me con el mensaje precargado, igual al del resto de la planilla. */
function buildWhatsappLink(phone: string): string {
  if (phone.length < 10) return '';
  return `https://wa.me/${phone}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}

/** Datos del form que no tienen columna propia: se guardan como nota libre. */
function buildNotes(row: ProviderSubmission): string {
  const parts: string[] = [];
  const unmapped = row.services.filter((s) => s !== 'Otro' && !SERVICE_TO_SHEET_OPTION[s]);
  if (row.serviceOther) parts.push(`Otro servicio: ${row.serviceOther}`);
  if (unmapped.length) parts.push(`Servicios sin mapear: ${unmapped.join(', ')}`);
  if (row.brandSpecialized === 'no') parts.push('Trabaja todas las marcas');
  if (row.vehicleTypes.length) parts.push(`Vehiculos: ${row.vehicleTypes.join(', ')}`);
  const howFound = row.howFound === 'Otro' ? row.howFoundOther : row.howFound;
  if (howFound) parts.push(`Se entero por: ${howFound}`);
  return parts.join(' · ');
}

/**
 * Primera fila con la columna B (Estado) vacia. Las filas ya vienen con ID
 * precargado en la columna A, asi que no sirve buscar el final de la tabla:
 * el lead va en la primera fila sin Estado, reutilizando ese ID.
 */
async function findFirstFreeRow(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
): Promise<number> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${PROVIDER_TAB}'!B${FIRST_DATA_ROW}:B`,
  });
  const estados = res.data.values ?? [];
  const emptyIndex = estados.findIndex((r) => !r?.[0] || !String(r[0]).trim());
  // Si no hay ningun hueco, la primera libre es la que sigue al ultimo valor.
  return FIRST_DATA_ROW + (emptyIndex === -1 ? estados.length : emptyIndex);
}

/**
 * Carga el lead en la primera fila libre de la pestaña "Proveedores".
 * Estado = "No contactado": el nuevo lead NO se sincroniza al marketplace
 * hasta que el equipo lo cure a "Acuerdo verbal".
 *
 * Escribe celda por celda (no la fila entera) para no pisar el ID de la
 * columna A ni nada que el equipo haya dejado cargado en esa fila.
 * Columnas: B Estado · C Proveedor · D Servicio/rubro · E Descripcion ·
 * F Modalidad · G Zona · H Logo · I Direccion · J Especializado en marcas ·
 * K Tipo de combustible · L Horarios · M Contacto (persona) ·
 * N WhatsApp/Tel. · O Email · T Link de redireccion · X Notas
 */
export async function appendProviderToSheet(row: ProviderSubmission): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('Falta GOOGLE_SHEETS_SPREADSHEET_ID.');

  const sheets = google.sheets({ version: 'v4', auth: buildAuth() });
  const targetRow = await findFirstFreeRow(sheets, spreadsheetId);

  // Solo opciones validas del desplegable, sin repetir.
  const servicios = row.services.join(', ')

  // Si trabaja todas las marcas, la columna queda vacia (convencion del sheet).
  const marcas = row.brandSpecialized === 'no' ? '' : row.brands.join(', ');
  const telefono = normalizePhone(row.whatsapp);

  const cells: Record<string, string> = {
    B: 'No contactado',
    C: row.taller,
    D: '',
    'AG': servicios,
    I: row.direccion,
    J: marcas,
    K: row.fuelTypes.join(', '),
    N: telefono,
    O: row.email,
    T: buildWhatsappLink(telefono),
    X: buildNotes(row),
  };

  const data = Object.entries(cells)
    .filter(([, value]) => value !== '')
    .map(([column, value]) => ({
      range: `'${PROVIDER_TAB}'!${column}${targetRow}`,
      values: [[value]],
    }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'RAW', data },
  });
}
