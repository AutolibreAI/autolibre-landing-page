import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { PedidoClient } from "@/app/pedido/pedido-client";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { meta } = presupuestoContent.page;

const TITLE = meta.title;
const DESCRIPTION = meta.description;
const PATH = "/pedido";

/**
 * Se indexa: es la landing que se comparte por WhatsApp y la que tiene que
 * aparecer cuando alguien busca "presupuesto para mi auto". El `title` no
 * repite la marca, de eso se encarga el template del layout raíz.
 */
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
    { name: "Pedir presupuesto", path: PATH },
  ]),
);

/**
 * A diferencia del resto del sitio, esta página NO usa `PageShell`: no lleva
 * header con navegación ni footer. Quien llega acá viene de un link directo y
 * tiene una sola cosa para hacer; cualquier salida que no sea el formulario
 * es una fuga. El único link fuera de la página es el logo, que vuelve al
 * inicio.
 */
export default function PedidoPage() {
  return (
    <>
      <PedidoClient />
      <JsonLd schema={schema} />
    </>
  );
}
