import type { Metadata } from "next";
import { AboutClosing } from "@/components/about/about-closing";
import { AboutHero } from "@/components/about/about-hero";
import { AboutPurpose } from "@/components/about/about-purpose";
import { AboutStory } from "@/components/about/about-story";
import { AboutTeam } from "@/components/about/about-team";
import { AboutTimeline } from "@/components/about/about-timeline";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { ABOUT_COPY_READY, aboutContent } from "@/lib/content/about";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  personId,
  personSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { title: TITLE, description: DESCRIPTION } = aboutContent.metadata;
const PATH = "/sobre-nosotros";

export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

/**
 * Las personas solo entran al grafo con copy real (`ABOUT_COPY_READY`): con
 * nombres de relleno serían entidades inventadas. Mismo criterio para
 * `foundingDate`, que sale únicamente si el contenido la trae.
 */
const members = ABOUT_COPY_READY ? aboutContent.team.members : [];

const schema = graph(
  organizationSchema({
    founderIds: members.filter((m) => m.founder).map((m) => personId(m.id)),
    employeeIds: members.filter((m) => !m.founder).map((m) => personId(m.id)),
    foundingDate: aboutContent.foundingDate,
  }),
  webPageSchema({ name: TITLE, description: DESCRIPTION, path: PATH, type: "AboutPage" }),
  breadcrumbSchema([
    { name: aboutContent.breadcrumb.home, path: "/" },
    { name: aboutContent.breadcrumb.about, path: PATH },
  ]),
  ...members.map((m) =>
    personSchema({
      id: personId(m.id),
      name: m.name,
      jobTitle: m.role,
      sameAs: m.linkedin ? [m.linkedin] : [],
    }),
  ),
);

/**
 * "Sobre nosotros" (rediseño 2026-11, lienzo `Nosotros`): todo Server
 * Component, sin una sola isla client. Hero tipográfico, misión y visión,
 * historia, hitos, equipo y cierre con el pedido. Sin migas visibles (el
 * lienzo no las muestra; quedan en el JSON-LD) y sin barra fija en celular.
 */
export default function SobreNosotrosPage() {
  return (
    <>
      <PageShell currentPath={PATH}>
        <AboutHero />
        <AboutPurpose />
        <AboutStory />
        <AboutTimeline />
        <AboutTeam />
        <AboutClosing />
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
