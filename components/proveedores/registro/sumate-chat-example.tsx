import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { providersContent } from "@/lib/content/providers";

const chat = providersContent.sumate.hero.preview;

/** Globo: 14px, texto `on-dark` (contrastes en `app/globals.css`, tokens `wa-dark-*`). */
const bubble = "rounded-lg px-3 py-2 text-sm leading-snug text-on-dark";
/** Hora al pie del globo (y el doble tilde en el saliente). */
const stamp = "mt-1 flex items-center justify-end gap-1 text-xs text-on-dark-muted";
/** "Botón" de respuesta rápida: dibujado, NO interactivo (un `<li>`, no un `<button>`). */
const quickReply = "border-t border-wa-dark px-3 py-2.5 text-center text-sm font-semibold";

/** Doble tilde de "entregado". Decorativo. */
function DoubleCheck() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2 12.5l4.5 4.5L16 7.5M11 15.5l1.5 1.5L22 7.5" />
    </svg>
  );
}

/**
 * Ejemplo ILUSTRATIVO de cómo le llega un pedido al negocio: el chat
 * de WhatsApp de AutoLibre en tema oscuro, dibujado en HTML (Server Component, sin JS):
 * todo el texto está en el HTML del server, es nítido y se adapta al ancho.
 *
 * - Es una `<figure>` con su `<figcaption>` ("Ejemplo ilustrativo · datos
 *   ficticios"): los datos NO son de un pedido real (ver `PRODUCT.md`).
 * - Se lee como conversación: los mensajes son una `<ol>`, cada uno con quién
 *   habla en `sr-only`; los datos del pedido, una `<dl>`.
 * - Nada es interactivo: las respuestas rápidas y los íconos de la cabecera
 *   son dibujo (sin `<button>` ni foco). Sin headings: el título del pedido
 *   es un `<strong>`.
 * - Los globos dejan margen del lado contrario (`mr-*`/`ml-*`) en lugar de un
 *   `max-width`: en celular ocupan casi todo el ancho y nunca desbordan.
 */
export function SumateChatExample() {
  const { offer, reply, details } = chat;

  return (
    <figure className="overflow-hidden rounded-2xl bg-wa-dark">
      <div className="flex items-center gap-3 bg-wa-dark-in px-4 py-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white">
          <Image src="/brand/isotype.png" alt="" width={450} height={407} sizes="24px" className="h-5 w-auto" />
        </span>
        <p className="min-w-0 flex-1 truncate text-base font-semibold text-white">{chat.contactName}</p>
        <span aria-hidden="true" className="flex shrink-0 items-center gap-4 text-on-dark">
          <Icon name="search" size={20} strokeWidth={2} />
          {/* Menú de tres puntos: los puntos de `ellipsis`, en vertical y engrosados. */}
          <Icon name="ellipsis" size={20} strokeWidth={3} className="rotate-90" />
        </span>
      </div>

      <div className="flex flex-col gap-3 px-3 py-4 sm:px-4">
        <p className="self-center rounded-md bg-wa-dark-in px-2.5 py-1 text-xs font-medium tracking-wide text-on-dark-muted uppercase">
          {chat.day}
        </p>

        <ol aria-label={chat.label} className="flex flex-col gap-3">
          <li className="flex flex-col">
            <div className="mr-6 self-start overflow-hidden rounded-lg rounded-tl-sm bg-wa-dark-in sm:mr-12">
              <div className={bubble}>
                <p>
                  <span className="sr-only">{chat.contactPrefix} </span>
                  {offer.text}
                </p>
                <p className={stamp}>{offer.time}</p>
              </div>
              <ul aria-label={offer.repliesLabel}>
                <li className={`${quickReply} text-on-dark-subtle`}>{offer.accept}</li>
                <li className={`${quickReply} text-whatsapp-brand`}>{offer.decline}</li>
              </ul>
            </div>
          </li>

          <li className="flex flex-col">
            <div className={`${bubble} ml-6 self-end rounded-tr-sm bg-wa-dark-out sm:ml-12`}>
              <span className="sr-only">{chat.youPrefix} </span>
              <blockquote className="rounded-md border-l-4 border-wa-dark-accent bg-wa-dark-quote px-2.5 py-1.5">
                <p className="text-xs font-semibold text-wa-dark-accent">{chat.contactName}</p>
                <p className="line-clamp-3 text-xs leading-snug">{offer.text}</p>
              </blockquote>
              <p className="mt-1.5">{reply.text}</p>
              <p className={stamp}>
                {reply.time}
                <DoubleCheck />
              </p>
            </div>
          </li>

          <li className="flex flex-col">
            <div className={`${bubble} mr-6 self-start rounded-tl-sm bg-wa-dark-in sm:mr-12`}>
              <p>
                <span className="sr-only">{chat.contactPrefix} </span>
                <strong className="font-semibold text-white">{details.title}</strong>
              </p>
              <dl>
                {details.items.map((item) => (
                  <div key={item.label}>
                    <dt className="inline text-on-dark-muted">{item.label}</dt>{" "}
                    <dd className="inline">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4">{details.closing}</p>
              <p className={stamp}>{details.time}</p>
            </div>
          </li>
        </ol>
      </div>

      <figcaption className="px-4 pb-4 text-center text-xs text-on-dark-subtle">{chat.caption}</figcaption>
    </figure>
  );
}
