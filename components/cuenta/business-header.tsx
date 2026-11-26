"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { boneClass } from "@/components/cuenta/styles";
import { StatusPill } from "@/components/ui/status-pill";
import { partnerInitials } from "@/lib/account/partner-profile";
import { accountSectionHref, type AccountSection } from "@/lib/account/sections";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { accountContent } from "@/lib/content/account";
import { cn } from "@/lib/utils";

const { business, more } = accountContent;

export type BusinessVisibility = "published" | "hidden" | "review" | null;

type BusinessHeaderProps = {
  readonly basePath: string;
  readonly partner: { readonly partnerId: string; readonly name: string };
  readonly partners: readonly { readonly partnerId: string; readonly name: string }[];
  readonly section: AccountSection;
  /** `null` si no se sabe (falló la lectura): sin pill. */
  readonly visibility: BusinessVisibility;
  /** El perfil todavía no llegó: se reserva el lugar del estado (en celular va en otra línea). */
  readonly visibilityPending?: boolean;
  /** Logo del negocio (`logoUrl` de `GET /partners/{id}`); `null` = iniciales. */
  readonly logoUrl: string | null;
  /** Link al perfil público (necesita el slug: hoy apagado). */
  readonly publicHref: string | null;
  /** Secciones visibles (Pedidos solo con la bandera `orders`). `null` = sin pestañas (en revisión). */
  readonly sections: readonly AccountSection[] | null;
  /** Contador de la pestaña Pedidos (pedidos por responder). */
  readonly ordersBadge: number | null;
};

const visibilityTone = { published: "ok", hidden: "neutral", review: "pending" } as const;

/** Clases de la barra del negocio: las comparte el esqueleto de carga (mismo alto, sin saltos). */
export const businessHeaderClasses = {
  row: "flex min-h-12 items-center gap-3 sm:gap-4",
  avatar: "size-11 shrink-0 rounded-card sm:size-12",
  title: "font-display text-xl leading-tight font-bold tracking-tight text-fg sm:text-2xl lg:text-3xl",
  nav: "mt-1 -mb-px overflow-x-auto",
  navList: "flex gap-x-6 whitespace-nowrap",
  navItem: "inline-flex min-h-11 items-center gap-2 border-b-3 text-control",
  /** Lugar del pill de estado mientras carga (mismo alto que `StatusPill`). */
  pillBone: "h-6.5 w-24",
} as const;

/**
 * Barra del negocio de "Mi negocio", compacta (referencia: Jobber / Podia /
 * Remote): logo o iniciales, el `<h1>` con el nombre y su estado en la misma
 * línea, "Cambiar de negocio" a la derecha y las secciones pegadas abajo.
 * Sin rótulo arriba del nombre ni barra lateral: son pocas secciones.
 *
 * El estado va FUERA del `<h1>`: el título es el nombre del negocio, sin
 * "Publicado" pegado al final para el lector de pantalla.
 */
