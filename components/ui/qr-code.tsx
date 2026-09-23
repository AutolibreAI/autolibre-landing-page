/**
 * Códigos QR del sitio, dibujados inline.
 *
 * Mismo criterio que `Icon` y `StoreLinks`: son pocos, son fijos, y así no
 * viajan como una imagen que el browser tiene que pedir aparte justo al lado
 * del CTA principal. Heredan el color con `currentColor`.
 *
 * ORIGEN DE LOS PATHS — no editar a mano. Cada uno se generó una sola vez con
 * el paquete `qrcode` (npm), instalado FUERA del proyecto (nunca en
 * package.json), y se pegó acá como filas de rectángulos de 1 módulo de alto.
 * Las URLs no cambian nunca, así que generarlos en runtime sería recalcular
 * una constante en cada request y arrastrar una dependencia al bundle.
 *
 * Hubo antes un codificador propio acá y NO escaneaba: el valor del format
 * info era correcto pero los 15 bits quedaban mal ubicados en la matriz, y el
 * format info es lo primero que lee un escáner. Si alguna vez hay que
 * regenerar uno, usar una librería probada y verificar escaneando con un
 * teléfono real — los chequeos internos no alcanzan.
 *
 * La zona de silencio (4 módulos por lado) está incluida en el `viewBox`.
 */

type QrCodeData = {
  /** Lado del `viewBox`: módulos del símbolo + 8 de zona de silencio. */
  readonly viewBox: number;
  readonly path: string;
};

