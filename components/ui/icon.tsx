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
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
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
