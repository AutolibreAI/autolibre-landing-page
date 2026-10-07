"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS, PROVIDER_ACTIONS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

type ShareButtonProps = {
  readonly label: string;
  readonly copiedLabel: string;
  /** URL canónica del perfil (la que se comparte). */
  readonly url: string;
  readonly title: string;
  /** Slug del proveedor, para medir la acción. */
  readonly provider: string;
  readonly placement: string;
  readonly className?: string;
};

/**
 * Botón "Compartir": usa la hoja nativa (`navigator.share`) si existe y, si
 * no, copia la URL al portapapeles y lo avisa en una región `aria-live`.
 * Isla de cliente porque depende de APIs del navegador. Mide la acción con
 * `track()` directo (no puede usar atributos `data-*`: el click no siempre
 * termina en una acción completada).
 */
export function ShareButton({
  label,
  copiedLabel,
  url,
  title,
  provider,
  placement,
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    track(ANALYTICS_EVENTS.providerActionClicked, {
      action: PROVIDER_ACTIONS.share,
      provider,
      placement,
    });
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Cerrar la hoja de compartir lanza `AbortError`: no es un error.
    }
  }

  return (
    <>
      <button type="button" onClick={onClick} className={cn(className)}>
        <Icon name="share" size={18} strokeWidth={1.8} />
        {label}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}
