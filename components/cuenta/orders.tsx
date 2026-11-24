"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import {
  countOrdersByFilter,
  isActionableOrder,
  matchesOrderFilter,
  ORDER_FILTERS,
  type OrderFilter,
  type OrdersOverview,
  type OrderStatus,
  type PartnerOrder,
} from "@/lib/account/orders";
import { accountContent } from "@/lib/content/account";
import { cn } from "@/lib/utils";

/*
 * Pedidos recibidos (pestaña Pedidos, franja de números y "Últimos pedidos"
 * del Resumen). APAGADO hasta que el backend tenga la lectura del lado del
 * negocio (`ACCOUNT_FEATURES.orders`): nada de esto se monta en producción.
 */

const { orders: copy, summary, empty } = accountContent.business;

const pillClass: Record<OrderStatus, string> = {
  responder: "bg-action text-white",
  detalle: "bg-status-pending-bg text-status-pending",
  propuesta: "bg-canvas text-fg",
  elegido: "bg-brand-50 text-status-ok",
  cerrado: "bg-canvas text-fg-muted",
};

/** Una fila: estado, número y cuándo; servicio; auto y zona; nota; acción a la derecha. */
function OrderRow({ order, headingLevel: Heading }: { readonly order: PartnerOrder; readonly headingLevel: "h3" | "h4" }) {
  const status = copy.status[order.status];
  const external = order.actionHref.startsWith("http");
  const variant = isActionableOrder(order.status) ? "primary" : "outline";
  return (
    <li className="flex flex-col gap-4 border-t border-card-line py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
          <span className={cn("rounded-full px-3 py-0.5 text-label font-semibold", pillClass[order.status])}>
            {status.label}
          </span>
          <span>
            {copy.number(order.number)} · {order.when}
          </span>
        </p>
        <Heading className="mt-2 font-display text-lg leading-snug font-semibold text-fg">{order.service}</Heading>
        <p className="text-fg-muted">
          {order.vehicle} · {order.zone}
        </p>
        <p className="mt-1.5 text-sm text-fg-muted">{order.note}</p>
      </div>
      {external ? (
        <ButtonAnchor
          href={order.actionHref}
          target="_blank"
          rel="noopener noreferrer"
          variant={variant}
          size="44"
          className="self-start sm:self-center"
        >
          {status.action}
        </ButtonAnchor>
      ) : (
        <ButtonLink href={order.actionHref} variant={variant} size="44" className="self-start sm:self-center">
          {status.action}
        </ButtonLink>
      )}
    </li>
  );
}

export function OrderList({
  orders,
  headingLevel,
}: {
  readonly orders: readonly PartnerOrder[];
  readonly headingLevel: "h3" | "h4";
}) {
  return (
    <ul className="border-b border-card-line">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} headingLevel={headingLevel} />
      ))}
    </ul>
  );
}

/** Franja de cuatro números del Resumen (referencia: Jobber "Workflow"). */
export function OrdersOverviewStrip({
  overview,
  planLimit,
}: {
  readonly overview: OrdersOverview;
  readonly planLimit: number | null;
}) {
  const { stages } = summary;
  const cells = [
    { key: "a", label: stages.toAnswer.label, value: overview.toAnswer, of: null, sub: stages.toAnswer.sub(overview.dueToday) },
    { key: "b", label: stages.proposals.label, value: overview.proposals, of: null, sub: stages.proposals.sub },
    { key: "c", label: stages.chosen.label, value: overview.chosenLast30Days, of: null, sub: stages.chosen.sub },
    {
      key: "d",
      label: stages.planOrders.label,
      value: overview.planOrdersUsed,
      of: planLimit ? stages.planOrders.of(planLimit) : null,
      sub: stages.planOrders.sub,
    },
  ];
  return (
    <ul
      aria-label={summary.stagesLabel}
      className="grid grid-cols-2 overflow-hidden rounded-card border border-card-line border-t-action bg-card lg:grid-cols-4"
    >
      {cells.map((cell, index) => (
        <li
          key={cell.key}
          className={cn(
            "flex flex-col gap-1 p-6",
            index % 2 === 1 && "border-l border-card-line",
            index >= 2 && "border-t border-card-line lg:border-t-0",
            index === 2 && "lg:border-l",
          )}
        >
          <p className="text-sm font-medium text-fg-muted">{cell.label}</p>
          <p className="font-display text-4xl font-bold text-fg">
            {cell.value}
            {cell.of ? <span className="ml-1 font-sans text-base font-normal text-fg-muted">{cell.of}</span> : null}
          </p>
          <p className="text-sm text-fg-muted">{cell.sub}</p>
        </li>
      ))}
    </ul>
  );
}

