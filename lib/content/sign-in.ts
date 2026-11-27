import { accountContent } from "@/lib/content/account";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { partnerCheckoutContent, planDisplayName } from "@/lib/content/partner-checkout";
import { partnerClaimContent } from "@/lib/content/partner-claim";
import { providersContent } from "@/lib/content/providers";
import { parsePlanParam } from "@/lib/partner-billing/checkout";
import { signInDestinationKind } from "@/lib/auth/sign-in-redirect";

/** Copy propio de la pantalla `/ingresar` (el resto vive en `partnerAccountContent.ingresar`). */
export const signInContent = {
  /** `aria-label` de la cruz de arriba a la derecha: sale del login y vuelve a la página anterior. */
  close: "Cerrar y volver",
} as const;

/** Origen ficticio para leer la query de una ruta relativa ya validada. */
const PLACEHOLDER_ORIGIN = "https://autolibre.invalid";

/**
 * Bajada del `<h1>` de `/ingresar` según adónde vuelve la persona: la misma
 * que tenía el login de cada flujo antes de que existiera la ruta dedicada.
 * Recibe un destino YA validado por `parseSafeRedirect`.
 */
export function signInIntroFor(destination: string): string {
  switch (signInDestinationKind(destination)) {
    case "account":
      return accountContent.page.signInIntro;
    case "alta":
      return providersContent.flow.signInIntro;
    case "reclamar":
      return partnerClaimContent.signInIntro;
    case "resultado":
      return partnerCheckoutContent.result.signInIntro;
    case "contratar": {
      const plan = parsePlanParam(new URL(destination, PLACEHOLDER_ORIGIN).searchParams.get("plan") ?? undefined);
      const planName = plan ? planDisplayName(plan) : null;
      return planName ? partnerCheckoutContent.signInIntro(planName) : partnerAccountContent.ingresar.body;
    }
    default:
      return partnerAccountContent.ingresar.body;
  }
}
