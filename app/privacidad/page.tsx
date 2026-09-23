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
          Recolectamos datos personales solo cuando completás alguno de los
          formularios de este sitio. Cada uno pide lo siguiente:
        </p>
        <p>
          <strong>Pedido de presupuesto.</strong> La patente de tu auto, tu
          número de WhatsApp, tu zona o localidad, tu correo electrónico (es
          opcional), la descripción de lo que necesita el auto y tu
          consentimiento para compartir el pedido. Si elegís tu zona de la
          lista de sugerencias, también guardamos sus coordenadas, localidad y
          provincia. Con la patente consultamos la marca, el modelo, el año y la
          localidad y provincia de radicación que figuran en el registro del
          vehículo; si confirmás que es tu auto, esos datos quedan guardados con
          el pedido. Tu zona la usamos para elegir los talleres de nuestra red
          que trabajan cerca tuyo. A esos talleres les pasamos solo los datos de
          tu auto y la descripción del problema; nosotros recibimos sus
          respuestas y te las enviamos por WhatsApp.
        </p>
        <p>
          <strong>Registro de talleres.</strong> El nombre del taller, el
          WhatsApp de contacto, el correo electrónico, la dirección del local
          (y, si la elegís de la lista de sugerencias, sus coordenadas,
          localidad y provincia), los horarios, la modalidad de atención (en el
          local, a domicilio o ambas), las marcas, los servicios, los tipos de
          vehículo y de combustible con los que trabaja, y cómo nos conociste.
          Los usamos para evaluar la solicitud, contactarte para activar el
          perfil del taller en la app y hacerle llegar consultas de su zona y su
          rubro.
        </p>
        <p>
          <strong>Soporte.</strong> Tu nombre, tu correo electrónico o tu
          teléfono (al menos uno de los dos), el motivo de la consulta y tu
          mensaje. Los usamos para responderte.
        </p>
        <p>
          <strong>Eliminación de cuenta.</strong> El correo electrónico de tu
          cuenta de AutoLibre y, si querés, el motivo. Los usamos para procesar
          la baja, que hace a mano una persona de nuestro equipo.
        </p>
        <p>
          Además, al navegar el sitio se registran datos técnicos para medir
          nuestros anuncios y, cuando enviás un pedido de presupuesto, tu
          WhatsApp se comparte con Meta cifrado de forma irreversible (ver el
          punto 7).
        </p>

        <h2>3. Finalidad del tratamiento</h2>
        <p>
          Los datos se usan para: (a) gestionar tu pedido de presupuesto,
          compartir los datos de tu auto y la descripción del problema con
          talleres de nuestra red y hacerte llegar sus respuestas,
          (b) evaluar y activar las solicitudes de talleres, (c) responder
          consultas de soporte y procesar pedidos de eliminación de cuenta, y
          (d) medir la efectividad de nuestros anuncios.
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
          Los pedidos de presupuesto y los registros de talleres se guardan en
          los sistemas propios de AutoLibre. Además, algunos datos pasan por
          estos terceros:
        </p>
        <p>
          <strong>Vercel.</strong> Aloja y sirve este sitio. Para mostrártelo,
          procesa datos técnicos de tu visita, como tu dirección IP y la
          información de tu navegador.
        </p>
        <p>
          <strong>Talleres de la red de AutoLibre.</strong> Reciben solo los
          datos de tu auto y la descripción del problema de tu pedido de
          presupuesto. No reciben tu WhatsApp, tu correo electrónico ni tu zona:
          AutoLibre hace de intermediario y te acerca sus respuestas por
          WhatsApp.
        </p>
        <p>
          <strong>clasific.ar.</strong> Cuando buscás tu auto, le consultamos
          desde nuestro servidor solo la patente para obtener la marca, el
          modelo, el año y la radicación del vehículo.
        </p>
        <p>
          <strong>Google Maps Platform (Google).</strong> El buscador de zonas y
          direcciones de los formularios de presupuesto y de talleres usa Google
          Places. Lo que escribís en ese campo, junto con datos técnicos de tu
          navegador como tu dirección IP, llega a Google para sugerirte
          ubicaciones.
        </p>
        <p>
          <strong>Resend.</strong> Los mensajes de soporte y los pedidos de
          eliminación de cuenta nos llegan por correo electrónico a través de
          Resend.
        </p>
        <p>
          <strong>Meta.</strong> Para medir nuestros anuncios recibe datos
          técnicos de tu visita y, cuando enviás un pedido de presupuesto, tu
          WhatsApp cifrado de forma irreversible (hash), según se detalla en
          el punto 7.
        </p>
        <p>
          Algunos de estos proveedores (Vercel, Google, Resend y Meta, ver el
          punto 7) pueden tratar datos fuera de Argentina, lo que puede implicar
          una transferencia internacional de datos.
        </p>
        <p>No vendemos ni cedemos tus datos a terceros con fines comerciales.</p>

        <h2>7. Medición de anuncios con Meta</h2>
        <p>
          Este sitio usa el <strong>Píxel de Meta</strong> y la{" "}
          <strong>API de Conversiones de Meta</strong> (Meta Platforms, Inc.)
          para medir la efectividad de nuestros anuncios.
        </p>
        <p>
          Registramos cuatro acciones: las visitas a las páginas del sitio, el
          clic en el botón de contacto por WhatsApp, el inicio de un pedido de
          presupuesto (cuando completás el primer paso) y el envío de ese
          pedido.
        </p>
        <p>
          Para eso se usan datos técnicos: tu dirección IP, información de tu
          navegador y dispositivo (el &ldquo;user agent&rdquo;) y las cookies
          propias de Meta (<code>_fbp</code> y <code>_fbc</code>).
        </p>
        <p>
          Cuando enviás un pedido de presupuesto, además le mandamos a Meta tu
          número de WhatsApp <strong>cifrado de forma irreversible (hash)</strong>:
          Meta no recibe el número en sí, solo un código que le permite asociar
          el envío del pedido con una cuenta suya, si la tenés. La patente, la
          zona, el correo electrónico y la descripción que cargás en el
          formulario de presupuesto <strong>no se envían a Meta</strong>.
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
