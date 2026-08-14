import type { IconName } from "@/lib/content/types";

type IconProps = {
  readonly name: IconName;
  readonly className?: string;
  readonly size?: number;
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
  check: <path d="M4 12.5l5 5L20 6.5" />,
};

export function Icon({ name, className, size = 30 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
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
