import { cn } from "@/lib/utils";

type PhoneFrameProps = {
  readonly children: React.ReactNode;
  readonly className?: string;
  /** Descripción para lectores de pantalla de lo que muestra la pantalla. */
  readonly label: string;
};

/**
 * Marco de iPhone que envuelve las capturas simuladas de la app.
 * Es decorativo: el contenido de adentro se marca `aria-hidden` y la
 * pantalla se describe en una sola frase con `label`.
 */
export function PhoneFrame({ children, className, label }: PhoneFrameProps) {
  return (
    <figure className={cn("m-0 w-[320px] max-w-full", className)}>
      <div className="relative aspect-[320/660] rounded-[3rem] bg-ink p-[0.6rem] shadow-[0_30px_70px_rgba(28,43,28,0.25)]">
        <div
          className="relative size-full overflow-hidden rounded-[2.5rem] bg-[#EEF1EE]"
          aria-hidden="true"
        >
          {/* Isla dinámica */}
          <span className="absolute top-3 left-1/2 z-10 h-[1.6rem] w-[6.25rem] -translate-x-1/2 rounded-full bg-ink" />
          {children}
        </div>
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
