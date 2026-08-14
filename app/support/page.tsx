import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { SupportForm } from "@/components/forms/support-form";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { supportCopy } from "@/lib/content/forms";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const TITLE = "Soporte";
const DESCRIPTION =
  "¿Tenés un problema con AutoLibre? Escribinos desde acá y te respondemos por email. Un humano lee cada mensaje.";
const PATH = "/support";

export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

const schema = graph(
  organizationSchema(),
  webPageSchema({ name: TITLE, description: DESCRIPTION, path: PATH }),
  breadcrumbSchema([
    { name: "Inicio", path: "/" },
    { name: "Soporte", path: PATH },
  ]),
);

export default function SupportPage() {
  return (
    <>
      <PageShell>
        <Section tone="muted" spacing="md">
          <Container>
            <div className="mx-auto grid max-w-[1000px] items-start gap-12 lg:grid-cols-2">
              <div>
                <h1 className="font-display text-[2rem] font-bold text-ink md:text-[2.375rem]">
                  {supportCopy.title}
                </h1>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink/72">
                  {supportCopy.subtitle}
                </p>
                <ul className="mt-8 flex flex-col gap-3.5">
                  {supportCopy.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3">
                      <Icon
                        name="check"
                        size={18}
                        className="mt-1 shrink-0 text-brand"
                      />
                      <span className="text-[0.9375rem] text-ink/80">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <SupportForm />
            </div>
          </Container>
        </Section>
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
