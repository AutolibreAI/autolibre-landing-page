import { createClerkClient, verifyToken } from "@clerk/nextjs/server";
import {
  handleSignupIntentRequest,
  SIGNUP_INTENT_KEY,
  type SignupIntentResult,
} from "@/lib/auth/signup-intent";

/**
 * `POST /api/account/intent`: guarda la elección "Soy cliente / Tengo un
 * taller" en `publicMetadata.signupIntent` de la cuenta de Clerk (contrato en
 * `lib/auth/signup-intent.ts`).
 *
 * `clerkMiddleware` (`proxy.ts`) corre SOLO en las pantallas privadas, no en
 * `/api`, así que `auth()` no sirve acá: el browser manda `Authorization: Bearer <token de sesión de Clerk>` y esta
 * ruta lo verifica con `verifyToken` de `@clerk/backend` (firma, vencimiento
 * y emisor contra el JWKS de la instancia, con `CLERK_SECRET_KEY`). El
 * `userId` sale del `sub` del token verificado, nunca del cuerpo.
 *
 * Nunca se loguean el token, el email ni el `userId`.
 */
export async function POST(request: Request): Promise<Response> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error("[signup-intent] falta CLERK_SECRET_KEY");
    return json({ status: 503, body: { error: "unavailable" } });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const clerk = createClerkClient({ secretKey });
  const result = await handleSignupIntentRequest(
    { authorization: request.headers.get("authorization"), body },
    {
      // OJO: el `verifyToken` público de `@clerk/backend` (y de
      // `@clerk/nextjs/server`) está envuelto en `withLegacyReturn`: devuelve
      // el PAYLOAD del token y TIRA si no verifica. No devuelve
      // `{ data, errors }` (esa es la función interna). Desestructurarlo así
      // daba 401 con todo token válido.
      verifySessionToken: async (token) => {
        try {
          const payload = await verifyToken(token, { secretKey });
          // `sub` del token de sesión = id del usuario de Clerk.
          const sub = (payload as { readonly sub?: unknown }).sub;
          return typeof sub === "string" && sub !== "" ? sub : null;
        } catch (error) {
          // Solo el motivo que da Clerk (p. ej. `jwk-kid-mismatch`). Nunca el
          // token ni el usuario.
          const reason = (error as { readonly reason?: unknown } | null)?.reason;
          console.error(`[signup-intent] token rechazado: ${typeof reason === "string" ? reason : "error de verificación"}`);
          return null;
        }
      },
      getUser: (userId) => clerk.users.getUser(userId),
      // `updateUserMetadata` hace merge: no toca otras claves de `publicMetadata`.
      writeIntent: async (userId, intent) => {
        await clerk.users.updateUserMetadata(userId, { publicMetadata: { [SIGNUP_INTENT_KEY]: intent } });
      },
      now: () => Date.now(),
      logError: (message) => console.error(message),
    },
  );
  return json(result);
}

function json({ status, body }: SignupIntentResult): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
