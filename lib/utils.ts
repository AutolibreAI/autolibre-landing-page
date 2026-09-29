import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge no lee `@theme`: un `text-display-sm` que no conoce lo toma
 * como color y lo descarta frente a `text-ink`. Cada `--text-*` custom de
 * `app/globals.css` se registra acá como tamaño de fuente.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display-xs",
        "display-sm",
        "display-md",
        "display-lg",
        "lead",
        "lead-lg",
        "label",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
