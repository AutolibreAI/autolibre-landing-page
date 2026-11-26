import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { ACCOUNT_PATH, ACCOUNT_SIGN_OUT_PARAM } from "@/lib/account/paths";
import { ROLE_HINT_COOKIE } from "@/lib/auth/role-hint";
import { clerkClientUatCookieName } from "@/lib/auth/session-cookie";
import {
  buildSignInHref,
  parseSafeRedirect,
  SIGN_IN_PATH,
  SIGN_IN_REDIRECT_PARAM,
} from "@/lib/auth/sign-in-redirect";

/**
 * Proxy (el `middleware.ts` de Next ≤15) con `clerkMiddleware`, SOLO en las
 * pantallas privadas y en `/ingresar` (2026-11-26). Corre en el server antes
 * de renderizar:
 * - Sin sesión en una ruta protegida → 307 a `/ingresar?redirect=<ruta+query>`.
 * - Con sesión en `/ingresar` → 307 al destino (ya validado).
 *
 * El `matcher` es ESTÁTICO y angosto a propósito: ninguna página indexable
 * paga el costo de Clerk (211, research D4 sigue en pie para todo lo
 * público). En particular NO corre en `/proveedores/registro`: sin `?alta`
 * es la landing pública "Sumá tu negocio" (el alta se protege del lado del
 * cliente y sus CTA ya linkean a `/ingresar`). Tampoco en `/api`: la ruta de
 * `/api/account/intent` verifica el token ella misma.
 *
 * Esto es UX, no autorización: el backend verifica el token de Clerk en cada
 * llamada, y las islas tienen su propio respaldo si la sesión vence con la
 * página abierta.
 */
export default clerkMiddleware(async (auth, request) => {
  const { pathname, search, searchParams } = request.nextUrl;
  const { userId } = await auth();

  if (pathname === SIGN_IN_PATH) {
    if (!userId) return NextResponse.next();
    return NextResponse.redirect(new URL(parseSafeRedirect(searchParams.get(SIGN_IN_REDIRECT_PARAM)), request.url));
  }

  if (userId) return NextResponse.next();

  // Navegación del cliente (RSC o prefetch) con el token de sesión vencido:
  // Clerk solo lo renueva (handshake) en pedidos de documento, así que acá
  // llega "sin sesión" aunque el browser la tenga (pestaña en segundo plano,
  // por ejemplo). Si `__client_uat` dice que hay sesión, se deja pasar: la
  // isla ve la sesión real y, si de verdad no hay, manda a `/ingresar`.
  if (!isDocumentRequest(request) && hasClientSession(request)) return NextResponse.next();

  // `/cuenta?salir=1` sin sesión: no hay nada que cerrar. Se vuelve a
  // `/cuenta` (sin el `?salir`) y se borra la pista de rol del header.
  if (pathname === ACCOUNT_PATH && searchParams.has(ACCOUNT_SIGN_OUT_PARAM)) {
    const response = NextResponse.redirect(new URL(buildSignInHref(ACCOUNT_PATH), request.url));
    response.cookies.delete(ROLE_HINT_COOKIE);
    return response;
  }

  return NextResponse.redirect(new URL(buildSignInHref(`${pathname}${search}`), request.url));
});

/** Un pedido de documento (navegación completa), no un fetch de RSC ni un prefetch. */
function isDocumentRequest(request: NextRequest): boolean {
  const dest = request.headers.get("sec-fetch-dest");
  if (dest) return dest === "document";
  return request.headers.get("rsc") === null && (request.headers.get("accept") ?? "").includes("text/html");
}

/** `__client_uat` (sufijada o no) con un timestamp: el browser cree que hay sesión. */
function hasClientSession(request: NextRequest): boolean {
  const suffixed = clerkClientUatCookieName();
  const value =
    (suffixed ? request.cookies.get(suffixed)?.value : undefined) ?? request.cookies.get("__client_uat")?.value;
  return value !== undefined && value !== "" && value !== "0";
}

/**
 * Rutas exactas (sin comodines): `/cuenta`, la contratación y su resultado,
 * el reclamo y el login. Tienen que ser constantes (Next las analiza en el
 * build). Si se suma una pantalla privada, se agrega acá.
 */
export const config = {
  matcher: [
    "/cuenta",
    "/proveedores/contratar",
    "/proveedores/contratar/resultado",
    "/proveedores/reclamar",
    "/ingresar",
  ],
};