const QR_CODES = {
  /**
   * `/descarga`. Versión 3 (29x29 módulos), corrección de errores Q,
   * máscara 5. Contenido exacto: `https://autolibre.ai/descarga`
   *
   * Apunta a la página, NO a una tienda: un QR solo no puede servir a iOS y
   * a Android a la vez. Escaneándolo desde la compu, la misma página se abre
   * en el teléfono, que es donde los botones de tienda sí instalan.
   */
  descarga: {
    viewBox: 37,
    path: "M4 4h7v1h-7zM12 4h2v1h-2zM15 4h1v1h-1zM17 4h2v1h-2zM21 4h2v1h-2zM26 4h7v1h-7zM4 5h1v1h-1zM10 5h1v1h-1zM12 5h6v1h-6zM19 5h2v1h-2zM26 5h1v1h-1zM32 5h1v1h-1zM4 6h1v1h-1zM6 6h3v1h-3zM10 6h1v1h-1zM13 6h1v1h-1zM16 6h1v1h-1zM19 6h2v1h-2zM22 6h2v1h-2zM26 6h1v1h-1zM28 6h3v1h-3zM32 6h1v1h-1zM4 7h1v1h-1zM6 7h3v1h-3zM10 7h1v1h-1zM13 7h1v1h-1zM16 7h2v1h-2zM21 7h1v1h-1zM26 7h1v1h-1zM28 7h3v1h-3zM32 7h1v1h-1zM4 8h1v1h-1zM6 8h3v1h-3zM10 8h1v1h-1zM13 8h1v1h-1zM16 8h1v1h-1zM19 8h2v1h-2zM22 8h3v1h-3zM26 8h1v1h-1zM28 8h3v1h-3zM32 8h1v1h-1zM4 9h1v1h-1zM10 9h1v1h-1zM16 9h2v1h-2zM19 9h3v1h-3zM24 9h1v1h-1zM26 9h1v1h-1zM32 9h1v1h-1zM4 10h7v1h-7zM12 10h1v1h-1zM14 10h1v1h-1zM16 10h1v1h-1zM18 10h1v1h-1zM20 10h1v1h-1zM22 10h1v1h-1zM24 10h1v1h-1zM26 10h7v1h-7zM14 11h2v1h-2zM19 11h1v1h-1zM24 11h1v1h-1zM5 12h1v1h-1zM10 12h7v1h-7zM18 12h1v1h-1zM20 12h2v1h-2zM24 12h2v1h-2zM31 12h2v1h-2zM4 13h1v1h-1zM7 13h1v1h-1zM13 13h1v1h-1zM16 13h1v1h-1zM18 13h1v1h-1zM20 13h4v1h-4zM27 13h3v1h-3zM31 13h1v1h-1zM4 14h1v1h-1zM6 14h6v1h-6zM13 14h1v1h-1zM15 14h1v1h-1zM18 14h4v1h-4zM24 14h3v1h-3zM28 14h1v1h-1zM30 14h1v1h-1zM4 15h2v1h-2zM7 15h3v1h-3zM12 15h1v1h-1zM15 15h3v1h-3zM20 15h1v1h-1zM26 15h4v1h-4zM5 16h2v1h-2zM9 16h2v1h-2zM15 16h1v1h-1zM19 16h2v1h-2zM23 16h1v1h-1zM25 16h2v1h-2zM29 16h1v1h-1zM31 16h1v1h-1zM5 17h2v1h-2zM8 17h2v1h-2zM11 17h1v1h-1zM17 17h1v1h-1zM19 17h1v1h-1zM22 17h3v1h-3zM26 17h1v1h-1zM28 17h2v1h-2zM32 17h1v1h-1zM7 18h2v1h-2zM10 18h1v1h-1zM12 18h3v1h-3zM16 18h3v1h-3zM22 18h1v1h-1zM24 18h1v1h-1zM27 18h1v1h-1zM31 18h1v1h-1zM5 19h1v1h-1zM7 19h3v1h-3zM11 19h1v1h-1zM13 19h1v1h-1zM16 19h1v1h-1zM18 19h2v1h-2zM24 19h3v1h-3zM28 19h5v1h-5zM4 20h1v1h-1zM6 20h1v1h-1zM10 20h6v1h-6zM17 20h2v1h-2zM22 20h1v1h-1zM29 20h2v1h-2zM4 21h5v1h-5zM11 21h1v1h-1zM13 21h1v1h-1zM16 21h1v1h-1zM18 21h1v1h-1zM20 21h9v1h-9zM32 21h1v1h-1zM4 22h3v1h-3zM8 22h1v1h-1zM10 22h5v1h-5zM16 22h1v1h-1zM20 22h2v1h-2zM23 22h1v1h-1zM30 22h1v1h-1zM32 22h1v1h-1zM4 23h1v1h-1zM7 23h1v1h-1zM11 23h2v1h-2zM16 23h2v1h-2zM19 23h2v1h-2zM22 23h2v1h-2zM25 23h3v1h-3zM29 23h1v1h-1zM31 23h1v1h-1zM4 24h1v1h-1zM6 24h2v1h-2zM9 24h2v1h-2zM12 24h2v1h-2zM15 24h2v1h-2zM20 24h2v1h-2zM24 24h5v1h-5zM30 24h1v1h-1zM32 24h1v1h-1zM12 25h4v1h-4zM17 25h1v1h-1zM19 25h1v1h-1zM21 25h2v1h-2zM24 25h1v1h-1zM28 25h3v1h-3zM4 26h7v1h-7zM12 26h1v1h-1zM14 26h1v1h-1zM16 26h4v1h-4zM21 26h1v1h-1zM23 26h2v1h-2zM26 26h1v1h-1zM28 26h1v1h-1zM4 27h1v1h-1zM10 27h1v1h-1zM13 27h1v1h-1zM17 27h3v1h-3zM21 27h4v1h-4zM28 27h2v1h-2zM32 27h1v1h-1zM4 28h1v1h-1zM6 28h3v1h-3zM10 28h1v1h-1zM14 28h2v1h-2zM17 28h3v1h-3zM21 28h1v1h-1zM23 28h6v1h-6zM31 28h2v1h-2zM4 29h1v1h-1zM6 29h3v1h-3zM10 29h1v1h-1zM13 29h6v1h-6zM21 29h4v1h-4zM27 29h1v1h-1zM30 29h2v1h-2zM4 30h1v1h-1zM6 30h3v1h-3zM10 30h1v1h-1zM13 30h1v1h-1zM16 30h2v1h-2zM19 30h2v1h-2zM22 30h8v1h-8zM31 30h1v1h-1zM4 31h1v1h-1zM10 31h1v1h-1zM12 31h1v1h-1zM14 31h5v1h-5zM20 31h1v1h-1zM26 31h1v1h-1zM28 31h1v1h-1zM30 31h1v1h-1zM32 31h1v1h-1zM4 32h7v1h-7zM13 32h3v1h-3zM19 32h1v1h-1zM21 32h1v1h-1zM23 32h1v1h-1zM26 32h1v1h-1zM28 32h1v1h-1zM30 32h1v1h-1z",
  },
  /**
   * `/pedido`, bloque "¿Estás en la compu?". Versión 6 (41x41 módulos),
   * corrección de errores M, máscara 2. Contenido exacto:
   * `https://wa.me/5491172804347?text=%C2%A1Hola!%20Quiero%20pedir%20un%20presupuesto%20para%20mi%20auto.`
   *
   * Es `whatsappUrl(pedidoPage.whatsapp.text)` (lib/whatsapp.ts +
   * lib/content/presupuesto.ts): el mismo chat precargado que abren los
   * botones de WhatsApp de la página. Si cambia el número de
   * `siteConfig.contact.phoneE164` o ese texto, HAY QUE REGENERARLO.
   * Corrección M y no Q: con Q la URL pedía versión 8 (49 módulos) y los
   * módulos quedaban demasiado chicos para el tamaño en que se muestra.
   */
  pedidoWhatsapp: {
    viewBox: 49,
    path: "M4 4h7v1h-7zM14 4h2v1h-2zM18 4h3v1h-3zM22 4h1v1h-1zM24 4h1v1h-1zM26 4h1v1h-1zM28 4h1v1h-1zM30 4h2v1h-2zM38 4h7v1h-7zM4 5h1v1h-1zM10 5h1v1h-1zM15 5h2v1h-2zM18 5h3v1h-3zM22 5h2v1h-2zM26 5h2v1h-2zM32 5h1v1h-1zM35 5h1v1h-1zM38 5h1v1h-1zM44 5h1v1h-1zM4 6h1v1h-1zM6 6h3v1h-3zM10 6h1v1h-1zM12 6h1v1h-1zM15 6h1v1h-1zM17 6h2v1h-2zM24 6h1v1h-1zM29 6h3v1h-3zM33 6h2v1h-2zM38 6h1v1h-1zM40 6h3v1h-3zM44 6h1v1h-1zM4 7h1v1h-1zM6 7h3v1h-3zM10 7h1v1h-1zM12 7h1v1h-1zM14 7h1v1h-1zM16 7h2v1h-2zM20 7h1v1h-1zM22 7h1v1h-1zM25 7h2v1h-2zM28 7h2v1h-2zM32 7h1v1h-1zM35 7h1v1h-1zM38 7h1v1h-1zM40 7h3v1h-3zM44 7h1v1h-1zM4 8h1v1h-1zM6 8h3v1h-3zM10 8h1v1h-1zM12 8h2v1h-2zM15 8h7v1h-7zM24 8h2v1h-2zM27 8h5v1h-5zM34 8h2v1h-2zM38 8h1v1h-1zM40 8h3v1h-3zM44 8h1v1h-1zM4 9h1v1h-1zM10 9h1v1h-1zM12 9h1v1h-1zM14 9h2v1h-2zM19 9h2v1h-2zM23 9h1v1h-1zM25 9h1v1h-1zM27 9h1v1h-1zM29 9h2v1h-2zM33 9h1v1h-1zM36 9h1v1h-1zM38 9h1v1h-1zM44 9h1v1h-1zM4 10h7v1h-7zM12 10h1v1h-1zM14 10h1v1h-1zM16 10h1v1h-1zM18 10h1v1h-1zM20 10h1v1h-1zM22 10h1v1h-1zM24 10h1v1h-1zM26 10h1v1h-1zM28 10h1v1h-1zM30 10h1v1h-1zM32 10h1v1h-1zM34 10h1v1h-1zM36 10h1v1h-1zM38 10h7v1h-7zM12 11h1v1h-1zM15 11h1v1h-1zM18 11h1v1h-1zM20 11h2v1h-2zM24 11h1v1h-1zM26 11h1v1h-1zM30 11h3v1h-3zM36 11h1v1h-1zM4 12h1v1h-1zM6 12h5v1h-5zM13 12h1v1h-1zM19 12h2v1h-2zM24 12h2v1h-2zM31 12h1v1h-1zM33 12h1v1h-1zM36 12h1v1h-1zM38 12h5v1h-5zM6 13h2v1h-2zM9 13h1v1h-1zM11 13h3v1h-3zM15 13h1v1h-1zM17 13h3v1h-3zM21 13h1v1h-1zM23 13h3v1h-3zM30 13h1v1h-1zM34 13h4v1h-4zM39 13h1v1h-1zM42 13h2v1h-2zM5 14h1v1h-1zM8 14h1v1h-1zM10 14h1v1h-1zM14 14h3v1h-3zM18 14h3v1h-3zM22 14h2v1h-2zM25 14h2v1h-2zM30 14h3v1h-3zM34 14h1v1h-1zM36 14h3v1h-3zM40 14h1v1h-1zM44 14h1v1h-1zM5 15h1v1h-1zM7 15h1v1h-1zM9 15h1v1h-1zM12 15h1v1h-1zM16 15h1v1h-1zM18 15h1v1h-1zM20 15h3v1h-3zM24 15h1v1h-1zM26 15h1v1h-1zM29 15h1v1h-1zM31 15h3v1h-3zM35 15h3v1h-3zM39 15h3v1h-3zM4 16h1v1h-1zM7 16h1v1h-1zM9 16h9v1h-9zM20 16h1v1h-1zM25 16h1v1h-1zM27 16h1v1h-1zM30 16h7v1h-7zM38 16h1v1h-1zM40 16h3v1h-3zM8 17h1v1h-1zM11 17h4v1h-4zM16 17h3v1h-3zM20 17h3v1h-3zM24 17h3v1h-3zM28 17h1v1h-1zM31 17h2v1h-2zM37 17h1v1h-1zM39 17h1v1h-1zM5 18h3v1h-3zM10 18h1v1h-1zM12 18h4v1h-4zM17 18h1v1h-1zM19 18h2v1h-2zM22 18h2v1h-2zM25 18h2v1h-2zM30 18h1v1h-1zM32 18h1v1h-1zM35 18h1v1h-1zM37 18h1v1h-1zM40 18h1v1h-1zM43 18h2v1h-2zM5 19h1v1h-1zM7 19h2v1h-2zM12 19h2v1h-2zM15 19h1v1h-1zM17 19h1v1h-1zM19 19h1v1h-1zM21 19h4v1h-4zM26 19h1v1h-1zM28 19h7v1h-7zM36 19h1v1h-1zM38 19h2v1h-2zM41 19h2v1h-2zM4 20h1v1h-1zM7 20h1v1h-1zM9 20h3v1h-3zM13 20h1v1h-1zM15 20h1v1h-1zM19 20h1v1h-1zM23 20h4v1h-4zM30 20h2v1h-2zM36 20h2v1h-2zM39 20h1v1h-1zM41 20h2v1h-2zM5 21h1v1h-1zM17 21h1v1h-1zM19 21h4v1h-4zM25 21h1v1h-1zM29 21h1v1h-1zM31 21h5v1h-5zM38 21h3v1h-3zM4 22h3v1h-3zM9 22h2v1h-2zM12 22h1v1h-1zM16 22h1v1h-1zM19 22h1v1h-1zM21 22h1v1h-1zM23 22h1v1h-1zM25 22h1v1h-1zM27 22h1v1h-1zM30 22h1v1h-1zM32 22h1v1h-1zM34 22h5v1h-5zM40 22h2v1h-2zM44 22h1v1h-1zM4 23h2v1h-2zM8 23h2v1h-2zM11 23h1v1h-1zM13 23h1v1h-1zM15 23h1v1h-1zM19 23h4v1h-4zM24 23h3v1h-3zM28 23h2v1h-2zM31 23h1v1h-1zM33 23h2v1h-2zM36 23h2v1h-2zM40 23h1v1h-1zM42 23h1v1h-1zM6 24h1v1h-1zM8 24h1v1h-1zM10 24h1v1h-1zM12 24h2v1h-2zM15 24h1v1h-1zM23 24h3v1h-3zM29 24h1v1h-1zM31 24h1v1h-1zM37 24h2v1h-2zM40 24h1v1h-1zM42 24h2v1h-2zM4 25h3v1h-3zM8 25h2v1h-2zM11 25h6v1h-6zM18 25h1v1h-1zM22 25h1v1h-1zM25 25h2v1h-2zM30 25h2v1h-2zM34 25h1v1h-1zM36 25h1v1h-1zM39 25h1v1h-1zM42 25h3v1h-3zM5 26h1v1h-1zM8 26h1v1h-1zM10 26h2v1h-2zM19 26h1v1h-1zM22 26h2v1h-2zM26 26h2v1h-2zM34 26h2v1h-2zM37 26h2v1h-2zM40 26h2v1h-2zM5 27h1v1h-1zM8 27h1v1h-1zM11 27h1v1h-1zM15 27h1v1h-1zM17 27h2v1h-2zM20 27h2v1h-2zM24 27h1v1h-1zM31 27h2v1h-2zM36 27h2v1h-2zM39 27h2v1h-2zM42 27h3v1h-3zM6 28h2v1h-2zM9 28h2v1h-2zM13 28h1v1h-1zM20 28h1v1h-1zM22 28h2v1h-2zM25 28h2v1h-2zM29 28h1v1h-1zM31 28h1v1h-1zM33 28h2v1h-2zM38 28h3v1h-3zM44 28h1v1h-1zM7 29h1v1h-1zM9 29h1v1h-1zM11 29h1v1h-1zM13 29h1v1h-1zM15 29h3v1h-3zM19 29h1v1h-1zM23 29h1v1h-1zM25 29h1v1h-1zM28 29h3v1h-3zM32 29h4v1h-4zM37 29h1v1h-1zM41 29h1v1h-1zM43 29h1v1h-1zM4 30h4v1h-4zM10 30h2v1h-2zM14 30h1v1h-1zM16 30h1v1h-1zM18 30h1v1h-1zM20 30h1v1h-1zM22 30h1v1h-1zM24 30h3v1h-3zM31 30h2v1h-2zM36 30h2v1h-2zM40 30h1v1h-1zM43 30h2v1h-2zM4 31h1v1h-1zM9 31h1v1h-1zM11 31h1v1h-1zM14 31h3v1h-3zM19 31h3v1h-3zM26 31h1v1h-1zM29 31h1v1h-1zM31 31h3v1h-3zM35 31h2v1h-2zM41 31h1v1h-1zM5 32h2v1h-2zM10 32h2v1h-2zM13 32h5v1h-5zM24 32h3v1h-3zM28 32h1v1h-1zM30 32h1v1h-1zM32 32h4v1h-4zM37 32h2v1h-2zM40 32h4v1h-4zM4 33h1v1h-1zM7 33h3v1h-3zM12 33h1v1h-1zM15 33h1v1h-1zM17 33h2v1h-2zM22 33h1v1h-1zM29 33h1v1h-1zM31 33h3v1h-3zM35 33h1v1h-1zM38 33h1v1h-1zM40 33h2v1h-2zM4 34h1v1h-1zM6 34h3v1h-3zM10 34h2v1h-2zM13 34h1v1h-1zM17 34h1v1h-1zM20 34h1v1h-1zM22 34h1v1h-1zM24 34h5v1h-5zM30 34h1v1h-1zM32 34h1v1h-1zM34 34h7v1h-7zM43 34h2v1h-2zM4 35h1v1h-1zM6 35h1v1h-1zM9 35h1v1h-1zM11 35h1v1h-1zM14 35h3v1h-3zM19 35h1v1h-1zM21 35h1v1h-1zM26 35h2v1h-2zM29 35h6v1h-6zM36 35h5v1h-5zM42 35h1v1h-1zM4 36h1v1h-1zM8 36h7v1h-7zM16 36h1v1h-1zM18 36h2v1h-2zM24 36h5v1h-5zM30 36h2v1h-2zM36 36h6v1h-6zM43 36h1v1h-1zM12 37h2v1h-2zM16 37h2v1h-2zM19 37h2v1h-2zM22 37h2v1h-2zM26 37h1v1h-1zM29 37h4v1h-4zM34 37h3v1h-3zM40 37h2v1h-2zM43 37h2v1h-2zM4 38h7v1h-7zM13 38h4v1h-4zM22 38h3v1h-3zM26 38h2v1h-2zM32 38h1v1h-1zM34 38h1v1h-1zM36 38h1v1h-1zM38 38h1v1h-1zM40 38h2v1h-2zM44 38h1v1h-1zM4 39h1v1h-1zM10 39h1v1h-1zM12 39h1v1h-1zM14 39h3v1h-3zM31 39h1v1h-1zM33 39h1v1h-1zM35 39h2v1h-2zM40 39h3v1h-3zM4 40h1v1h-1zM6 40h3v1h-3zM10 40h1v1h-1zM12 40h1v1h-1zM14 40h1v1h-1zM16 40h2v1h-2zM22 40h1v1h-1zM24 40h3v1h-3zM28 40h1v1h-1zM31 40h1v1h-1zM34 40h7v1h-7zM4 41h1v1h-1zM6 41h3v1h-3zM10 41h1v1h-1zM12 41h2v1h-2zM15 41h1v1h-1zM17 41h3v1h-3zM21 41h1v1h-1zM23 41h1v1h-1zM31 41h1v1h-1zM33 41h3v1h-3zM37 41h1v1h-1zM39 41h1v1h-1zM41 41h1v1h-1zM43 41h1v1h-1zM4 42h1v1h-1zM6 42h3v1h-3zM10 42h1v1h-1zM12 42h1v1h-1zM14 42h3v1h-3zM18 42h1v1h-1zM20 42h1v1h-1zM22 42h4v1h-4zM29 42h2v1h-2zM32 42h2v1h-2zM37 42h4v1h-4zM43 42h1v1h-1zM4 43h1v1h-1zM10 43h1v1h-1zM13 43h2v1h-2zM17 43h1v1h-1zM19 43h1v1h-1zM21 43h2v1h-2zM26 43h1v1h-1zM28 43h1v1h-1zM31 43h1v1h-1zM34 43h1v1h-1zM40 43h1v1h-1zM42 43h2v1h-2zM4 44h7v1h-7zM12 44h2v1h-2zM15 44h1v1h-1zM18 44h4v1h-4zM23 44h4v1h-4zM28 44h2v1h-2zM31 44h1v1h-1zM33 44h1v1h-1zM39 44h3v1h-3z",
  },
} as const satisfies Record<string, QrCodeData>;

export type QrCodeName = keyof typeof QR_CODES;

type QrCodeProps = {
  readonly className?: string;
  /** Descripción para lectores de pantalla. Sin esto el QR es ruido. */
  readonly title: string;
  /** Qué código dibujar. Default `descarga` (el original de `/descarga`). */
  readonly code?: QrCodeName;
};

export function QrCode({ className, title, code = "descarga" }: QrCodeProps) {
  const { viewBox, path } = QR_CODES[code];
  return (
    <svg
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      role="img"
      aria-label={title}
      shapeRendering="crispEdges"
      className={className}
    >
      <path fill="currentColor" d={path} />
    </svg>
  );
}
