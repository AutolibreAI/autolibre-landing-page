import type { IconName } from "@/lib/content/types";

type IconProps = {
  readonly name: IconName;
  readonly className?: string;
  readonly size?: number;
  /** Grosor del trazo. El default es el de los íconos de línea del sitio. */
  readonly strokeWidth?: number;
};

/**
 * Íconos de línea del diseño. Se dibujan inline (no como dependencia de
 * íconos) porque son pocos, fijos, y así no viajan kilobytes de más al
 * cliente. Heredan el color con `currentColor`.
 */
const paths: Record<IconName, React.ReactNode> = {
  document: (
    <>
      <rect x="5" y="2.5" width="14" height="19" rx="1.5" />
      <line x1="8" y1="7.5" x2="16" y2="7.5" />
      <line x1="8" y1="11.5" x2="16" y2="11.5" />
      <line x1="8" y1="15.5" x2="13" y2="15.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9z" />
      <path d="M10 17.5a2 2 0 0 0 4 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  car: (
    <>
      <path d="M4 17V9a2 2 0 0 1 2-2h1.5l1.2-2h6.6l1.2 2H18a2 2 0 0 1 2 2v8" />
      <path d="M4 17h16" />
      <circle cx="7.5" cy="17" r="1.6" />
      <circle cx="16.5" cy="17" r="1.6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.2" />
    </>
  ),
  "arrow-right": <path d="M4 12h14M14 6l6 6-6 6" />,
  "arrow-left": <path d="M19 12H5M11 18l-6-6 6-6" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  /** Globo de chat: el contorno del de WhatsApp, sin el tubo. */
  chat: <path d="M4 20l1.3-3.9A8.5 8.5 0 1 1 8.2 19z" />,
  /** Globo + tubo: se lee como WhatsApp sin usar el logo de la marca. */
  whatsapp: (
    <>
      <path d="M4 20l1.3-3.9A8.5 8.5 0 1 1 8.2 19z" />
      <path d="M9.2 8.6c-.3 2.9 3.2 6.4 6.2 6.2l.9-1.6-2-1-1 .9c-1-.4-2-1.4-2.4-2.4l.9-1-1-2z" />
    </>
  ),
  /** Arco de carga: se anima con `animate-spin` desde afuera. */
  spinner: <path d="M21 12a9 9 0 0 0-9-9" />,
  /** "Todavía no": el reemplazo quieto del spinner con movimiento reducido. */
  ellipsis: (
    <>
      <circle cx="6" cy="12" r="0.6" />
      <circle cx="12" cy="12" r="0.6" />
      <circle cx="18" cy="12" r="0.6" />
    </>
  ),
  /** Aviso neutro (no es un error). */
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5v.01" />
    </>
  ),
  /** Error de un campo. */
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16v.01" />
    </>
  ),
  /** Foto pendiente: el marco vacío de una imagen. */
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M21 16l-5-5-8.5 8.5" />
    </>
  ),
  /** LinkedIn en línea: el "in" dentro del cuadrado, sin el logo de la marca. */
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M8 10.5v6M8 7.5v.01M12 16.5v-6M12 13a2.5 2.5 0 0 1 5 0v3.5" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  /** Dos personas: la de adelante entera, la de atrás asomando. */
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19.5a6 6 0 0 1 12 0" />
      <path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.2a6 6 0 0 1 3.5 5.3" />
    </>
  ),
  smartphone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.2" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />
  ),
  /** Escudo con tilde: seguros (cobertura), sin logo de ninguna aseguradora. */
  shield: (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  /**
   * Hoja con la esquina doblada: un acta o una boleta (multas). Distinta de
   * `document`, que es la hoja lisa de la documentación del auto.
   */
  "file-text": (
    <>
      <path d="M14 2.5H7A1.5 1.5 0 0 0 5.5 4v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V7z" />
      <path d="M14 2.5V7h4.5M8.5 12.5h7M8.5 16h7" />
    </>
  ),
  /** Engranaje: una pieza mecánica (repuestos). */
  cog: (
    <>
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 6V3M12 21v-3M6 12H3M21 12h-3M16.2 7.8l2.1-2.1M5.6 18.4l2.1-2.1M7.8 7.8 5.6 5.6M18.4 18.4l-2.1-2.1" />
    </>
  ),
  "credit-card": (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19M6.5 15h4" />
    </>
  ),
  /** Compartir: flecha saliendo de una bandeja (el gesto de iOS, sin logo). */
  share: (
    <>
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
      <path d="M5 11.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7.5" />
    </>
  ),
};

export function Icon({
  name,
  className,
  size = 30,
  strokeWidth = 1.6,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
