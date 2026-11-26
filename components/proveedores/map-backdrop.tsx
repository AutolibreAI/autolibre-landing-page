/**
 * Fondo de un mapa mientras no llegó la imagen (o si Google la rechaza):
 * unas calles dibujadas sobre el tono del mapa, como el lienzo del diseño.
 * Decorativo (`aria-hidden`), SVG inline, sin red.
 */
export function MapBackdrop() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 460 460"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full text-card"
    >
      <path d="M0 300 C120 270 240 340 460 240" stroke="currentColor" strokeWidth="12" fill="none" />
      <path d="M170 0 C190 150 140 290 200 460" stroke="currentColor" strokeWidth="9" fill="none" />
      <path d="M330 0 C300 170 380 320 350 460" stroke="currentColor" strokeWidth="7" fill="none" />
      <path d="M0 130 C150 170 300 90 460 120" stroke="currentColor" strokeWidth="5" fill="none" />
    </svg>
  );
}
