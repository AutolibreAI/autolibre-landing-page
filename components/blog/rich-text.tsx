import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { RichText as HygraphRichText } from "@graphcms/rich-text-react-renderer";
import type { NodeRendererType } from "@graphcms/rich-text-react-renderer";
import type {
  ElementNode,
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
 *
 * Escala de lectura: cuerpo en `lead` → `lead-lg` (17 → 19px), en `ink`
 * pleno y no atenuado: es texto largo y el contraste importa más que en una
 * bajada.
 */
const bodyText = "text-lead leading-relaxed text-fg md:text-lead-lg";

const h2Class = "mt-14 mb-4 text-2xl leading-tight text-fg md:text-3xl";
const h3Class = "mt-10 mb-3 text-xl leading-snug text-fg md:text-2xl";
const h4Class = "mt-8 mb-2 text-lg text-fg";

/**
 * Headings de un rich text anidado bajo el `h2` de una sección (el texto
 * pilar de una categoría): todo baja un nivel para que el outline no salte
 * ni repita el nivel de la sección — `h1`/`h2` → `h3`, `h3` → `h4`, `h4` →
 * `h5`, `h5`/`h6` → `h6`. El estilo sigue al nivel que eligió el editor, no
 * al tag. Sin ids: esos headings no entran en ninguna tabla de contenidos.
 */
const nestedHeadings: NodeRendererType = {
  h1: ({ children }) => <h3 className={h2Class}>{children}</h3>,
  h2: ({ children }) => <h3 className={h2Class}>{children}</h3>,
  h3: ({ children }) => <h4 className={h3Class}>{children}</h4>,
  h4: ({ children }) => <h5 className={h4Class}>{children}</h5>,
  h5: ({ children }) => <h6 className={h4Class}>{children}</h6>,
  h6: ({ children }) => <h6 className={h4Class}>{children}</h6>,
};

function buildRenderers(nested: boolean): NodeRendererType {
  let headingIndex = 0;

  const articleHeadings: NodeRendererType = {
    // El `h1` es el título de la nota: un `h1` dentro del cuerpo baja a `h2`
    // para que la página tenga uno solo.
    h1: ({ children }) => <h2 className={h2Class}>{children}</h2>,
    h2: ({ children }) => (
      <h2 id={`section-${headingIndex++}`} className={`scroll-mt-24 ${h2Class}`}>
        {children}
      </h2>
    ),
    h3: ({ children }) => <h3 className={h3Class}>{children}</h3>,
    h4: ({ children }) => <h4 className={h4Class}>{children}</h4>,
  };

  return {
    ...(nested ? nestedHeadings : articleHeadings),
    p: ({ children }) => <p className={`my-5 ${bodyText}`}>{children}</p>,
    // Cada ítem de Hygraph trae su texto en un `paragraph` (list-item →
    // list-item-child → paragraph): sin `[&_p]:my-0` el `my-5` del párrafo
    // separa los ítems el doble que el `space-y`.
    ul: ({ children }) => (
      <ul
        className={`my-6 list-disc space-y-2.5 pl-6 marker:text-brand [&_p]:my-0 ${bodyText}`}
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol
        className={`my-6 list-decimal space-y-2.5 pl-6 marker:font-semibold marker:text-brand-hover [&_p]:my-0 ${bodyText}`}
      >
        {children}
      </ol>
    ),
    bold: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
    // Panel en verde pálido y no una barra lateral: el sistema separa por
    // tono, no por bordes de color.
    blockquote: ({ children }) => (
      <blockquote className="my-8 rounded-card bg-brand-50 px-6 py-5 text-fg [&_p]:my-2">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[0.9em] text-fg">
        {children}
      </code>
    ),
    code_block: ({ children }) => (
      <pre className="my-6 overflow-x-auto rounded-card bg-action p-5 font-mono text-sm leading-relaxed text-white">
        {children}
      </pre>
    ),
    a: ({ href, children, openInNewTab }) => {
      const className =
        "font-medium text-brand-hover underline underline-offset-2 transition-colors hover:text-fg";

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
          {...(openInNewTab === false ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        >
          {children}
        </a>
      );
    },
    // El scroll horizontal queda DENTRO del marco: una tabla ancha en mobile
    // no empuja la página de costado.
    table: ({ children }) => (
      <div className="my-8 overflow-x-auto rounded-card border border-card-line">
        <table className="w-full border-collapse text-left text-base">{children}</table>
      </div>
    ),
    table_header_cell: ({ children }) => (
      <th
        scope="col"
        className="border-b border-card-line bg-canvas px-5 py-3 text-label font-semibold text-fg-muted [&_p]:m-0"
      >
        {children}
      </th>
    ),
    table_cell: ({ children }) => (
      <td className="border-b border-card-line px-5 py-4 align-top text-fg [&_p]:m-0 [&_p]:text-base">
        {children}
      </td>
    ),
    Asset: {
      // Cualquier imagen embebida en el cuerpo del post: lazy (no es la LCP).
      // `alt` = `altText` del Asset; sin él, decorativa (`alt=""`).
      image: ({ url, width, height, altText }) => (
        <figure className="my-10">
          <Image
            src={url}
            alt={altText?.trim() ?? ""}
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
  /**
   * `true` cuando el texto vive dentro de una sección que ya tiene su `h2`
   * (ver `nestedHeadings`). Por defecto es el cuerpo de una nota, colgado
   * directo del `h1`.
   */
  readonly nested?: boolean;
  /**
   * Un bloque nuestro intercalado en el cuerpo (el llamado a `/pedido` de la
   * nota), antes del bloque de primer nivel número `index`. Con `index` -1 o
   * fuera de rango va al final.
   */
  readonly insert?: { readonly index: number; readonly node: ReactNode };
};

function topLevelNodes(content: RichTextContent): readonly ElementNode[] {
  return Array.isArray(content) ? content : content.children;
}

/** Rich text de Hygraph (el AST `raw`) renderizado con los tokens del sitio. */
export function RichText({ content, references, nested = false, insert }: RichTextProps) {
  // Un solo juego de renderers para las dos mitades: el contador de los
  // `id` de los `h2` sigue de una a la otra (`section-N` coincide con
  // `extractToc`). React renderiza los hermanos en orden.
  const renderers = buildRenderers(nested);

  if (!insert) {
    return <HygraphRichText content={content} references={references} renderers={renderers} />;
  }

  const nodes = topLevelNodes(content);
  const at = insert.index >= 0 && insert.index < nodes.length ? insert.index : nodes.length;
  const before: RichTextContent = nodes.slice(0, at);
  const after: RichTextContent = nodes.slice(at);

  return (
    <>
      <HygraphRichText content={before} references={references} renderers={renderers} />
      {insert.node}
      {at < nodes.length ? (
        <HygraphRichText content={after} references={references} renderers={renderers} />
      ) : null}
    </>
  );
}