export function BusinessHeader({
  basePath,
  partner,
  partners,
  section,
  visibility,
  visibilityPending = false,
  logoUrl,
  publicHref,
  sections,
  ordersBadge,
}: BusinessHeaderProps) {
  return (
    <div className="flex flex-col">
      <div className={businessHeaderClasses.row}>
        <BusinessAvatar name={partner.name} logoUrl={logoUrl} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <h1 id={PRIVATE_FLOW_TITLE_ID} className={cn(businessHeaderClasses.title, "min-w-0 text-balance")}>
            {partner.name}
          </h1>
          {visibility ? (
            <StatusPill tone={visibilityTone[visibility]} dot>
              {business.visibility[visibility]}
            </StatusPill>
          ) : visibilityPending ? (
            <span aria-hidden="true" className={cn(boneClass, businessHeaderClasses.pillBone)} />
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <BusinessSwitcher basePath={basePath} partner={partner} partners={partners} section={section} />
          {publicHref ? (
            <ButtonLink href={publicHref} variant="outline" size="44" className="max-md:hidden">
              {business.publicPage}
            </ButtonLink>
          ) : null}
        </div>
      </div>

      {sections ? (
        <SectionNav
          basePath={basePath}
          section={section}
          sections={sections}
          partnerId={partners.length > 1 ? partner.partnerId : null}
          ordersBadge={ordersBadge}
        />
      ) : (
        <div aria-hidden="true" className="h-4" />
      )}
    </div>
  );
}

/**
 * Logo del negocio o, sin logo, sus iniciales. Decorativo (`alt=""`): el
 * nombre ya está en el `<h1>`. Caja de tamaño fijo, así el logo que llega
 * con el perfil reemplaza a las iniciales sin mover nada.
 */
function BusinessAvatar({ name, logoUrl }: { readonly name: string; readonly logoUrl: string | null }) {
  if (logoUrl) {
    return (
      // URL del backend (cualquier host): `<img>` con medidas fijas, como la vista previa de la app.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={48}
        height={48}
        decoding="async"
        className={cn(businessHeaderClasses.avatar, "border border-card-line bg-card object-contain p-1")}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        businessHeaderClasses.avatar,
        "flex items-center justify-center bg-action font-display text-base font-bold text-white sm:text-lg",
      )}
    >
      {partnerInitials(name)}
    </span>
  );
}

/**
 * Secciones como LINKS con `aria-current="page"` (ver `lib/account/sections.ts`
 * por qué no es un `tablist`). Scroll horizontal propio si no entran.
 */
function SectionNav({
  basePath,
  section,
  sections,
  partnerId,
  ordersBadge,
}: {
  readonly basePath: string;
  readonly section: AccountSection;
  readonly sections: readonly AccountSection[];
  readonly partnerId: string | null;
  readonly ordersBadge: number | null;
}) {
  return (
    <nav aria-label={business.nav.label} className={businessHeaderClasses.nav}>
      <ul className={businessHeaderClasses.navList}>
        {sections.map((item) => {
          const current = item === section;
          const badge = item === "pedidos" && ordersBadge ? ordersBadge : null;
          return (
            <li key={item} className="flex">
              <Link
                href={accountSectionHref(basePath, item, partnerId)}
                prefetch={false}
                scroll={false}
                aria-current={current ? "page" : undefined}
                className={cn(
                  businessHeaderClasses.navItem,
                  "transition-colors motion-reduce:transition-none",
                  current
                    ? "border-action font-semibold text-fg"
                    : "border-transparent font-medium text-fg-muted hover:border-control-line hover:text-fg",
                )}
              >
                {business.nav.items[item]}
                {badge ? (
                  <span className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-action px-1.5 text-xs font-semibold text-white">
                    <span aria-hidden="true">{badge}</span>
                    <span className="sr-only">{business.nav.badge(badge)}</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * "Cambiar de negocio": disclosure (botón con `aria-expanded` + panel con
 * links), el mismo patrón que el menú de cuenta del header. Lista los
 * negocios de la cuenta (el actual marcado) y los caminos para sumar otro:
 * cargarlo o reclamarlo. Escape y click afuera cierran.
 */
function BusinessSwitcher({
  basePath,
  partner,
  partners,
  section,
}: {
  readonly basePath: string;
  readonly partner: { readonly partnerId: string; readonly name: string };
  readonly partners: readonly { readonly partnerId: string; readonly name: string }[];
  readonly section: AccountSection;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const extra = [
    { ...more.register, event: ANALYTICS_EVENTS.partnerRegisterStarted, placement: "cuenta_otro_taller_cargar" },
    { ...more.claim, event: ANALYTICS_EVENTS.partnerClaimStarted, placement: "cuenta_otro_taller_reclamar" },
  ] as const;

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (open && !rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        // En celular se ve "Cambiar": el nombre accesible es siempre el completo.
        aria-label={business.switcher.trigger}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 items-center gap-1.5 rounded-full border border-control-line bg-card px-4 font-display text-control font-semibold text-fg transition-colors hover:bg-brand-50 motion-reduce:transition-none"
      >
        <span className="sm:hidden">{business.switcher.triggerShort}</span>
        <span className="max-sm:hidden">{business.switcher.trigger}</span>
        <Icon
          name="chevron-down"
          size={16}
          strokeWidth={2.2}
          className={cn("transition-transform motion-reduce:transition-none", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div
          id={panelId}
          // Ancho arbitrario: 26rem del diseño, sin pasarse del viewport en celular.
          className="absolute top-full right-0 z-20 mt-2 flex w-[min(26rem,calc(100vw-2rem))] flex-col rounded-card border border-control-line bg-card p-2"
        >
          <nav aria-label={business.switcher.label}>
            <ul className="flex flex-col">
              {partners.map((item) => {
                const current = item.partnerId === partner.partnerId;
                return (
                  <li key={item.partnerId}>
                    <Link
                      href={accountSectionHref(basePath, section, partners.length > 1 ? item.partnerId : null)}
                      prefetch={false}
                      aria-current={current ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex min-h-13 items-center justify-between gap-3 rounded-xl px-3 py-1.5 text-fg",
                        current ? "bg-canvas font-semibold" : "font-medium hover:bg-brand-50",
                      )}
                    >
                      <span className="min-w-0 truncate">{item.name}</span>
                      {current ? (
                        <span className="shrink-0 text-label font-medium text-fg-muted">{business.switcher.current}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <span aria-hidden="true" className="my-1.5 h-px bg-card-line" />
          <ul className="flex flex-col">
            {extra.map((action) => (
              <li key={action.href}>
                {/* Sin prefetch: las dos pantallas cargan su propio Clerk. */}
                <Link
                  href={action.href}
                  prefetch={false}
                  data-analytics-event={action.event}
                  data-analytics-placement={action.placement}
                  className="flex min-h-11 flex-col justify-center rounded-xl px-3 py-1.5 font-medium text-fg hover:bg-brand-50"
                >
                  {action.label}
                  <span className="text-label font-normal text-fg-muted">{action.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
