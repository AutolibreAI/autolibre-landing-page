import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";

/** `id` del `<h1>`: la `<Section>` de cada página privada lo usa en `aria-labelledby`. */
export const PRIVATE_FLOW_TITLE_ID = "flujo-titulo";

export type PrivateFlowHeadContent = {
  /**
   * Rótulo chico arriba del título (un `<p>`, nunca un heading). Opcional:
   * el rediseño va sacando los eyebrows; sin él, solo el `<h1>` y la bajada.
   */
  readonly eyebrow?: string;
  readonly title: string;
  readonly intro: string;
};

const { signIn, ingresar } = partnerAccountContent;

/** Link de texto subrayado (sobre `card` o `canvas`). */
const textLink =
  "font-semibold text-fg underline underline-offset-4 transition-colors hover:text-brand-hover motion-reduce:transition-none";

/**
 * Encabezado de una pantalla privada de negocios: rótulo, `<h1>` y bajada
 * (sistema AutoLibre AI). Lo pintan las islas (con o sin sesión) para que el
 * `<h1>` esté siempre en el HTML del server.
 */
export function PrivateFlowHead({
  head,
  className,
}: {
  readonly head: PrivateFlowHeadContent;
  readonly className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {head.eyebrow ? (
        <p className="text-sm font-semibold text-brand-hover">{head.eyebrow}</p>
      ) : null}
      <h1
        id={PRIVATE_FLOW_TITLE_ID}
        tabIndex={-1}
        className="font-display text-4xl font-bold tracking-tight text-balance text-fg md:text-5xl"
      >
        {head.title}
      </h1>
      <p className="max-w-160 text-lead text-fg-muted md:text-lead-lg">
        {head.intro}
      </p>
    </div>
  );
}

type IngresarPanelProps = {
  /** Bajada debajo del `<h1>` "Ingresá o creá tu cuenta". */
  readonly intro?: string;
  /** Lo que va ARRIBA del título: los pasos del flujo, el plan elegido… */
  readonly above?: React.ReactNode;
  /** Lo que va al final del panel "Con una sola cuenta", además de la lista. */
  readonly below?: React.ReactNode;
  /** "¿Tenés un taller o un servicio? Sumá tu negocio" (no en el alta). */
  readonly showJoin?: boolean;
  /** El `<SignIn>` de Clerk o su "cargando" (ver `ClerkSlot`). */
  readonly children: React.ReactNode;
  readonly className?: string;
};

/** `id` del `<h2>` del panel "Con una sola cuenta" (uno por página). */
const ONE_ACCOUNT_TITLE_ID = "ingresar-una-cuenta";

/**
 * Panel único "Ingresá o creá tu cuenta" (lienzo `Ingresar`): el estado sin
 * sesión de `/cuenta` y de los flujos privados.
 *
 * Densidad (2026-11-25): desde `lg`, dos columnas alineadas con el header
 * (grilla de 12): el formulario a la izquierda (420px como máximo) y "Con una
 * sola cuenta" en un panel `brand-50` que ocupa el alto del formulario; todo
 * entra sin scroll a 1440x900. En celular, el formulario primero (título,
 * email, "Continuar" y los botones sociales en la primera pantalla) y el
 * panel debajo. En los flujos de proveedor no hay que elegir nada; en
 * `/cuenta`, "Crear cuenta" pregunta cliente o taller (ver `PartnerSignIn`).
 *
 * Sin estado ni Clerk: sirve en el server y en las islas. El `<SignIn>` (o su
 * "cargando") llega como `children`, dentro de un `ClerkSlot` que reserva su
 * alto: lo que sigue (la línea legal, el footer) no se mueve cuando Clerk
 * monta (CLS).
 */
