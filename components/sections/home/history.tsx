import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

export function HistorySection() {
  const { title, subtitle, bullets, closing, sample } = homeContent.history;

  return (
    <Section tone="surface" aria-labelledby="history-title">
      <Container>
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <div className="max-w-[520px] flex-1">
            <h2
              id="history-title"
              className="font-display text-[2rem] font-bold text-ink md:text-[2.375rem]"
            >
              {title}
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink/72">
              {subtitle}
            </p>

            <ul className="mt-10 mb-11 flex flex-col gap-4.5">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  <span className="text-base leading-relaxed text-ink">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>

            <p className="font-display text-2xl leading-snug font-bold text-ink">
              {closing}
            </p>
          </div>

          {/* Ejemplo de historial. Datos ilustrativos, no de un usuario real. */}
          <div className="flex flex-1 justify-center">
            <Card
              variant="elevated"
              className="w-full max-w-[420px] rounded-panel px-6 py-7"
            >
              <p className="font-display text-lg font-bold text-ink">
                {sample.vehicle}
              </p>
              <p className="mt-1 mb-6 text-xs text-ink/50">{sample.plate}</p>

              <ol className="flex flex-col">
                {sample.entries.map((entry, index) => {
                  const isLast = index === sample.entries.length - 1;
                  return (
                    <li key={entry.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`size-2.5 rounded-full ${isLast ? "bg-brand-soft" : "bg-brand"}`}
                        />
                        {!isLast ? (
                          <span className="mt-1 w-0.5 flex-1 bg-line" />
                        ) : null}
                      </div>
                      <div className={isLast ? "" : "pb-7"}>
                        <p className="mb-1 text-[13px] text-ink/50">
                          {entry.date}
                        </p>
                        <p className="mb-1 font-display text-[15px] font-semibold text-ink">
                          {entry.title}
                        </p>
                        <p className="text-[13px] text-ink/60">
                          {entry.detail}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>
          </div>
        </div>
      </Container>
    </Section>
  );
}
