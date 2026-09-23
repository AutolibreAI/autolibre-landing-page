import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { JsonLd } from "@/components/seo/json-ld";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const TITLE = "Política de Privacidad";
const DESCRIPTION =
  "Política de privacidad de AutoLibre conforme a la Ley 25.326 de Protección de Datos Personales de Argentina.";
const PATH = "/privacidad";

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
    { name: "Privacidad", path: PATH },
  ]),
);

export default function PrivacidadPage() {
  return (
    <>
      <LegalPage title={TITLE} updatedAt="septiembre 2026">
        <h2>1. Responsable del tratamiento</h2>
        <p>
          AutoLibre (en adelante &ldquo;la empresa&rdquo;,
          &ldquo;nosotros&rdquo;) es responsable del tratamiento de los datos
          personales recolectados a través de este sitio web conforme a la{" "}
          <strong>Ley N.° 25.326 de Protección de Datos Personales</strong> de
          la República Argentina y su decreto reglamentario.
        </p>

        <h2>2. Datos que recolectamos</h2>
        <p>
          Al registrarte en nuestra lista de Early Access, recolectamos tu{" "}
          <strong>nombre y dirección de correo electrónico</strong>. Estos datos
          se usan exclusivamente para enviarte información sobre el lanzamiento
          del producto.
        </p>

        <h2>3. Finalidad del tratamiento</h2>
        <p>
          Los datos se usan para: (a) informarte del lanzamiento de AutoLibre,
          (b) enviarte novedades sobre el producto para las que te hayas
          registrado, y (c) mejorar nuestra comunicación.
        </p>

        <h2>4. Derechos del titular</h2>
        <p>
          Tenés derecho de acceso, rectificación, supresión, confidencialidad y
          oposición sobre tus datos personales. Para ejercerlos, escribí a{" "}
          <a href="mailto:contact@autolibre.ai">contact@autolibre.ai</a>.
        </p>

        <h2>5. Conservación de datos</h2>
        <p>
          Conservamos tus datos mientras sean necesarios para la finalidad
          descrita o hasta que solicites su eliminación.
        </p>

        <h2>6. Terceros</h2>
        <p>
          Utilizamos Supabase como proveedor de base de datos. No vendemos ni
          cedemos tus datos a terceros con fines comerciales.
        </p>

        <h2>7. Medición de anuncios con Meta</h2>
        <p>
          Este sitio usa el <strong>Píxel de Meta</strong> y la{" "}
          <strong>API de Conversiones de Meta</strong> (Meta Platforms, Inc.)
          para medir la efectividad de nuestros anuncios.
        </p>
        <p>
          Registramos tres acciones: las visitas a las páginas del sitio, el
          clic en el botón de contacto por WhatsApp y el envío de un pedido de
          presupuesto.
        </p>
        <p>
          Para eso se usan datos técnicos: tu dirección IP, información de tu
          navegador y dispositivo (el &ldquo;user agent&rdquo;) y las cookies
          propias de Meta (<code>_fbp</code> y <code>_fbc</code>). El nombre, el
          correo electrónico, el teléfono y los datos del vehículo que cargás en
          el formulario de presupuesto <strong>no se envían a Meta</strong>.
        </p>
        <p>
          Meta puede tratar estos datos según su propia{" "}
          <a
            href="https://www.facebook.com/privacy/policy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Política de privacidad
          </a>
          , lo que puede implicar una transferencia internacional de datos.
        </p>
        <p>
          Si no querés que se haga esta medición, podés bloquear o borrar las
          cookies desde la configuración de tu navegador y ajustar tus{" "}
          <a
            href="https://www.facebook.com/adpreferences"
            target="_blank"
            rel="noopener noreferrer"
          >
            preferencias de anuncios en Meta
          </a>
          . También podés ejercer los derechos que te da la Ley 25.326 (ver el
          punto 4) escribiendo a{" "}
          <a href="mailto:contact@autolibre.ai">contact@autolibre.ai</a>.
        </p>

        <h2>8. Contacto</h2>
        <p>
          Para cualquier consulta sobre esta política escribí a{" "}
          <a href="mailto:contact@autolibre.ai">contact@autolibre.ai</a>.
        </p>
      </LegalPage>
      <JsonLd schema={schema} />
    </>
  );
}
