"use client";

import { useId } from "react";
import { BusinessHeader, type BusinessVisibility } from "@/components/cuenta/business-header";
import { HelpLink, ReferralCodeCard, ReviewStatus } from "@/components/cuenta/extras";
import { LatestOrders, OrdersEmpty, OrdersOverviewStrip, OrdersSection } from "@/components/cuenta/orders";
import { PendingPaymentBanner, PlanSection, PlanSummaryCard, type PlanData } from "@/components/cuenta/plan";
import { APP_PREVIEW_ANCHOR, ProfileChecklistCard, ProfileSection } from "@/components/cuenta/profile";
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
      <Section tone="card" spacing="sm" className="border-t-0 pt-6 pb-0 md:pt-8 md:pb-0" aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <BusinessHeader
          basePath={basePath}
          partner={partner}
          partners={partners}
          section={section}
          visibility={visibility}
          publicHref={features.publicPageLink && !inReview ? data.publicHref : null}
          sections={inReview ? null : sections}
          ordersBadge={ordersBadge}
        />
      </Section>

      <Section tone="canvas" spacing="sm" className="pt-8 md:pt-10" aria-labelledby={titleId}>
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

        {footer ? <div className="mt-14">{footer}</div> : null}
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

function Loading({ children }: { readonly children: React.ReactNode }) {
  return (
    <p role="status" className="text-fg-muted">
      {children}
    </p>
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
    <div className="flex flex-col gap-7">
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

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-10">
          {data.profile.kind === "ok" ? (
            <ProfileChecklistCard profile={data.profile.profile} previewHref={href("perfil", `#${APP_PREVIEW_ANCHOR}`)} />
          ) : data.profile.kind === "loading" ? (
            <Loading>{business.loading}</Loading>
          ) : data.profile.kind === "not-visible" ? (
            <p className="rounded-card border border-card-line bg-card p-6 leading-relaxed text-fg-muted">
              {business.profile.notVisible}
            </p>
          ) : (
            <p className="rounded-card border border-card-line bg-card p-6 text-fg-muted">{business.summary.profileError}</p>
          )}

          {orders ? (
            orders.length === 0 ? (
              <OrdersEmpty profileHref={href("perfil")} headingLevel="h3" />
            ) : (
              <LatestOrders orders={orders.slice(0, 3)} allHref={href("pedidos")} />
            )
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          {plan.kind === "ready" ? (
            <PlanSummaryCard
              data={plan.data}
              planHref={href("plan")}
              usage={features.usage ? data.usage : null}
            />
          ) : plan.kind === "loading" ? (
            <Loading>{accountContent.page.plan.loading}</Loading>
          ) : (
            <p className="rounded-card border border-card-line bg-card p-6 text-fg-muted">{accountContent.page.plan.error}</p>
          )}
          {features.referralCode && data.referral ? (
            <ReferralCodeCard code={data.referral.code} savedCount={data.referral.savedCount} />
          ) : null}
          <HelpLink partnerName={data.partner.name} />
        </div>
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
  return (
    <div className="flex flex-col gap-5">
      <h2 id={titleId} className="font-display text-3xl font-bold text-fg">
        {business.profile.title}
      </h2>
      {data.profile.kind === "loading" ? (
        <Loading>{business.loading}</Loading>
      ) : (
        <p className="max-w-150 leading-relaxed text-fg-muted">
          {data.profile.kind === "not-visible" ? business.profile.notVisible : business.summary.profileError}
        </p>
      )}
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
  return (
    <div className="flex flex-col gap-5">
      <h2 id={titleId} className="font-display text-3xl font-bold text-fg">
        {business.plan.title}
      </h2>
      {data.plan.kind === "loading" ? (
        <Loading>{accountContent.page.plan.loading}</Loading>
      ) : (
        <p className="text-fg-muted">{accountContent.page.plan.error}</p>
      )}
    </div>
  );
}
