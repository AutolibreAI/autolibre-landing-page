"use client";

import Link from "next/link";
import { useId } from "react";
import { AccountHead } from "@/components/cuenta/account-head";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StoreLinks } from "@/components/ui/store-links";
import { ANALYTICS_EVENTS, QUOTE_CTA_PLACEMENTS } from "@/lib/analytics/events";
import { accountContent } from "@/lib/content/account";
import { whatsappUrl } from "@/lib/whatsapp";

const { customer, business } = accountContent;

/** `placement` de los links de la cuenta de cliente (ver `analytics.md`). */
const PLACEMENT = "cuenta_cliente";

type CustomerAccountProps = {
  /** Nombre de pila de Clerk, si lo tiene. Nunca viaja a la medición. */
  readonly firstName: string | null;
  /** "Sesión iniciada como…" con "Cerrar sesión" (`AccountBar`). */
  readonly footer: React.ReactNode;
};

/**
 * "Mi cuenta" de un cliente (sin taller, con intent `customer` o cuenta vieja
 * sin intent). Compacta: pedir propuestas y la app para seguir los pedidos,
 * lado a lado desde `md`; abajo, en una línea, ayuda por WhatsApp y, discreto,
 * "Sumá tu negocio". NO promete ver los pedidos acá ni en la app: los pedidos
 * de la web no quedan asociados a la cuenta.
 *
 * Sin estado: vive en la isla de `/cuenta` solo porque la sesión la resuelve
 * Clerk en el browser.
 */
export function CustomerAccount({ firstName, footer }: CustomerAccountProps) {
  const orderId = useId();
  const appId = useId();
  const helpId = useId();

  return (
    <div className="flex max-w-240 flex-col gap-6">
      <AccountHead title={customer.greeting(firstName)} intro={customer.intro} />

      {/* Pedir y seguir, lado a lado desde `md`: lo que vino a hacer, de un vistazo. */}
      <div className="grid gap-4 md:grid-cols-2">
        <section
          aria-labelledby={orderId}
          className="flex flex-col items-start gap-3 rounded-card border border-card-line bg-card p-5 sm:p-6"
        >
          <div className="flex flex-col gap-1">
            <h2 id={orderId} className="font-display text-xl leading-7 font-bold text-fg">
              {customer.order.title}
            </h2>
            <p className="text-fg-muted">{customer.order.body}</p>
          </div>
          <ButtonLink
            href={customer.order.href}
            variant="primary"
            size="48"
            className="mt-auto max-sm:w-full"
            data-analytics-event={ANALYTICS_EVENTS.quoteCtaClicked}
            data-analytics-quote-placement={QUOTE_CTA_PLACEMENTS.accountCustomer}
          >
            {customer.order.cta}
            <Icon name="arrow-right" size={18} strokeWidth={2} />
          </ButtonLink>
        </section>

        <section aria-labelledby={appId} className="flex flex-col gap-3 rounded-card border border-card-line bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 id={appId} className="font-display text-xl leading-7 font-bold text-fg">
              {customer.app.title}
            </h2>
            <p className="text-fg-muted">{customer.app.body}</p>
          </div>
          <StoreLinks placement={PLACEMENT} className="mt-auto" />
        </section>
      </div>

      <div className="flex flex-col gap-x-8 gap-y-1 px-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <section aria-labelledby={helpId} className="flex flex-wrap items-center gap-x-3">
          <h2 id={helpId} className="font-medium text-fg">
            {customer.help.title}
          </h2>
          <a
            href={whatsappUrl(customer.help.message)}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
            data-analytics-placement={`${PLACEMENT}_ayuda`}
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
          >
            <Icon name="whatsapp" size={18} strokeWidth={1.8} className="text-whatsapp" />
            {customer.help.cta}
            <span className="sr-only">{business.externalHint}</span>
          </a>
        </section>
        <p className="text-fg-muted">
          {customer.join.prefix}{" "}
          <Link
            href={customer.join.href}
            data-analytics-event={ANALYTICS_EVENTS.partnerRegisterStarted}
            data-analytics-placement={`${PLACEMENT}_sumar`}
            className="inline-flex min-h-11 items-center font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
          >
            {customer.join.label}
          </Link>
        </p>
      </div>

      {footer}
    </div>
  );
}
