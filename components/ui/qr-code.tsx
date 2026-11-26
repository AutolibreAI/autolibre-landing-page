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
   * `/descarga` con los UTM del estado "pedido enviado" del módulo de pedido
   * (rediseño 2026-11). Versión 5 (37x37 módulos), corrección de errores M,
   * máscara 2. Contenido exacto:
   * `https://autolibre.ai/descarga?utm_source=web&utm_medium=pedido_enviado`
   *
   * M y no Q como el de arriba: con Q la URL larga pide la versión 6 (41
   * módulos) y cada módulo queda más chico en el mismo lugar. Generado con
   * `qrcode` fuera del proyecto y verificado decodificando el PNG con `jsQR`
   * (devuelve la URL exacta). Igual conviene escanearlo con un teléfono real.
   */
  pedidoEnviado: {
    viewBox: 45,
    path: "M4 4h7v1h-7zM14 4h1v1h-1zM19 4h3v1h-3zM25 4h1v1h-1zM27 4h1v1h-1zM32 4h1v1h-1zM34 4h7v1h-7zM4 5h1v1h-1zM10 5h1v1h-1zM13 5h2v1h-2zM18 5h2v1h-2zM21 5h1v1h-1zM24 5h1v1h-1zM29 5h1v1h-1zM31 5h2v1h-2zM34 5h1v1h-1zM40 5h1v1h-1zM4 6h1v1h-1zM6 6h3v1h-3zM10 6h1v1h-1zM12 6h3v1h-3zM17 6h2v1h-2zM25 6h2v1h-2zM28 6h1v1h-1zM31 6h2v1h-2zM34 6h1v1h-1zM36 6h3v1h-3zM40 6h1v1h-1zM4 7h1v1h-1zM6 7h3v1h-3zM10 7h1v1h-1zM12 7h1v1h-1zM17 7h3v1h-3zM21 7h1v1h-1zM24 7h1v1h-1zM26 7h7v1h-7zM34 7h1v1h-1zM36 7h3v1h-3zM40 7h1v1h-1zM4 8h1v1h-1zM6 8h3v1h-3zM10 8h1v1h-1zM12 8h1v1h-1zM15 8h2v1h-2zM18 8h4v1h-4zM24 8h2v1h-2zM27 8h1v1h-1zM32 8h1v1h-1zM34 8h1v1h-1zM36 8h3v1h-3zM40 8h1v1h-1zM4 9h1v1h-1zM10 9h1v1h-1zM12 9h1v1h-1zM14 9h1v1h-1zM16 9h3v1h-3zM21 9h1v1h-1zM24 9h2v1h-2zM30 9h2v1h-2zM34 9h1v1h-1zM40 9h1v1h-1zM4 10h7v1h-7zM12 10h1v1h-1zM14 10h1v1h-1zM16 10h1v1h-1zM18 10h1v1h-1zM20 10h1v1h-1zM22 10h1v1h-1zM24 10h1v1h-1zM26 10h1v1h-1zM28 10h1v1h-1zM30 10h1v1h-1zM32 10h1v1h-1zM34 10h7v1h-7zM12 11h1v1h-1zM16 11h1v1h-1zM18 11h5v1h-5zM24 11h5v1h-5zM4 12h1v1h-1zM6 12h5v1h-5zM13 12h3v1h-3zM17 12h4v1h-4zM23 12h1v1h-1zM26 12h1v1h-1zM28 12h4v1h-4zM34 12h5v1h-5zM4 13h1v1h-1zM6 13h3v1h-3zM15 13h1v1h-1zM17 13h1v1h-1zM19 13h1v1h-1zM22 13h1v1h-1zM24 13h2v1h-2zM27 13h1v1h-1zM32 13h1v1h-1zM35 13h1v1h-1zM39 13h1v1h-1zM4 14h2v1h-2zM7 14h4v1h-4zM15 14h1v1h-1zM17 14h7v1h-7zM25 14h1v1h-1zM28 14h1v1h-1zM30 14h2v1h-2zM34 14h2v1h-2zM37 14h4v1h-4zM4 15h5v1h-5zM17 15h1v1h-1zM19 15h1v1h-1zM23 15h5v1h-5zM30 15h2v1h-2zM33 15h3v1h-3zM40 15h1v1h-1zM7 16h1v1h-1zM9 16h2v1h-2zM12 16h1v1h-1zM15 16h7v1h-7zM23 16h1v1h-1zM26 16h1v1h-1zM29 16h1v1h-1zM31 16h1v1h-1zM33 16h2v1h-2zM36 16h1v1h-1zM38 16h3v1h-3zM8 17h1v1h-1zM11 17h1v1h-1zM13 17h2v1h-2zM16 17h1v1h-1zM18 17h1v1h-1zM20 17h1v1h-1zM22 17h6v1h-6zM29 17h1v1h-1zM32 17h2v1h-2zM35 17h1v1h-1zM5 18h3v1h-3zM9 18h2v1h-2zM14 18h1v1h-1zM16 18h1v1h-1zM19 18h2v1h-2zM22 18h1v1h-1zM25 18h2v1h-2zM31 18h7v1h-7zM40 18h1v1h-1zM4 19h1v1h-1zM7 19h3v1h-3zM11 19h2v1h-2zM14 19h1v1h-1zM16 19h5v1h-5zM24 19h2v1h-2zM30 19h2v1h-2zM34 19h3v1h-3zM4 20h2v1h-2zM8 20h1v1h-1zM10 20h3v1h-3zM15 20h1v1h-1zM18 20h1v1h-1zM22 20h1v1h-1zM24 20h1v1h-1zM26 20h1v1h-1zM29 20h2v1h-2zM32 20h3v1h-3zM36 20h1v1h-1zM38 20h1v1h-1zM40 20h1v1h-1zM5 21h2v1h-2zM8 21h2v1h-2zM12 21h1v1h-1zM14 21h2v1h-2zM18 21h4v1h-4zM25 21h1v1h-1zM27 21h1v1h-1zM29 21h1v1h-1zM32 21h1v1h-1zM35 21h1v1h-1zM39 21h1v1h-1zM6 22h2v1h-2zM9 22h2v1h-2zM13 22h2v1h-2zM16 22h3v1h-3zM21 22h1v1h-1zM24 22h1v1h-1zM28 22h8v1h-8zM39 22h2v1h-2zM4 23h2v1h-2zM11 23h1v1h-1zM14 23h1v1h-1zM16 23h3v1h-3zM20 23h1v1h-1zM25 23h1v1h-1zM27 23h1v1h-1zM31 23h6v1h-6zM40 23h1v1h-1zM4 24h1v1h-1zM6 24h1v1h-1zM10 24h1v1h-1zM13 24h4v1h-4zM20 24h2v1h-2zM24 24h1v1h-1zM26 24h5v1h-5zM33 24h2v1h-2zM36 24h1v1h-1zM38 24h1v1h-1zM7 25h3v1h-3zM12 25h2v1h-2zM15 25h3v1h-3zM21 25h1v1h-1zM23 25h2v1h-2zM27 25h1v1h-1zM32 25h2v1h-2zM37 25h1v1h-1zM4 26h1v1h-1zM6 26h1v1h-1zM10 26h5v1h-5zM19 26h3v1h-3zM24 26h1v1h-1zM26 26h1v1h-1zM28 26h1v1h-1zM30 26h2v1h-2zM35 26h3v1h-3zM39 26h2v1h-2zM7 27h2v1h-2zM13 27h1v1h-1zM16 27h1v1h-1zM18 27h5v1h-5zM24 27h3v1h-3zM31 27h6v1h-6zM39 27h2v1h-2zM6 28h1v1h-1zM8 28h4v1h-4zM14 28h2v1h-2zM19 28h2v1h-2zM25 28h1v1h-1zM28 28h3v1h-3zM32 28h3v1h-3zM36 28h1v1h-1zM38 28h3v1h-3zM4 29h4v1h-4zM9 29h1v1h-1zM11 29h1v1h-1zM13 29h3v1h-3zM17 29h1v1h-1zM19 29h1v1h-1zM22 29h1v1h-1zM24 29h2v1h-2zM27 29h1v1h-1zM33 29h1v1h-1zM35 29h1v1h-1zM4 30h1v1h-1zM6 30h3v1h-3zM10 30h1v1h-1zM14 30h1v1h-1zM18 30h3v1h-3zM23 30h1v1h-1zM26 30h1v1h-1zM31 30h7v1h-7zM39 30h2v1h-2zM4 31h1v1h-1zM6 31h2v1h-2zM11 31h1v1h-1zM18 31h2v1h-2zM23 31h4v1h-4zM30 31h3v1h-3zM34 31h3v1h-3zM4 32h1v1h-1zM6 32h2v1h-2zM9 32h2v1h-2zM14 32h1v1h-1zM16 32h1v1h-1zM18 32h2v1h-2zM21 32h1v1h-1zM23 32h2v1h-2zM26 32h1v1h-1zM28 32h3v1h-3zM32 32h9v1h-9zM12 33h1v1h-1zM15 33h1v1h-1zM17 33h2v1h-2zM20 33h1v1h-1zM23 33h2v1h-2zM27 33h1v1h-1zM29 33h1v1h-1zM31 33h2v1h-2zM36 33h2v1h-2zM4 34h7v1h-7zM13 34h1v1h-1zM15 34h1v1h-1zM19 34h2v1h-2zM22 34h1v1h-1zM24 34h1v1h-1zM26 34h1v1h-1zM29 34h2v1h-2zM32 34h1v1h-1zM34 34h1v1h-1zM36 34h1v1h-1zM38 34h3v1h-3zM4 35h1v1h-1zM10 35h1v1h-1zM12 35h1v1h-1zM15 35h2v1h-2zM23 35h2v1h-2zM27 35h1v1h-1zM30 35h1v1h-1zM32 35h1v1h-1zM36 35h2v1h-2zM39 35h1v1h-1zM4 36h1v1h-1zM6 36h3v1h-3zM10 36h1v1h-1zM12 36h1v1h-1zM14 36h2v1h-2zM18 36h2v1h-2zM22 36h7v1h-7zM30 36h7v1h-7zM38 36h3v1h-3zM4 37h1v1h-1zM6 37h3v1h-3zM10 37h1v1h-1zM12 37h3v1h-3zM16 37h1v1h-1zM18 37h3v1h-3zM25 37h1v1h-1zM27 37h1v1h-1zM29 37h2v1h-2zM32 37h3v1h-3zM36 37h1v1h-1zM38 37h1v1h-1zM40 37h1v1h-1zM4 38h1v1h-1zM6 38h3v1h-3zM10 38h1v1h-1zM12 38h1v1h-1zM15 38h2v1h-2zM18 38h1v1h-1zM21 38h2v1h-2zM24 38h2v1h-2zM32 38h1v1h-1zM39 38h2v1h-2zM4 39h1v1h-1zM10 39h1v1h-1zM13 39h1v1h-1zM15 39h2v1h-2zM20 39h1v1h-1zM22 39h1v1h-1zM25 39h3v1h-3zM30 39h5v1h-5zM36 39h1v1h-1zM40 39h1v1h-1zM4 40h7v1h-7zM12 40h1v1h-1zM15 40h1v1h-1zM18 40h1v1h-1zM21 40h1v1h-1zM24 40h1v1h-1zM27 40h3v1h-3zM33 40h2v1h-2zM36 40h1v1h-1zM39 40h2v1h-2z",
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
