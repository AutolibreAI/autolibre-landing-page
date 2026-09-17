/**
 * Código QR de `/descarga`, dibujado inline.
 *
 * Mismo criterio que `Icon` y `StoreLinks`: es uno solo, es fijo, y así no
 * viaja como una imagen que el browser tiene que pedir aparte justo al lado
 * del CTA principal. Hereda el color con `currentColor`.
 *
 * ORIGEN DEL PATH — no editar a mano. Generado una sola vez con el paquete
 * `qrcode` (npm), fuera del proyecto, y pegado acá. La URL no cambia nunca,
 * así que generarlo en runtime sería recalcular una constante en cada request
 * y arrastrar una dependencia al bundle.
 *
 * Hubo antes un codificador propio acá y NO escaneaba: el valor del format
 * info era correcto pero los 15 bits quedaban mal ubicados en la matriz, y el
 * format info es lo primero que lee un escáner. Si alguna vez hay que
 * regenerar esto, usar una librería probada y verificar escaneando con un
 * teléfono real — los chequeos internos no alcanzan.
 *
 * Especificación: versión 3 (29x29 módulos), corrección de errores Q,
 * máscara 5, zona de silencio de 4 módulos incluida en el viewBox.
 * Contenido exacto: `https://autolibre.ai/descarga`
 *
 * Apunta a la página, NO a una tienda: un QR solo no puede servir a iOS y a
 * Android a la vez. Escaneándolo desde la compu, la misma página se abre en el
 * teléfono, que es donde los botones de tienda sí instalan.
 */

