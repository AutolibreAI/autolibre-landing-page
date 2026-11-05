import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import type { IconName } from "@/lib/content/types";
import { providersContent } from "@/lib/content/providers";
import { providersDirectoryContent } from "@/lib/content/providers-directory";
import { PROVEEDORES_PATH, PROVEEDORES_Q_MAX_LENGTH } from "@/lib/proveedores/query";
import { whatsappUrl } from "@/lib/whatsapp";

const SEARCH_INPUT_ID = "registro-buscar-taller";

const linkClass =
  "inline-flex min-h-11 items-center gap-1.5 self-start font-semibold text-brand-hover underline-offset-4 hover:underline";

function ForkIcon({ name }: { readonly name: IconName }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-brand-hover"
    >
      <Icon name={name} size={24} strokeWidth={1.7} />
    </span>
  );
}

/**
 * "¿Tu taller ya aparece en AutoLibre?": la bifurcación de
 * `/proveedores/registro`, pegada al hero (misma banda `muted`, sin padding
 * arriba). Dos caminos del mismo peso, porque los dos son correctos:
 *
 * - Ya aparece → no se registra dos veces. La acción principal es buscarlo:
 *   el MISMO form GET del directorio (`/proveedores?q=…#red`), sin JS y con
 *   el resultado de siempre. La secundaria, escribirle al equipo por
 *   WhatsApp. Página pública: el mecanismo de verificación del dueño (código
 *   de reclamo) NO se menciona ni se enlaza; lo maneja el equipo.
 * - Primera vez → el formulario de alta (privado, con Clerk).
 *
 * Server Component. El link al formulario (con Clerk) va con
 * `prefetch={false}`: esta página indexable no baja nada de Clerk (FR-011).
 * Conserva `id="form"` para los links viejos a `/proveedores/registro#form`:
 * hoy el alta empieza acá.
 */
export function ProvidersRegisterForkSection() {
  const { fork, register } = providersContent;
  const { listed, firstTime } = fork;

  return (
    <Section
      id="form"
      tone="muted"
      spacing="md"
      container="prose"
      className="pt-0 md:pt-0"
      aria-labelledby="registro-bifurcacion-titulo"
    >
      <div className="mx-auto max-w-150 text-center">
        <h2 id="registro-bifurcacion-titulo" className="font-display text-2xl font-bold text-ink md:text-3xl">
          {fork.title}
        </h2>
        <p className="mt-3 text-balance text-[0.9375rem] leading-relaxed text-ink/72 md:text-base">{fork.intro}</p>
      </div>

      <ul className="mt-10 grid gap-5 md:grid-cols-2 md:gap-6">
        <li className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-6 md:p-8">
          <ForkIcon name="search" />
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-xl font-bold text-ink">{listed.title}</h3>
            <p className="text-[0.9375rem] leading-relaxed text-ink/72">{listed.body}</p>
          </div>

          <form
            role="search"
            method="get"
            action={`${PROVEEDORES_PATH}#${providersDirectoryContent.directory.id}`}
            className="mt-auto flex flex-col gap-3"
          >
            <label htmlFor={SEARCH_INPUT_ID} className="text-label font-semibold text-ink">
              {listed.search.label}
            </label>
            <div className="relative">
              <Icon
                name="search"
                size={20}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink/60"
              />
              <Input
                id={SEARCH_INPUT_ID}
                type="search"
                name="q"
                maxLength={PROVEEDORES_Q_MAX_LENGTH}
                placeholder={listed.search.placeholder}
                autoComplete="organization"
                required
                className="h-12 pl-11"
              />
            </div>
            <Button type="submit" block className="min-h-12">
              {listed.search.submit}
            </Button>
          </form>

          <a
            href={whatsappUrl(listed.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
            data-analytics-placement="registro_ya_aparece"
            className={`-my-2 ${linkClass}`}
          >
            <Icon name="whatsapp" size={18} strokeWidth={1.8} />
            {listed.contact.cta}
          </a>
        </li>

        <li className="flex flex-col gap-5 rounded-panel border border-line bg-surface p-6 md:p-8">
          <ForkIcon name="wrench" />
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-xl font-bold text-ink">{firstTime.title}</h3>
            <p className="text-[0.9375rem] leading-relaxed text-ink/72">{firstTime.body}</p>
          </div>

          <ButtonLink
            href={register.cta.href}
            prefetch={false}
            block
            className="mt-auto min-h-12"
            data-analytics-event={ANALYTICS_EVENTS.partnerRegisterStarted}
          >
            {firstTime.cta}
          </ButtonLink>

          <a href={`#${register.id}`} className={`-my-2 ${linkClass}`}>
            {firstTime.stepsLink}
            <Icon name="chevron-down" size={16} strokeWidth={2} />
          </a>
        </li>
      </ul>
    </Section>
  );
}
