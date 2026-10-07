import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { Directory } from "@/components/sections/provider-profile/directory";
import { Container } from "@/components/ui/container";
import {
  fillTemplate,
  providerProfileContent as copy,
} from "@/lib/content/provider-profile";
import { listProviderProfiles } from "@/lib/provider-profile/api";
import { isValidSlug } from "@/lib/provider-profile/slug";
import { PROVIDER_PROFILES_PUBLIC } from "@/lib/provider-profile/visibility";
import { createMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, graph, organizationSchema, webPageSchema } from "@/lib/seo/schema";
import type { PartnerProfileList } from "@/lib/provider-profile/types";

type PageProps = {
  readonly searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const PATH = "/p";
const PAGE_SIZE = 24;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Lee `?rubro=`, `?zona=` y `?page=`; un valor raro se ignora (nunca tira). */
function parseQuery(raw: { [key: string]: string | string[] | undefined }) {
  const rubro = first(raw.rubro);
  const zona = first(raw.zona);
  const pageNumber = Number(first(raw.page));
  return {
    category: rubro && isValidSlug(rubro) ? rubro : undefined,
    locality: zona && isValidSlug(zona) ? zona : undefined,
    page: Number.isInteger(pageNumber) && pageNumber >= 1 ? pageNumber : 1,
  };
}

/**
 * Las variantes filtradas y las páginas 2+ llevan `noindex` y canonical a
 * `/p`: son vistas del mismo listado, no páginas propias (research D8). El
 * índice sin filtros se indexa solo con el interruptor encendido.
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parseQuery(await searchParams);
  const filtered = Boolean(query.category || query.locality || query.page > 1);
  return createMetadata({
    title: copy.directory.metaTitle,
    description: copy.directory.metaDescription,
    path: PATH,
    index: PROVIDER_PROFILES_PUBLIC && !filtered,
  });
}

/**
 * `/p`: índice "Proveedores en AutoLibre". Es el primer paso de las migas de
 * cada perfil y lo que le da destino a "Proveedores › Localidad › Rubro".
 * Un backend caído muestra el estado vacío (se loguea), no una página rota.
 */
export default async function ProvidersIndexPage({ searchParams }: PageProps) {
  const query = parseQuery(await searchParams);
  const filtered = Boolean(query.category || query.locality);

  let list: PartnerProfileList | null = null;
  try {
    list = await listProviderProfiles({ ...query, pageSize: PAGE_SIZE });
  } catch (error) {
    console.error("[provider-profile] no se pudo leer el índice:", error);
  }

  const schema = graph(
    organizationSchema(),
    webPageSchema({
      name: copy.directory.metaTitle,
      description: copy.directory.metaDescription,
      path: PATH,
      type: "CollectionPage",
    }),
    breadcrumbSchema([{ name: copy.breadcrumb.providers, path: PATH }]),
  );

  const href = (page: number) => {
    const params = new URLSearchParams();
    if (query.category) params.set("rubro", query.category);
    if (query.locality) params.set("zona", query.locality);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${PATH}?${qs}` : PATH;
  };

  return (
    <>
      <PageShell>
        <Container size="wide" className="py-10 md:py-14">
          <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">
            {copy.directory.title}
          </h1>
          <p className="mt-3 max-w-160 text-base leading-relaxed text-ink/75">
            {copy.directory.subtitle}
          </p>

          <Directory
            profiles={list?.data ?? []}
            emptyText={filtered ? copy.directory.emptyFiltered : copy.directory.empty}
          />

          {filtered ? (
            <Link
              href={PATH}
              className="mt-6 inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-brand-hover underline-offset-4 hover:underline"
            >
              {copy.directory.clearFilter}
            </Link>
          ) : null}

          {list && list.totalPages > 1 ? (
            <nav aria-label="Paginación" className="mt-8 flex items-center gap-4">
              {query.page > 1 ? (
                <Link
                  href={href(query.page - 1)}
                  className="inline-flex min-h-11 items-center font-semibold text-brand-hover hover:underline"
                >
                  {copy.directory.previous}
                </Link>
              ) : null}
              <span className="text-sm text-ink/65">
                {fillTemplate(copy.directory.page, { page: list.page, total: list.totalPages })}
              </span>
              {query.page < list.totalPages ? (
                <Link
                  href={href(query.page + 1)}
                  className="inline-flex min-h-11 items-center font-semibold text-brand-hover hover:underline"
                >
                  {copy.directory.next}
                </Link>
              ) : null}
            </nav>
          ) : null}
        </Container>
      </PageShell>
      <JsonLd schema={schema} />
    </>
  );
}
