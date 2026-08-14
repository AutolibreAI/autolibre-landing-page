import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

type FormSuccessProps = {
  readonly title: string;
  readonly description: string;
  readonly children?: React.ReactNode;
  readonly onDark?: boolean;
  readonly className?: string;
};

/** Pantalla de confirmación que reemplaza al formulario tras enviarlo. */
export function FormSuccess({
  title,
  description,
  children,
  onDark = false,
  className,
}: FormSuccessProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          onDark ? "bg-white/15 text-white" : "bg-brand/10 text-brand",
        )}
      >
        <Icon name="check" size={24} />
      </span>
      <h3
        className={cn(
          "font-display text-xl font-bold",
          onDark ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "max-w-[34ch] text-sm leading-relaxed",
          onDark ? "text-white/75" : "text-ink/65",
        )}
      >
        {description}
      </p>
      {children}
    </div>
  );
}

/** Mensaje de error de envío. `role="alert"` para que lo anuncie el lector. */
export function FormError({
  message,
  onDark = false,
}: {
  readonly message: string;
  readonly onDark?: boolean;
}) {
  return (
    <p
      role="alert"
      className={cn(
        "text-sm font-medium",
        onDark ? "text-white" : "text-danger",
      )}
    >
      {message}
    </p>
  );
}
