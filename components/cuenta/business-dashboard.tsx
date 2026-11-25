"use client";

import { useId } from "react";
import { BusinessHeader, type BusinessVisibility } from "@/components/cuenta/business-header";
import { HelpLink, ReferralCodeCard, ReviewStatus } from "@/components/cuenta/extras";
import { LatestOrders, OrdersEmpty, OrdersOverviewStrip, OrdersSection } from "@/components/cuenta/orders";
import {
  PendingPaymentBanner,
  PlanSection,
  planSectionClasses,
  PlanSummaryCard,
  type PlanData,
} from "@/components/cuenta/plan";
import { APP_PREVIEW_ANCHOR, ProfileChecklistCard, ProfileSection, profileClasses } from "@/components/cuenta/profile";
import {
  BusinessHeaderSkeleton,
  ChecklistSkeleton,
  HelpLinkSkeleton,
  PlanSummarySkeleton,
  PlanTabSkeleton,
  ProfileSkeleton,
} from "@/components/cuenta/skeletons";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { Section } from "@/components/ui/section";
import type { AccountFeatures } from "@/lib/account/features";
import type { OrdersOverview, PartnerOrder } from "@/lib/account/orders";
import type { OwnerPartnerProfile } from "@/lib/account/partner-profile";
import { livePlanCode } from "@/lib/account/plan-state";
import { ACCOUNT_SECTIONS, accountSectionHref, type AccountSection } from "@/lib/account/sections";
import { accountContent } from "@/lib/content/account";

const { business } = accountContent;

type PartnerRef = { readonly partnerId: string; readonly name: string };

export type ProfileState =
  | { readonly kind: "loading" }
  | { readonly kind: "ok"; readonly profile: OwnerPartnerProfile }
  | { readonly kind: "not-visible" }
  | { readonly kind: "unknown" };

export type PlanLoadState =
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  | { readonly kind: "ready"; readonly data: PlanData };

/**
 * Todo lo que dibuja "Mi negocio" para un negocio. Lo arma la isla
 * (`BusinessAccount`) con datos reales; lo que no tiene endpoint llega en
 * `null` y su bandera apagada (`lib/account/features.ts`).
 */
export type DashboardData = {
  readonly partners: readonly PartnerRef[];
  readonly partner: PartnerRef;
  readonly section: AccountSection;
  readonly profile: ProfileState;
  readonly plan: PlanLoadState;
  readonly features: AccountFeatures;
  readonly orders: readonly PartnerOrder[] | null;
  readonly overview: OrdersOverview | null;
  readonly usage: { readonly used: number } | null;
  readonly referral: { readonly code: string; readonly savedCount: number } | null;
  readonly review: {
    readonly submittedAt: string;
    readonly data: readonly { readonly label: string; readonly value: string }[];
  } | null;
  /** Link al perfil público (necesita el slug). */
  readonly publicHref: string | null;
};

type BusinessDashboardProps = {
  readonly basePath: string;
  /** `/cuenta` con su query actual: vuelta del login si la sesión vence en una acción. */
  readonly selfPath: string;
  readonly data: DashboardData;
  /** La baja quedó pedida: se vuelve a consultar la suscripción. */
  readonly onPlanChanged: () => void;
  /** Al pie: la fila de sesión (con Clerk). La vista previa local no la pasa. */
  readonly footer?: React.ReactNode;
};

/**
 * "Mi negocio": barra del negocio (banda `card`) y la sección elegida (banda
 * `canvas`). Las secciones son URLs (`lib/account/sections.ts`).
 */
export function BusinessDashboard({ basePath, selfPath, data, onPlanChanged, footer }: BusinessDashboardProps) {
  const titleId = useId();
  const { features, partner, partners } = data;
  const inReview = features.reviewStatus && data.review !== null;

  const sections = ACCOUNT_SECTIONS.filter((item) => item !== "pedidos" || features.orders);
  const section: AccountSection = sections.includes(data.section) ? data.section : "resumen";
  const partnerParam = partners.length > 1 ? partner.partnerId : null;
  const href = (target: AccountSection, hash = "") => `${accountSectionHref(basePath, target, partnerParam)}${hash}`;

  const visibility: BusinessVisibility = inReview
    ? "review"
    : data.profile.kind === "ok"
      ? "published"
      : data.profile.kind === "not-visible"
        ? "hidden"
        : null;

  const orders = features.orders ? data.orders : null;
  const ordersBadge = orders ? orders.filter((order) => order.status === "responder" || order.status === "detalle").length : null;

  return (
    <>
      <Section tone="card" spacing="sm" className={dashboardClasses.header} aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <BusinessHeader
          basePath={basePath}
          partner={partner}
          partners={partners}
          section={section}
          visibility={visibility}
          visibilityPending={!inReview && data.profile.kind === "loading"}
          logoUrl={data.profile.kind === "ok" ? data.profile.profile.logoUrl : null}
          publicHref={features.publicPageLink && !inReview ? data.publicHref : null}
          sections={inReview ? null : sections}
          ordersBadge={ordersBadge}
        />
      </Section>

      <Section tone="canvas" spacing="sm" className={dashboardClasses.body} aria-labelledby={titleId}>
        {inReview && data.review ? (
          <ReviewStatus
            titleId={titleId}
            submittedAt={data.review.submittedAt}
            data={data.review.data}
            profile={data.profile.kind === "ok" ? data.profile.profile : null}
          />
        ) : section === "resumen" ? (
          <Summary data={data} titleId={titleId} orders={orders} href={href} />
        ) : section === "pedidos" && orders ? (
          <OrdersSection
            orders={orders}
            titleId={titleId}
            profileHref={href("perfil")}
            usage={usageFor(data)}
          />
        ) : section === "perfil" ? (
          <ProfileTab data={data} titleId={titleId} />
        ) : (
          <PlanTab data={data} titleId={titleId} selfPath={selfPath} onPlanChanged={onPlanChanged} />
        )}

        {footer ? <div className={dashboardClasses.footer}>{footer}</div> : null}
      </Section>
    </>
  );
}

