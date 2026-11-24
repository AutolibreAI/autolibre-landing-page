import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";

/** `id` del `<h1>`: la `<Section>` de cada página privada lo usa en `aria-labelledby`. */
export const PRIVATE_FLOW_TITLE_ID = "flujo-titulo";

export type PrivateFlowHeadContent = {
  /** Rótulo chico arriba del título. Es un `<p>`, nunca un heading. */
  readonly eyebrow: string;
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
      <p className="text-sm font-semibold text-brand-hover">{head.eyebrow}</p>
      <h1
        id={PRIVATE_FLOW_TITLE_ID}
        tabIndex={-1}
        className="font-display text-4xl font-bold tracking-tight text-balance text-fg md:text-5xl"
      >
        {head.title}
      </h1>
      <p className="max-w-160 text-lead text-fg-muted md:text-lead-lg">{head.intro}</p>
    </div>
  );
}

type IngresarPanelProps = {
  /** Bajada debajo del `<h1>` "Ingresá o creá tu cuenta". */
  readonly intro?: string;
  /** Lo que va ARRIBA del título: los pasos del flujo, el plan elegido… */
  readonly above?: React.ReactNode;
  /** Lo que va debajo del panel ("Con una sola cuenta"), además de la lista. */
  readonly below?: React.ReactNode;
  /** "¿Tenés un taller o un servicio? Sumá tu negocio" (no en el alta). */
  readonly showJoin?: boolean;
  /** El `<SignIn>` de Clerk o su "cargando". */
  readonly children: React.ReactNode;
  readonly className?: string;
};

/**
 * Panel único "Ingresá o creá tu cuenta" (lienzo `Ingresar`): el estado sin
 * sesión de `/cuenta` y de los flujos privados. Una sola columna centrada de
 * 440px. En los flujos de proveedor no hay que elegir nada; en `/cuenta`,
 * "Crear cuenta" pregunta cliente o taller (registro del 2026-11-24, ver
 * `PartnerSignIn`), solo para ordenar "Mi cuenta". Debajo, "Con una sola
 * cuenta" refuerza que la cuenta es la misma para las dos cosas.
 *
 * Sin estado ni Clerk: sirve en el server y en las islas. El `<SignIn>` (o su
 * "cargando", del mismo alto) llega como `children`.
 */
export function IngresarPanel({ intro = ingresar.body, above, below, showJoin = true, children, className }: IngresarPanelProps) {
  return (
    <div className={cn("mx-auto flex w-full max-w-110 flex-col gap-8", className)}>
      {above}
      <section aria-labelledby={PRIVATE_FLOW_TITLE_ID} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1
            id={PRIVATE_FLOW_TITLE_ID}
            tabIndex={-1}
            className="font-display text-4xl font-bold tracking-tight text-balance text-fg"
          >
            {ingresar.title}
          </h1>
          <p className="text-lead text-fg-muted">{intro}</p>
        </div>
        {children}
        <p className="text-label text-fg-muted">
          {ingresar.legalPrefix}{" "}
          <Link href={ingresar.terms.href} className="underline underline-offset-4 hover:text-fg">
            {ingresar.terms.label}
          </Link>{" "}
          {ingresar.legalJoin}{" "}
          <Link href={ingresar.privacy.href} className="underline underline-offset-4 hover:text-fg">
            {ingresar.privacy.label}
          </Link>
          .
        </p>
      </section>

      <div className="flex flex-col gap-3 border-t border-fg pt-6">
        <p className="text-sm font-semibold text-fg">{ingresar.oneAccount.title}</p>
        <ul className="flex flex-col gap-2.5">
          {ingresar.oneAccount.items.map((item) => (
            <li key={item.strong} className="flex items-start gap-2.5 text-base text-fg-muted">
              <Icon name="check" size={18} strokeWidth={2.4} className="mt-1 shrink-0 text-fg" />
              <span>
                <strong className="font-semibold text-fg">{item.strong}</strong>
                {item.rest}
              </span>
            </li>
          ))}
        </ul>
        {showJoin ? (
          <p className="pt-1 text-base text-fg-muted">
            {ingresar.joinPrefix}{" "}
            <Link href={PROVEEDORES_REGISTRO_PATH} className={textLink}>
              {ingresar.join}
            </Link>
          </p>
        ) : null}
        {below}
      </div>
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
export function SignInLayout({ head, headSlot, context, intro, showJoin, children }: SignInLayoutProps) {
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
 * Mientras Clerk carga: ocupa lo que el formulario de login (email,
 * "Continuar", divisor y los tres botones sociales), así el panel no salta de
 * alto cuando aparece.
 */
export function SignInLoading() {
  return (
    <p role="status" className="flex min-h-96 items-start text-fg-muted">
      {signIn.loading}
    </p>
  );
}
