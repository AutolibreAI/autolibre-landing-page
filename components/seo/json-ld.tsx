type JsonLdProps = {
  readonly schema: object;
};

/**
 * Renderiza structured data como `<script type="application/ld+json">`.
 *
 * `JSON.stringify` no sanitiza: un `<` en cualquier string del schema puede
 * cerrar el tag y abrir la puerta a XSS. Lo escapamos a su equivalente
 * unicode, tal como recomienda la documentación de Next.
 */
export function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
