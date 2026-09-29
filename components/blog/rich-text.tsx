import Image from "next/image";
import Link from "next/link";
import { RichText as HygraphRichText } from "@graphcms/rich-text-react-renderer";
import type { NodeRendererType } from "@graphcms/rich-text-react-renderer";
import type {
  EmbedReferences,
  RichTextContent,
} from "@graphcms/rich-text-types";

/**
 * Los estilos van acá, en los renderers, y no en un `prose` global: el CMS
 * devuelve un AST, así que cada nodo pasa por un componente nuestro y queda
 * con los tokens del sitio (tipografía display en headings, verde de marca en
 * links) sin depender de un plugin de tipografía.
 *
 * Es una función y no un objeto suelto porque cada `h2` necesita un `id`
 * posicional (`section-0`, `section-1`, ...) para que la tabla de contenidos
 * del artículo (`lib/hygraph/toc.ts`) pueda linkear a él con un anchor — el
 * AST de Hygraph no trae ids propios. El contador vive en un closure que se
 * crea de nuevo en cada render, así el primer `h2` del post siempre es
 * `section-0` tanto acá como en `extractToc`.
 */
function buildRenderers(): NodeRendererType {
  let headingIndex = 0;

  return {
    h1: ({ children }) => (
      <h2 className="mt-12 mb-4 font-display text-[1.75rem] leading-tight font-bold text-ink">
        {children}
      </h2>
    ),
    h2: ({ children }) => (
      <h2
        id={`section-${headingIndex++}`}
        className="mt-12 mb-4 scroll-mt-20 font-display text-[1.625rem] leading-tight font-bold text-ink md:text-[2rem]"
      >
        {children}
      </h2>
    ),
  h3: ({ children }) => (
    <h3 className="mt-9 mb-3 font-display text-[1.25rem] leading-tight font-bold text-ink md:text-[1.375rem]">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-7 mb-2 font-display text-lg font-bold text-ink">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="my-5 text-[1.0625rem] leading-[1.75] text-ink/80">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-5 list-disc space-y-2 pl-6 text-[1.0625rem] leading-[1.75] text-ink/80 marker:text-brand">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-5 list-decimal space-y-2 pl-6 text-[1.0625rem] leading-[1.75] text-ink/80 marker:font-semibold marker:text-brand">
      {children}
    </ol>
  ),
  bold: ({ children }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-8 border-l-4 border-brand pl-5 text-[1.125rem] text-ink [&_p]:text-ink">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.9em] text-ink">
      {children}
    </code>
  ),
  code_block: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-card bg-ink p-5 font-mono text-sm leading-relaxed text-white">
      {children}
    </pre>
  ),
  a: ({ href, children, openInNewTab }) => {
    const className =
      "font-medium text-brand underline underline-offset-2 transition-colors hover:text-brand-hover";

    if (href?.startsWith("/")) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }

    return (
      <a
        href={href}
        className={className}
        {...(openInNewTab === false
          ? {}
          : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.9375rem]">
        {children}
      </table>
    </div>
  ),
  table_header_cell: ({ children }) => (
    <th className="border-b border-ink/20 px-3 py-2 font-semibold text-ink">
      {children}
    </th>
  ),
  table_cell: ({ children }) => (
    <td className="border-b border-line px-3 py-2 text-ink/80">{children}</td>
  ),
  Asset: {
    // Cualquier imagen embebida en el cuerpo del post.
    image: ({ url, width, height, altText }) => (
      <figure className="my-8">
        <Image
          src={url}
          alt={altText ?? ""}
          width={width ?? 1200}
          height={height ?? 675}
          sizes="(min-width: 768px) 720px, 100vw"
          className="h-auto w-full rounded-card"
        />
      </figure>
    ),
  },
  };
}

type RichTextProps = {
  readonly content: RichTextContent;
  readonly references: EmbedReferences;
};

/** Cuerpo de un post: el AST `raw` de Hygraph renderizado con los tokens del sitio. */
export function RichText({ content, references }: RichTextProps) {
  return (
    <HygraphRichText
      content={content}
      references={references}
      renderers={buildRenderers()}
    />
  );
}
