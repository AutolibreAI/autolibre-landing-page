/**
 * Cliente del backend de AutoLibre para las rutas de servidor de la landing.
 *
 * ── Por que la landing no le pega directo desde el browser ──────────────────
 *
 * Porque el form vive en una pagina publica y el endpoint es anonimo: si el
 * fetch saliera del cliente, la URL del backend quedaria en el bundle y
 * cualquiera podria postear sin pasar por acá. Manteniendo la llamada del lado
 * del servidor, `/api/provider` sigue siendo la unica superficie que ve el
 * navegador y el dia que haga falta sumar rate limiting o un captcha, hay
 * donde ponerlo.
 */

/**
 * Base del backend. Server-side a proposito (sin `NEXT_PUBLIC_`): esta URL no
 * tiene por que viajar al bundle del cliente.
 */
function apiBaseUrl(): string {
  const url = process.env.AUTOLIBRE_API_URL?.trim().replace(/\/+$/, "");

  if (!url) {
    throw new Error(
      "Falta AUTOLIBRE_API_URL: la landing no sabe a que backend mandar las solicitudes de partner.",
    );
  }

  return url;
}

export interface PartnerApplicationSubmission {
  readonly businessName: string;
  readonly whatsapp: string;
  readonly email: string;
  readonly address: string;
  readonly declaredServices: string[];
  readonly declaredBrands: string[];
  readonly declaredFuelTypes: string[];
  readonly vehicleTypes: string[];
  readonly serviceOther?: string;
  readonly howFound?: string;
  readonly howFoundOther?: string;
}

export type SubmitPartnerApplicationResult =
  | { readonly ok: true; readonly id: string }
  /**
   * `kind` existe para que la ruta pueda elegir el mensaje sin leer el texto
   * que devuelve el backend. Ese texto esta en ingles y es del dominio, no de
   * cara al usuario: acoplarse a el haria que cambiar una excepcion del backend
   * rompa un cartel de la landing.
   */
  | { readonly ok: false; readonly kind: "invalid" | "duplicate" | "unknown" };

/**
 * Registra la solicitud de un taller que quiere ser partner.
 *
 * Ojo con los codigos: el backend devuelve 409 cuando ese email YA tiene una
 * solicitud sin cerrar, y eso no es un error del usuario — es "ya te tenemos".
 * Tratarlo como falla generica haria que alguien que insiste crea que el
 * formulario esta roto.
 */
export async function submitPartnerApplication(
  submission: PartnerApplicationSubmission,
): Promise<SubmitPartnerApplicationResult> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/partner-applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
    // La landing puede estar cacheada; esta llamada nunca.
    cache: "no-store",
  });

  if (response.ok) {
    const payload = (await response.json()) as { id: string };
    return { ok: true, id: payload.id };
  }

  if (response.status === 409) return { ok: false, kind: "duplicate" };
  if (response.status === 400) return { ok: false, kind: "invalid" };

  return { ok: false, kind: "unknown" };
}
