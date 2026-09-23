import { siteConfig } from "@/lib/seo/config";

/**
 * Link de WhatsApp al número de AutoLibre con un mensaje precargado.
 *
 * El número sale SIEMPRE de `siteConfig.contact.phoneE164`: ningún componente
 * escribe una URL de wa.me a mano. wa.me solo acepta dígitos (sin `+`, sin
 * espacios y sin guiones), de ahí el `replace`.
 *
 * OJO: el QR de `/pedido` (`components/ui/qr-code.tsx`) codifica la URL que
 * sale de acá con el texto `pedidoPage.whatsapp.text`. Si cambia el número o
 * ese texto, hay que regenerar el QR.
 */
export function whatsappUrl(text: string): string {
  const digits = siteConfig.contact.phoneE164.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
