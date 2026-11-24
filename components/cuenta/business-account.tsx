"use client";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  BusinessDashboard,
  type PlanLoadState,
  type ProfileState,
} from "@/components/cuenta/business-dashboard";
import { AccountBar } from "@/components/proveedores/account/account-bar";
import { NoBusinessAccount, noBusinessView } from "@/components/cuenta/no-business-account";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { fetchPartnerProfile, fetchPlanCatalog, type PlanCatalog } from "@/lib/account/client";
import { ACCOUNT_FEATURES } from "@/lib/account/features";
import { planStateFor } from "@/lib/account/plan-state";
import { pickAccountPartner, type AccountSection } from "@/lib/account/sections";
import { usePendingSignupIntent } from "@/lib/auth/pending-signup-intent";
import { syncRoleHint } from "@/lib/auth/role-hint";
import { isWithinSignupWindow, readSignupIntent, SIGNUP_INTENTS } from "@/lib/auth/signup-intent";
import { accountContent } from "@/lib/content/account";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { fetchOwnerPartners, fetchSubscription } from "@/lib/partner-billing/client";
import type { Membership } from "@/lib/partner-claims/redeem";

const { page, business } = accountContent;

type BusinessAccountProps = {
  /** `/cuenta` sin query. */
  readonly basePath: string;
  /** `/cuenta` con su query actual (vuelta del login con la sesión vencida). */
  readonly selfPath: string;
  /** Nombre de la cookie `__client_uat` (pista de rol del header). */
  readonly sessionCookie: string | null;
  readonly section: AccountSection;
  /** `?negocio=`: el negocio pedido (si la cuenta es dueña). */
  readonly requestedPartnerId: string | null;
};

type PartnersState =
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly reason: "unauthenticated" | "unknown" }
  | { readonly kind: "ready"; readonly owners: readonly Membership[] };

/**
 * "Mi negocio" con sesión: lee los negocios de la cuenta
 * (`GET /partners/me/memberships`, escribe o borra la pista de rol del
 * header como antes) y, para el negocio elegido, su perfil público
 * (`GET /partners/{id}`), su suscripción (`GET /partners/{id}/subscription`)
 * y el catálogo de planes (`GET /billing/plans`). Todo desde el browser con
 * el Bearer de Clerk (las dos públicas, sin token).
 *
 * Sin negocios (registro: cliente o taller, 2026-11-24), la pantalla sale del
 * intent de Clerk (`publicMetadata.signupIntent`, o el pendiente de esta
 * pestaña): onboarding de proveedor, cuenta de cliente o, en una cuenta
 * recién creada sin elección, la pregunta. La membresía siempre manda.
 */
