import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { createMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createMetadata({
  title: "Política de Privacidad",
  description:
    "Política de privacidad de AutoLibre conforme a la Ley 25.326 de Protección de Datos Personales de Argentina.",
  path: "/privacidad",
});

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de Privacidad" updatedAt="junio 2026">
      <h2>1. Responsable del tratamiento</h2>
      <p>
        AutoLibre (en adelante &ldquo;la empresa&rdquo;, &ldquo;nosotros&rdquo;)
        es responsable del tratamiento de los datos personales recolectados a
        través de este sitio web conforme a la{" "}
        <strong>Ley N.° 25.326 de Protección de Datos Personales</strong> de la
        República Argentina y su decreto reglamentario.
      </p>

      <h2>2. Datos que recolectamos</h2>
      <p>
        Al registrarte en nuestra lista de Early Access, recolectamos tu{" "}
        <strong>nombre y dirección de correo electrónico</strong>. Estos datos se
        usan exclusivamente para enviarte información sobre el lanzamiento del
        producto.
      </p>

      <h2>3. Finalidad del tratamiento</h2>
      <p>
        Los datos se usan para: (a) informarte del lanzamiento de AutoLibre, (b)
        enviarte novedades sobre el producto para las que te hayas registrado, y
        (c) mejorar nuestra comunicación.
      </p>

      <h2>4. Derechos del titular</h2>
      <p>
        Tenés derecho de acceso, rectificación, supresión, confidencialidad y
        oposición sobre tus datos personales. Para ejercerlos, escribí a{" "}
        <a href="mailto:contact@autolibre.ai">contact@autolibre.ai</a>.
      </p>

      <h2>5. Conservación de datos</h2>
      <p>
        Conservamos tus datos mientras sean necesarios para la finalidad descrita
        o hasta que solicites su eliminación.
      </p>

      <h2>6. Terceros</h2>
      <p>
        Utilizamos Supabase como proveedor de base de datos. No vendemos ni
        cedemos tus datos a terceros con fines comerciales.
      </p>

      <h2>7. Contacto</h2>
      <p>
        Para cualquier consulta sobre esta política escribí a{" "}
        <a href="mailto:contact@autolibre.ai">contact@autolibre.ai</a>.
      </p>
    </LegalPage>
  );
}
