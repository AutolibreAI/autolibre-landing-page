import {
  isSignupIntent,
  SIGNUP_INTENT_ENDPOINT,
  type SignupIntent,
} from "@/lib/auth/signup-intent";

/** Resultado de guardar el intent (viaja como `result` de `signup_intent_saved`). */
export type SaveSignupIntentResult =
  /** Guardado ahora. */
  | { readonly kind: "saved"; readonly intent: SignupIntent }
  /** Ya había uno (puede ser distinto del pedido): no se pisó. */
  | { readonly kind: "existing"; readonly intent: SignupIntent }
  /** Cuenta de más de 30 minutos o pedido inválido: no se reintenta. */
  | { readonly kind: "rejected" }
  /** Sin token, red caída o error del server: se reintenta en la próxima carga. */
  | { readonly kind: "failed" };

type GetToken = () => Promise<string | null>;

/** `POST /api/account/intent` con el Bearer de Clerk. Nunca tira. */
export async function saveSignupIntent(intent: SignupIntent, getToken: GetToken): Promise<SaveSignupIntentResult> {
  try {
    const token = await getToken();
    if (!token) return { kind: "failed" };
    const response = await fetch(SIGNUP_INTENT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ intent }),
      cache: "no-store",
    });
    if (response.status === 400 || response.status === 403) return { kind: "rejected" };
    if (!response.ok) return { kind: "failed" };
    const body = (await response.json()) as { intent?: unknown; saved?: unknown };
    if (!isSignupIntent(body.intent)) return { kind: "failed" };
    return body.saved === true ? { kind: "saved", intent: body.intent } : { kind: "existing", intent: body.intent };
  } catch {
    return { kind: "failed" };
  }
}
