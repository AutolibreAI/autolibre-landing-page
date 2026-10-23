"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

type ShareProfileButtonProps = {
  /** Nombre accesible del botón (solo ícono). */
  readonly label: string;
  /** Avisos para el lector de pantalla tras copiar el link. */
  readonly copiedLabel: string;
  readonly failedLabel: string;
  /** Título que va a la hoja de compartir del sistema. */
  readonly title: string;
};

/**
 * La única isla client del perfil: compartir necesita `navigator.share` (la
 * hoja nativa del teléfono) o, si no está, el portapapeles. Comparte la URL
 * actual, que es la canónica del perfil. Si se copió, se avisa en una región
 * `aria-live` (siempre montada, para que el lector la anuncie) debajo del
 * botón, posicionada en absoluto: no mueve el layout.
 */
export function ShareProfileButton({
  label,
  copiedLabel,
  failedLabel,
  title,
}: ShareProfileButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timeout = window.setTimeout(() => setStatus("idle"), 3000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function share() {
    const url = window.location.href.split("#")[0];

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Cerrar la hoja sin elegir nada no es un error que haya que mostrar.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  const message = status === "copied" ? copiedLabel : status === "failed" ? failedLabel : "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={share}
        aria-label={label}
        title={label}
        className="flex size-12 items-center justify-center rounded-field border border-ink/30 text-ink transition-colors hover:border-brand hover:text-brand"
      >
        <Icon name="share" size={20} strokeWidth={1.8} />
      </button>
      <p
        aria-live="polite"
        className="absolute top-full right-0 mt-2 text-sm whitespace-nowrap text-ink/70"
      >
        {message}
      </p>
    </div>
  );
}