/** Sin pedidos todavía: qué va a aparecer acá y cómo funciona (referencia: Squarespace "No orders yet"). */
export function OrdersEmpty({
  profileHref,
  headingLevel: Heading,
}: {
  readonly profileHref: string;
  readonly headingLevel: "h2" | "h3";
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-card-line bg-card px-6 py-12 text-center">
      <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-canvas text-fg">
        <Icon name="chat" size={22} strokeWidth={1.8} />
      </span>
      <Heading className="font-display text-2xl font-bold text-fg">{empty.title}</Heading>
      <p className="max-w-130 leading-relaxed text-fg-muted">{empty.body}</p>
      <ol className="mt-2 grid w-full max-w-155 gap-5 text-left sm:grid-cols-3">
        {empty.steps.map((step) => (
          <li key={step.title} className="border-t-2 border-action pt-3">
            <p className="font-display font-semibold text-fg">{step.title}</p>
            <p className="mt-1 text-sm text-fg-muted">{step.body}</p>
          </li>
        ))}
      </ol>
      <ButtonLink href={profileHref} variant="primary" size="48" className="mt-4" scroll={false}>
        {empty.cta}
      </ButtonLink>
    </div>
  );
}

/** Pestaña Pedidos: título, uso del plan, filtros por estado (con conteo) y la lista. */
export function OrdersSection({
  orders,
  usage,
  profileHref,
  titleId,
}: {
  readonly orders: readonly PartnerOrder[];
  readonly usage: { readonly used: number; readonly limit: number } | null;
  readonly profileHref: string;
  readonly titleId: string;
}) {
  const [filter, setFilter] = useState<OrderFilter>("todos");
  const listId = useId();
  const counts = countOrdersByFilter(orders);
  const visible = orders.filter((order) => matchesOrderFilter(order, filter));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="max-w-150">
          <h2 id={titleId} className="font-display text-3xl font-bold text-fg">
            {copy.title}
          </h2>
          <p className="mt-2 leading-relaxed text-fg-muted">{copy.body}</p>
        </div>
        {usage ? <p className="text-sm text-fg-muted">{copy.usage(usage.used, usage.limit)}</p> : null}
      </div>

      {orders.length === 0 ? (
        <OrdersEmpty profileHref={profileHref} headingLevel="h3" />
      ) : (
        <>
          <div role="group" aria-label={copy.filtersLabel} className="flex flex-wrap gap-2">
            {ORDER_FILTERS.map((item) => (
              <Chip
                key={item}
                pressed={filter === item}
                aria-controls={listId}
                onClick={() => setFilter(item)}
                size="44"
              >
                {copy.filterCount(copy.filters[item], counts[item])}
              </Chip>
            ))}
          </div>
          <div id={listId} aria-live="polite">
            {visible.length > 0 ? (
              <OrderList orders={visible} headingLevel="h3" />
            ) : (
              <p className="border-t border-card-line py-6 text-fg-muted">{copy.noneInFilter}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** "Últimos pedidos" del Resumen. */
export function LatestOrders({
  orders,
  allHref,
}: {
  readonly orders: readonly PartnerOrder[];
  readonly allHref: string;
}) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h3 id={titleId} className="font-display text-2xl font-bold text-fg">
          {summary.latest.title}
        </h3>
        <Link
          href={allHref}
          scroll={false}
          className="inline-flex min-h-11 items-center font-semibold text-fg underline underline-offset-4"
        >
          {summary.latest.all}
        </Link>
      </div>
      <OrderList orders={orders} headingLevel="h4" />
    </section>
  );
}