const QR_PATH =
  "M4 4h7v1h-7zM12 4h2v1h-2zM15 4h1v1h-1zM17 4h2v1h-2zM21 4h2v1h-2zM26 4h7v1h-7zM4 5h1v1h-1zM10 5h1v1h-1zM12 5h6v1h-6zM19 5h2v1h-2zM26 5h1v1h-1zM32 5h1v1h-1zM4 6h1v1h-1zM6 6h3v1h-3zM10 6h1v1h-1zM13 6h1v1h-1zM16 6h1v1h-1zM19 6h2v1h-2zM22 6h2v1h-2zM26 6h1v1h-1zM28 6h3v1h-3zM32 6h1v1h-1zM4 7h1v1h-1zM6 7h3v1h-3zM10 7h1v1h-1zM13 7h1v1h-1zM16 7h2v1h-2zM21 7h1v1h-1zM26 7h1v1h-1zM28 7h3v1h-3zM32 7h1v1h-1zM4 8h1v1h-1zM6 8h3v1h-3zM10 8h1v1h-1zM13 8h1v1h-1zM16 8h1v1h-1zM19 8h2v1h-2zM22 8h3v1h-3zM26 8h1v1h-1zM28 8h3v1h-3zM32 8h1v1h-1zM4 9h1v1h-1zM10 9h1v1h-1zM16 9h2v1h-2zM19 9h3v1h-3zM24 9h1v1h-1zM26 9h1v1h-1zM32 9h1v1h-1zM4 10h7v1h-7zM12 10h1v1h-1zM14 10h1v1h-1zM16 10h1v1h-1zM18 10h1v1h-1zM20 10h1v1h-1zM22 10h1v1h-1zM24 10h1v1h-1zM26 10h7v1h-7zM14 11h2v1h-2zM19 11h1v1h-1zM24 11h1v1h-1zM5 12h1v1h-1zM10 12h7v1h-7zM18 12h1v1h-1zM20 12h2v1h-2zM24 12h2v1h-2zM31 12h2v1h-2zM4 13h1v1h-1zM7 13h1v1h-1zM13 13h1v1h-1zM16 13h1v1h-1zM18 13h1v1h-1zM20 13h4v1h-4zM27 13h3v1h-3zM31 13h1v1h-1zM4 14h1v1h-1zM6 14h6v1h-6zM13 14h1v1h-1zM15 14h1v1h-1zM18 14h4v1h-4zM24 14h3v1h-3zM28 14h1v1h-1zM30 14h1v1h-1zM4 15h2v1h-2zM7 15h3v1h-3zM12 15h1v1h-1zM15 15h3v1h-3zM20 15h1v1h-1zM26 15h4v1h-4zM5 16h2v1h-2zM9 16h2v1h-2zM15 16h1v1h-1zM19 16h2v1h-2zM23 16h1v1h-1zM25 16h2v1h-2zM29 16h1v1h-1zM31 16h1v1h-1zM5 17h2v1h-2zM8 17h2v1h-2zM11 17h1v1h-1zM17 17h1v1h-1zM19 17h1v1h-1zM22 17h3v1h-3zM26 17h1v1h-1zM28 17h2v1h-2zM32 17h1v1h-1zM7 18h2v1h-2zM10 18h1v1h-1zM12 18h3v1h-3zM16 18h3v1h-3zM22 18h1v1h-1zM24 18h1v1h-1zM27 18h1v1h-1zM31 18h1v1h-1zM5 19h1v1h-1zM7 19h3v1h-3zM11 19h1v1h-1zM13 19h1v1h-1zM16 19h1v1h-1zM18 19h2v1h-2zM24 19h3v1h-3zM28 19h5v1h-5zM4 20h1v1h-1zM6 20h1v1h-1zM10 20h6v1h-6zM17 20h2v1h-2zM22 20h1v1h-1zM29 20h2v1h-2zM4 21h5v1h-5zM11 21h1v1h-1zM13 21h1v1h-1zM16 21h1v1h-1zM18 21h1v1h-1zM20 21h9v1h-9zM32 21h1v1h-1zM4 22h3v1h-3zM8 22h1v1h-1zM10 22h5v1h-5zM16 22h1v1h-1zM20 22h2v1h-2zM23 22h1v1h-1zM30 22h1v1h-1zM32 22h1v1h-1zM4 23h1v1h-1zM7 23h1v1h-1zM11 23h2v1h-2zM16 23h2v1h-2zM19 23h2v1h-2zM22 23h2v1h-2zM25 23h3v1h-3zM29 23h1v1h-1zM31 23h1v1h-1zM4 24h1v1h-1zM6 24h2v1h-2zM9 24h2v1h-2zM12 24h2v1h-2zM15 24h2v1h-2zM20 24h2v1h-2zM24 24h5v1h-5zM30 24h1v1h-1zM32 24h1v1h-1zM12 25h4v1h-4zM17 25h1v1h-1zM19 25h1v1h-1zM21 25h2v1h-2zM24 25h1v1h-1zM28 25h3v1h-3zM4 26h7v1h-7zM12 26h1v1h-1zM14 26h1v1h-1zM16 26h4v1h-4zM21 26h1v1h-1zM23 26h2v1h-2zM26 26h1v1h-1zM28 26h1v1h-1zM4 27h1v1h-1zM10 27h1v1h-1zM13 27h1v1h-1zM17 27h3v1h-3zM21 27h4v1h-4zM28 27h2v1h-2zM32 27h1v1h-1zM4 28h1v1h-1zM6 28h3v1h-3zM10 28h1v1h-1zM14 28h2v1h-2zM17 28h3v1h-3zM21 28h1v1h-1zM23 28h6v1h-6zM31 28h2v1h-2zM4 29h1v1h-1zM6 29h3v1h-3zM10 29h1v1h-1zM13 29h6v1h-6zM21 29h4v1h-4zM27 29h1v1h-1zM30 29h2v1h-2zM4 30h1v1h-1zM6 30h3v1h-3zM10 30h1v1h-1zM13 30h1v1h-1zM16 30h2v1h-2zM19 30h2v1h-2zM22 30h8v1h-8zM31 30h1v1h-1zM4 31h1v1h-1zM10 31h1v1h-1zM12 31h1v1h-1zM14 31h5v1h-5zM20 31h1v1h-1zM26 31h1v1h-1zM28 31h1v1h-1zM30 31h1v1h-1zM32 31h1v1h-1zM4 32h7v1h-7zM13 32h3v1h-3zM19 32h1v1h-1zM21 32h1v1h-1zM23 32h1v1h-1zM26 32h1v1h-1zM28 32h1v1h-1zM30 32h1v1h-1z";

type QrCodeProps = {
  readonly className?: string;
  /** Descripción para lectores de pantalla. Sin esto el QR es ruido. */
  readonly title: string;
};

export function QrCode({ className, title }: QrCodeProps) {
  return (
    <svg
      viewBox="0 0 37 37"
      role="img"
      aria-label={title}
      shapeRendering="crispEdges"
      className={className}
    >
      <path fill="currentColor" d={QR_PATH} />
    </svg>
  );
}