export function BusinessAccount({ basePath, selfPath, sessionCookie, section, requestedPartnerId }: BusinessAccountProps) {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const [partners, setPartners] = useState<PartnersState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  /** Hora de la carga: alcanza para la ventana de 30 minutos de una cuenta nueva. */
  const [loadedAt] = useState(() => Date.now());
  const { user } = useUser();
  const pendingIntent = usePendingSignupIntent();
  // Registro: cliente o taller. El guardado en Clerk manda; mientras no
  // llega, el pendiente de esta pestaña (la pantalla cambia en el momento).
  const intent = readSignupIntent(user?.publicMetadata) ?? pendingIntent;
  const registeredAsPartner = intent === SIGNUP_INTENTS.partner;
  const ownsPartners = partners.kind === "ready" && partners.owners.length > 0;

  useEffect(() => {
    let active = true;
    void fetchOwnerPartners(getToken).then((result) => {
      if (!active) return;
      setPartners(result.kind === "ok" ? { kind: "ready", owners: result.owners } : { kind: "error", reason: result.kind });
    });
    return () => {
      active = false;
    };
  }, [getToken, attempt]);

  // Pista de rol para el header público: dueño de al menos un negocio, o
  // cuenta registrada como proveedor. Solo UI (nunca autoriza nada); con
  // error no se toca.
  useEffect(() => {
    if (partners.kind === "ready") syncRoleHint(sessionCookie, ownsPartners || registeredAsPartner);
  }, [partners.kind, ownsPartners, registeredAsPartner, sessionCookie]);

  const bar = <AccountBar selfPath={selfPath} signOutUrl="/" />;

  if (partners.kind === "ready" && partners.owners.length === 0) {
    const createdAt = user?.createdAt?.getTime() ?? Number.NaN;
    return (
      <Section tone="canvas" spacing="md" aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <NoBusinessAccount
          view={noBusinessView(intent, isWithinSignupWindow(createdAt, loadedAt))}
          firstName={user?.firstName?.trim() || null}
          footer={bar}
        />
      </Section>
    );
  }

  if (partners.kind !== "ready") {
    return (
      <Section tone="canvas" spacing="md" aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <div className="flex max-w-180 flex-col gap-8">
          <h1 id={PRIVATE_FLOW_TITLE_ID} tabIndex={-1} className="font-display text-3xl font-bold text-fg md:text-4xl">
            {registeredAsPartner ? business.loadingTitle : page.title}
          </h1>
          <div aria-live="polite" aria-atomic="true">
            {partners.kind === "loading" ? (
              <p className="text-fg-muted">{business.loading}</p>
            ) : partners.kind === "error" ? (
              <div className="flex flex-col items-start gap-3">
                <p className="font-medium text-status-alert">
                  {partners.reason === "unauthenticated" ? page.partners.unauthenticated : page.partners.error}
                </p>
                {partners.reason === "unauthenticated" ? (
                  <Button type="button" variant="outline" size="44" onClick={() => void signOut({ redirectUrl: selfPath })}>
                    {partnerAccountContent.reauth}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="44"
                    onClick={() => {
                      setPartners({ kind: "loading" });
                      setAttempt((value) => value + 1);
                    }}
                  >
                    {page.partners.retry}
                  </Button>
                )}
              </div>
            ) : null}
          </div>
          {bar}
        </div>
      </Section>
    );
  }

  const partner = pickAccountPartner(partners.owners, requestedPartnerId) ?? partners.owners[0];
  if (!partner) return null;

  return (
    <PartnerDashboard
      // Otro negocio = estado nuevo (sin mezclar el perfil o el plan del anterior).
      key={partner.partnerId}
      basePath={basePath}
      selfPath={selfPath}
      section={section}
      partner={partner}
      partners={partners.owners}
      footer={bar}
    />
  );
}

/** Catálogo de planes: uno por carga de página (es público y no cambia por negocio). */
let catalogPromise: Promise<PlanCatalog | null> | null = null;
function loadCatalog(): Promise<PlanCatalog | null> {
  catalogPromise ??= fetchPlanCatalog().then((catalog) => {
    if (!catalog) catalogPromise = null;
    return catalog;
  });
  return catalogPromise;
}

function PartnerDashboard({
  basePath,
  selfPath,
  section,
  partner,
  partners,
  footer,
}: {
  readonly basePath: string;
  readonly selfPath: string;
  readonly section: AccountSection;
  readonly partner: Membership;
  readonly partners: readonly Membership[];
  readonly footer: React.ReactNode;
}) {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<ProfileState>({ kind: "loading" });
  const [plan, setPlan] = useState<PlanLoadState>({ kind: "loading" });
  /** Sube después de una baja: se vuelve a consultar la suscripción. */
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    void fetchPartnerProfile(partner.partnerId).then((result) => {
      if (active) setProfile(result);
    });
    return () => {
      active = false;
    };
  }, [partner.partnerId]);

  useEffect(() => {
    let active = true;
    void Promise.all([fetchSubscription(partner.partnerId, getToken), loadCatalog()]).then(([result, catalog]) => {
      if (!active) return;
      if (result.kind !== "ok") {
        setPlan({ kind: "error" });
        return;
      }
      setPlan({
        kind: "ready",
        data: {
          state: planStateFor(result.view),
          view: result.view,
          plans: catalog?.plans ?? null,
          limits: catalog?.limits ?? {},
        },
      });
    });
    return () => {
      active = false;
    };
  }, [partner.partnerId, getToken, reload]);

  return (
    <BusinessDashboard
      basePath={basePath}
      selfPath={selfPath}
      onPlanChanged={() => setReload((value) => value + 1)}
      footer={footer}
      data={{
        partners,
        partner,
        section,
        profile,
        plan,
        features: ACCOUNT_FEATURES,
        // Sin endpoint del lado del negocio (ver `lib/account/features.ts`).
        orders: null,
        overview: null,
        usage: null,
        referral: null,
        review: null,
        publicHref: null,
      }}
    />
  );
}
