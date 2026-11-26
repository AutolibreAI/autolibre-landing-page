"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { savePedidoPrefill } from "@/lib/pedido-prefill";
import { cn } from "@/lib/utils";

type QuotePrefillFormProps = {
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
  readonly submitLabel: string;
  /** `dark`: sobre la banda `action` (input `card`, botón `accent`). `light`: sobre `card`. */
  readonly tone: "dark" | "light";
  /** Atributos de medición del botón (`data-analytics-*`), los arma el server. */
  readonly submitAttributes?: Readonly<Record<`data-${string}`, string | undefined>>;
  readonly className?: string;
};

/**
 * "¿Qué le pasa a tu auto?" + "Pedir propuestas" FUERA de `/pedido`: lleva a
 * `/pedido` con el texto ya cargado en el módulo. Isla hoja: lo único client
 * es guardar el texto (`sessionStorage`, nunca la URL: ver
 * `lib/pedido-prefill.ts`) y navegar.
 *
 * Sin JS es un form GET a `/pedido` sin campos con nombre: llega al pedido
 * igual, con el campo vacío. Label visible solo para lectores de pantalla
 * (como el diseño); el placeholder es un ejemplo, no el label.
 */
export function QuotePrefillForm({
  id,
  label,
  placeholder,
  submitLabel,
  tone,
  submitAttributes,
  className,
}: QuotePrefillFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    savePedidoPrefill(inputRef.current?.value ?? "");
    router.push("/pedido");
  }

  return (
    <form action="/pedido" method="get" onSubmit={onSubmit} className={cn("flex flex-wrap gap-2", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="off"
        maxLength={500}
        placeholder={placeholder}
        className={cn(
          "h-13 min-w-0 flex-[1_1_12.5rem] rounded-full px-5 text-base text-fg placeholder:text-fg-subtle",
          tone === "dark"
            ? "border-0 bg-card"
            : "border border-control-line-strong bg-card hover:border-fg-muted focus-visible:border-action",
        )}
      />
      <Button
        type="submit"
        variant={tone === "dark" ? "accent" : "primary"}
        size="52"
        className={tone === "dark" ? "flex-none" : "w-full"}
        {...submitAttributes}
      >
        {submitLabel}
      </Button>
    </form>
  );
}
