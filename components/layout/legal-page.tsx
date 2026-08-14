import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Container } from "@/components/ui/container";

type LegalPageProps = {
  readonly title: string;
  readonly updatedAt: string;
  readonly children: React.ReactNode;
};

/**
 * Plantilla de las páginas legales. La tipografía del cuerpo se define acá
 * con selectores de hijo, así los documentos quedan como prosa limpia sin
 * repetir clases en cada `<h2>` y cada `<p>`.
 */
export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <PageShell>
      <Container size="narrow" className="py-16 md:py-20">
        <Link
          href="/"
          className="text-sm font-semibold text-brand transition-colors hover:text-brand-hover"
        >
          ← Volver al inicio
        </Link>

        <h1 className="mt-8 font-display text-[2rem] font-bold text-ink md:text-[2.375rem]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-ink/55">
          Última actualización: {updatedAt}
        </p>

        <div className="mt-10 [&_a]:font-medium [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-9 [&_h2]:mb-2.5 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_p]:text-[0.9375rem] [&_p]:leading-[1.75] [&_p]:text-ink/75 [&_strong]:font-semibold [&_strong]:text-ink">
          {children}
        </div>
      </Container>
    </PageShell>
  );
}
