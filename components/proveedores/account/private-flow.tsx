import { partnerAccountContent } from "@/lib/content/partner-account";
import { cn } from "@/lib/utils";

/** `id` del `<h1>`: la `<Section>` de cada página privada lo usa en `aria-labelledby`. */
export const PRIVATE_FLOW_TITLE_ID = "flujo-titulo";

export type PrivateFlowHeadContent = {
  /** Rótulo chico arriba del título. Es un `<p>`, nunca un heading. */
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: string;
};

/**
 * Encabezado de una pantalla privada de talleres: rótulo, `<h1>` y bajada.
 * Lo pintan las islas (con o sin sesión) para que el `<h1>` esté siempre en
 * el HTML del server y en la misma columna que el resto: un solo eje.
 */
export function PrivateFlowHead({
  head,
  className,
}: {
  readonly head: PrivateFlowHeadContent;
  readonly className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-label font-semibold text-brand-hover">{head.eyebrow}</p>
      <h1 id={PRIVATE_FLOW_TITLE_ID} className="font-display text-3xl font-bold text-balance text-ink md:text-4xl">
        {head.title}
      </h1>
      <p className="max-w-150 text-lead leading-relaxed text-ink/72">{head.intro}</p>
    </div>
  );
}

type SignInLayoutProps = {
  readonly head: PrivateFlowHeadContent;
  /** Lo que viene después de entrar: los pasos del flujo, el plan elegido… */
  readonly context?: React.ReactNode;
  /** El cuerpo de la tarjeta: el `<SignIn>` de Clerk o su "cargando". */
  readonly children: React.ReactNode;
};

/**
 * Login de las pantallas privadas de talleres: dos columnas desde `lg`
 * (contexto a la izquierda, tarjeta de login a la derecha), apiladas en
 * mobile (contexto compacto arriba). Todo alineado al mismo borde que el
 * header: un solo eje, sin el título a la izquierda y el login centrado.
 *
 * La tarjeta es la NUESTRA (borde `line` sobre blanco, radio de panel); la
 * de Clerk va transparente adentro (`lib/auth/clerk-appearance.ts`), así
 * no hay tarjeta sobre tarjeta. Un solo encabezado de login: el de Clerk
 * va oculto.
 *
 * Sin estado: sirve en el server (el fallback de `<Suspense>`) y en las
 * islas.
 */
export function SignInLayout({ head, context, children }: SignInLayoutProps) {
  const { signIn } = partnerAccountContent;

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
      <div className="flex flex-col gap-8 lg:max-w-130 lg:flex-1 lg:pt-4">
        <PrivateFlowHead head={head} />
        {context}
      </div>

      <section
        aria-labelledby="ingresar-titulo"
        className="w-full rounded-panel border border-line bg-surface p-6 sm:p-8 lg:w-110 lg:shrink-0"
      >
        <h2 id="ingresar-titulo" className="font-display text-xl font-bold text-ink">
          {signIn.title}
        </h2>
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink/70">{signIn.body}</p>
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}

/**
 * Mientras Clerk carga: ocupa más o menos lo que el formulario de login, así
 * la tarjeta no salta de alto cuando aparece.
 */
export function SignInLoading() {
  return (
    <p role="status" className="flex min-h-80 items-start text-ink/65">
      {partnerAccountContent.signIn.loading}
    </p>
  );
}