function usageFor(data: DashboardData): { readonly used: number; readonly limit: number } | null {
  if (!data.features.usage || !data.usage || data.plan.kind !== "ready") return null;
  const live = livePlanCode(data.plan.data.state);
  const limit = live ? data.plan.data.limits[live] : 1;
  return limit ? { used: data.usage.used, limit } : null;
}

/** Lo que lee el lector de pantalla mientras se ve un esqueleto. */
function LoadingStatus({ children }: { readonly children: React.ReactNode }) {
  return (
    <p role="status" className="sr-only">
      {children}
    </p>
  );
}

/** Ritmo de "Mi negocio": lo comparten el tablero y su esqueleto de carga. */
const dashboardClasses = {
  header: "border-t-0 pt-4 pb-0 md:pt-5 md:pb-0",
  body: "pt-5 pb-10 md:pt-7 md:pb-14",
  footer: "mt-8",
  summary: "flex flex-col gap-5",
  /**
   * Resumen: pendientes a la izquierda y el plan al costado desde `lg`. El
   * plan ocupa dos filas y la ayuda va debajo de los pendientes: así el alto
   * del bloque no depende de si el plan es Gratis o pago (la tarjeta de
   * Gratis es más alta) y la fila de sesión no se mueve cuando llega.
   * En celular, el orden del DOM: pendientes, plan, ayuda.
   */
  summaryGrid: "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-6",
  main: "flex flex-col gap-5 lg:col-start-1 lg:row-start-1",
  aside: "flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1",
  help: "lg:col-start-1 lg:row-start-2",
} as const;

/**
 * "Mi negocio" mientras se buscan los negocios de la cuenta: la barra del
 * negocio y la sección pedida con esqueletos en su lugar definitivo, así la
 * llegada de los datos no mueve nada.
 */
export function BusinessDashboardSkeleton({
  section,
  footer,
}: {
  readonly section: AccountSection;
  /** La fila de sesión: ya se conoce (es de Clerk), va igual que en el tablero. */
  readonly footer?: React.ReactNode;
}) {
  const sections: readonly AccountSection[] = ACCOUNT_SECTIONS.filter((item) => item !== "pedidos");
  const current = sections.includes(section) ? section : "resumen";
  return (
    <>
      <Section tone="card" spacing="sm" className={dashboardClasses.header} aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <BusinessHeaderSkeleton sections={sections} current={current} />
      </Section>
      <Section tone="canvas" spacing="sm" className={dashboardClasses.body} aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <LoadingStatus>{business.loading}</LoadingStatus>
        {current === "perfil" ? (
          <ProfileLoading />
        ) : current === "plan" ? (
          <PlanLoading />
        ) : (
          <div className={dashboardClasses.summaryGrid}>
            <div className={dashboardClasses.main}>
              <ChecklistSkeleton />
            </div>
            <div className={dashboardClasses.aside}>
              <PlanSummarySkeleton />
            </div>
            <HelpLinkSkeleton className={dashboardClasses.help} />
          </div>
        )}
        {footer ? <div className={dashboardClasses.footer}>{footer}</div> : null}
      </Section>
    </>
  );
}

/** Pestaña Perfil sin el perfil todavía: el título es fijo, el resto, esqueleto. */
function ProfileLoading({ titleId }: { readonly titleId?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div className={profileClasses.head}>
        <div>
          <h2 id={titleId} className={profileClasses.title}>
            {business.profile.title}
          </h2>
          <p className={profileClasses.body}>{business.profile.body}</p>
        </div>
      </div>
      <ProfileSkeleton />
    </div>
  );
}

/** Pestaña Plan sin la suscripción todavía. */
function PlanLoading({ titleId }: { readonly titleId?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <h2 id={titleId} className={planSectionClasses.title}>
        {business.plan.title}
      </h2>
      <PlanTabSkeleton />
    </div>
  );
}