export function IngresarPanel({
  intro = ingresar.body,
  above,
  below,
  showJoin = true,
  children,
  className,
}: IngresarPanelProps) {
  return (
    <div className={cn("grid gap-10 lg:grid-cols-12 lg:gap-12", className)}>
      <div className="flex w-full max-w-105 flex-col gap-6 lg:col-span-6 xl:col-span-5">
        {above}
        <section
          aria-labelledby={PRIVATE_FLOW_TITLE_ID}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <h1
              id={PRIVATE_FLOW_TITLE_ID}
              tabIndex={-1}
              className="font-display text-3xl font-bold tracking-tight text-balance text-fg lg:text-4xl"
            >
              {ingresar.title}
            </h1>
            <p className="text-base text-fg-muted lg:text-lead">{intro}</p>
          </div>
          {children}
          <p className="text-label text-fg-muted">
            {ingresar.legalPrefix}{" "}
            <Link
              href={ingresar.terms.href}
              className="underline underline-offset-4 hover:text-fg"
            >
              {ingresar.terms.label}
            </Link>{" "}
            {ingresar.legalJoin}{" "}
            <Link
              href={ingresar.privacy.href}
              className="underline underline-offset-4 hover:text-fg"
            >
              {ingresar.privacy.label}
            </Link>
            .
          </p>
        </section>
      </div>

      <section
        aria-labelledby={ONE_ACCOUNT_TITLE_ID}
        className="flex overflow-clip rounded-3xl bg-brand-50 lg:col-span-6 xl:col-span-7"
      >
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 p-6 sm:p-8 lg:gap-6 lg:p-12 lg:pr-6">
          <h2
            id={ONE_ACCOUNT_TITLE_ID}
            className="font-display text-xl font-bold text-balance text-fg lg:text-3xl"
          >
            {ingresar.oneAccount.title}
          </h2>
          <ul className="flex max-w-120 flex-col gap-3 lg:gap-4">
            {ingresar.oneAccount.items.map((item) => (
              <li
                key={item.strong}
                className="flex items-start gap-3 text-base text-fg-muted lg:text-lead"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-brand-hover"
                >
                  <Icon name="check" size={14} strokeWidth={2.6} />
                </span>
                <span>
                  <strong className="font-semibold text-fg">
                    {item.strong}
                  </strong>
                  {item.rest}
                </span>
              </li>
            ))}
          </ul>
          {showJoin ? (
            <p className="text-base text-fg-muted">
              {ingresar.joinPrefix}{" "}
              <Link href={PROVEEDORES_REGISTRO_PATH} className={textLink}>
                {ingresar.join}
              </Link>
            </p>
          ) : null}
          {below}
        </div>
        {/* La captura real de la app en el mismo bisel que el panel de la
            home, cortada por el borde inferior del panel. Solo desde `xl` (en
            `lg` la columna es angosta) y fuera del camino crítico: no es la
            imagen LCP (el `<h1>` lo es). */}
        <div className="hidden w-60 shrink-0 self-end pr-10 xl:block">
          <div className="-mb-16 overflow-clip rounded-t-4xl border-8 border-b-0 border-ink bg-card">
            <Image
              src={ingresar.oneAccount.appShot.src}
              width={ingresar.oneAccount.appShot.width}
              height={ingresar.oneAccount.appShot.height}
              alt={ingresar.oneAccount.appShot.alt}
              sizes="184px"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

type SignInLayoutProps = {
  /** Encabezado de la pantalla: su `intro` pasa a ser la bajada del panel. */
  readonly head?: PrivateFlowHeadContent;
  /** Encabezado YA renderizado (en el server), arriba del panel. */
  readonly headSlot?: React.ReactNode;
  /** Lo que acompaña al login (pasos del flujo, plan elegido…), arriba del título. */
  readonly context?: React.ReactNode;
  /** Bajada del panel; si falta, la `intro` de `head` o la genérica. */
  readonly intro?: string;
  /** "Sumá tu negocio" debajo del panel. */
  readonly showJoin?: boolean;
  /** El cuerpo: el `<SignIn>` de Clerk o su "cargando". */
  readonly children: React.ReactNode;
};

/**
 * Login de las pantallas privadas de negocios. Desde el rediseño 2026-11 es
 * el panel único `IngresarPanel`; se conserva esta API (`head`, `headSlot`,
 * `context`) para los que ya la usan (`/cuenta`).
 *
 * Sin estado: sirve en el server (el fallback de `<Suspense>`) y en las islas.
 */
export function SignInLayout({
  head,
  headSlot,
  context,
  intro,
  showJoin,
  children,
}: SignInLayoutProps) {
  return (
    <IngresarPanel
      intro={intro ?? head?.intro ?? ingresar.body}
      showJoin={showJoin}
      above={
        headSlot || context ? (
          <>
            {headSlot}
            {context}
          </>
        ) : undefined
      }
    >
      {children}
    </IngresarPanel>
  );
}

/**
 * Qué componente de Clerk ocupa el lugar, para reservarle el alto:
 * - `signIn`: `<SignIn withSignUp>` de los flujos de proveedor (con el
 *   "¿No tenés cuenta? Registrate" de Clerk al pie).
 * - `signInBare`: el `<SignIn>` de `/cuenta`, sin ese pie (lo reemplazan
 *   las pestañas "Ingresar" / "Crear cuenta").
 * - `signUp`: el `<SignUp>` de `/cuenta`, sin pie.
 */
export type ClerkSlotKind = "signIn" | "signInBare" | "signUp";

/**
 * Alto mínimo de cada widget de Clerk YA montado (primer paso: email,
 * "Continuar", divisor, botones sociales y "Secured by Clerk"), medido con la
 * apariencia de `lib/auth/clerk-appearance.ts`. Si cambia la apariencia, se
 * vuelve a medir: si el widget queda más alto que la reserva, la línea legal
 * y el footer saltan cuando Clerk monta.
 */
const slotHeights: Record<ClerkSlotKind, string> = {
  // 280px medidos (2026-11-25) en los dos: el "¿No tenés cuenta?" del pie
  // de Clerk no cambia el alto del primer paso.
  signIn: "min-h-70",
  signInBare: "min-h-70",
  // 379px medidos: email, contraseña, "Continuar" y los botones sociales.
  signUp: "min-h-95",
};

/**
 * Lugar del widget de Clerk: reserva su alto mientras carga (`loading`, con
 * un esqueleto quieto del formulario) y cuando monta, así nada de lo que
 * sigue se mueve. El `<SignIn>` de Clerk llega vacío y se llena ~1s después.
 */
export function ClerkSlot({
  kind,
  loading = false,
  children,
}: {
  readonly kind: ClerkSlotKind;
  readonly loading?: boolean;
  readonly children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col", slotHeights[kind])}>
      {loading ? <SignInLoading /> : children}
    </div>
  );
}

/**
 * Mientras Clerk carga: el esqueleto del primer paso (label, email,
 * "Continuar", divisor y los botones sociales), en los tonos de las líneas,
 * sin animación. El texto queda para lectores de pantalla.
 */
export function SignInLoading() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">{signIn.loading}</span>
      <div aria-hidden="true" className="flex flex-col gap-1.5">
        <span className="h-4 w-32 rounded-full bg-card-line" />
        <span className="h-12 rounded-full border border-card-line bg-card" />
      </div>
      <span aria-hidden="true" className="h-12 rounded-full bg-card-line" />
      <span aria-hidden="true" className="h-px bg-card-line" />
      <div aria-hidden="true" className="grid grid-cols-3 gap-2">
        <span className="h-12 rounded-full border border-card-line bg-card" />
        <span className="h-12 rounded-full border border-card-line bg-card" />
        <span className="h-12 rounded-full border border-card-line bg-card" />
      </div>
    </div>
  );
}
