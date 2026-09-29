"use client";

import { useLayoutEffect, useRef } from "react";
import { Input } from "@/components/ui/form-controls";
import { formatArWhatsappInput } from "@/lib/phone";

type WhatsappInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "inputMode"
> & {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
};

/**
 * `Input` para un WhatsApp argentino sin el `+54`, formateado mientras se
 * escribe (`11 2345-6789`, `221 456-7890`, `2966 45-6789`). Toda la regla
 * vive en `formatArWhatsappInput` (`lib/phone.ts`, pura); acá solo se cablea:
 * se le pasa lo que quedó en el input, el cursor y el sentido del borrado, y
 * después del render se devuelve el cursor a donde corresponde.
 *
 * El valor cambia en el mismo input que se está editando: un lector de
 * pantalla lee lo que se tipea, no anuncia el reformateo (no hay región
 * `aria-live` de por medio).
 */
export function WhatsappInput({ value, onValueChange, ref, ...rest }: WhatsappInputProps) {
  const innerRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);

  // Después de que React escribió el valor formateado, antes de pintar.
  useLayoutEffect(() => {
    const input = innerRef.current;
    const caret = caretRef.current;
    caretRef.current = null;
    if (!input || caret === null || document.activeElement !== input) return;
    input.setSelectionRange(caret, caret);
  }, [value]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const inputType = (event.nativeEvent as InputEvent).inputType ?? "";
    const deletion = inputType.startsWith("deleteContentBackward")
      ? "backward"
      : inputType.startsWith("deleteContentForward")
        ? "forward"
        : undefined;
    const next = formatArWhatsappInput(input.value, input.selectionStart ?? input.value.length, {
      value,
      deletion,
    });
    caretRef.current = next.caret;
    if (next.value === value) {
      // Mismo valor (inserción bloqueada por el tope): React no re-renderiza,
      // así que el cursor se acomoda acá mismo.
      input.value = next.value;
      input.setSelectionRange(next.caret, next.caret);
      caretRef.current = null;
      return;
    }
    onValueChange(next.value);
  }

  return (
    <Input
      {...rest}
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      type="tel"
      inputMode="tel"
      value={value}
      onChange={handleChange}
    />
  );
}