function Summary({
  data,
  titleId,
  orders,
  href,
}: {
  readonly data: DashboardData;
  readonly titleId: string;
  readonly orders: readonly PartnerOrder[] | null;
  readonly href: (target: AccountSection, hash?: string) => string;
}) {
  const { features } = data;
  const plan = data.plan;

  return (
    <div className={dashboardClasses.summary}>
      <h2 id={titleId} className="sr-only">
        {business.summary.title(data.partner.name)}
      </h2>

      {plan.kind === "ready" && plan.data.state.kind === "pending" ? (
        <PendingPaymentBanner partnerId={data.partner.partnerId} requestedPlan={plan.data.state.requestedPlan} />
      ) : null}

      {orders && orders.length > 0 && data.overview ? (
        <OrdersOverviewStrip
          overview={data.overview}
          planLimit={plan.kind === "ready" ? (plan.data.limits[livePlanCode(plan.data.state) ?? ""] ?? 1) : null}
        />
      ) : null}

      <div className={dashboardClasses.summaryGrid}>
        <div className={dashboardClasses.main}>
          {data.profile.kind === "ok" ? (
            <ProfileChecklistCard profile={data.profile.profile} previewHref={href("perfil", `#${APP_PREVIEW_ANCHOR}`)} />
          ) : data.profile.kind === "loading" ? (
            <>
              <LoadingStatus>{business.loadingProfile}</LoadingStatus>
              <ChecklistSkeleton />
            </>
          ) : data.profile.kind === "not-visible" ? (
            <p className="rounded-card border border-card-line bg-card px-5 py-4 text-fg-muted sm:px-6">
              {business.profile.notVisible}
            </p>
          ) : (
            <p className="rounded-card border border-card-line bg-card px-5 py-4 text-fg-muted sm:px-6">
              {business.summary.profileError}
            </p>
          )}

          {orders ? (
            orders.length === 0 ? (
              <OrdersEmpty profileHref={href("perfil")} headingLevel="h3" />
            ) : (
              <LatestOrders orders={orders.slice(0, 3)} allHref={href("pedidos")} />
            )
          ) : null}
        </div>

        <div className={dashboardClasses.aside}>
          {plan.kind === "ready" ? (
            <PlanSummaryCard
              data={plan.data}
              planHref={href("plan")}
              usage={features.usage ? data.usage : null}
            />
          ) : plan.kind === "loading" ? (
            <>
              <LoadingStatus>{business.loadingPlan}</LoadingStatus>
              <PlanSummarySkeleton />
            </>
          ) : (
            <p className="rounded-card border border-card-line bg-card px-5 py-4 text-fg-muted sm:px-6">
              {accountContent.page.plan.error}
            </p>
          )}
          {features.referralCode && data.referral ? (
            <ReferralCodeCard code={data.referral.code} savedCount={data.referral.savedCount} />
          ) : null}
        </div>
        <HelpLink partnerName={data.partner.name} className={dashboardClasses.help} />
      </div>
    </div>
  );
}

function ProfileTab({ data, titleId }: { readonly data: DashboardData; readonly titleId: string }) {
  if (data.profile.kind === "ok") {
    return (
      <ProfileSection
        profile={data.profile.profile}
        titleId={titleId}
        publicHref={data.features.publicPageLink ? data.publicHref : null}
      />
    );
  }
  if (data.profile.kind === "loading") {
    return (
      <>
        <LoadingStatus>{business.loadingProfile}</LoadingStatus>
        <ProfileLoading titleId={titleId} />
      </>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <h2 id={titleId} className={profileClasses.title}>
        {business.profile.title}
      </h2>
      <p className="max-w-150 text-fg-muted">
        {data.profile.kind === "not-visible" ? business.profile.notVisible : business.summary.profileError}
      </p>
      <HelpLink partnerName={data.partner.name} />
    </div>
  );
}

function PlanTab({
  data,
  titleId,
  selfPath,
  onPlanChanged,
}: {
  readonly data: DashboardData;
  readonly titleId: string;
  readonly selfPath: string;
  readonly onPlanChanged: () => void;
}) {
  if (data.plan.kind === "ready") {
    return (
      <PlanSection
        data={data.plan.data}
        partner={data.partner}
        titleId={titleId}
        selfPath={selfPath}
        usage={data.features.usage ? data.usage : null}
        onCanceled={onPlanChanged}
      />
    );
  }
  if (data.plan.kind === "loading") {
    return (
      <>
        <LoadingStatus>{business.loadingPlan}</LoadingStatus>
        <PlanLoading titleId={titleId} />
      </>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <h2 id={titleId} className={planSectionClasses.title}>
        {business.plan.title}
      </h2>
      <p className="text-fg-muted">{accountContent.page.plan.error}</p>
    </div>
  );
}
