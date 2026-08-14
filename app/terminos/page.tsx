import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { createMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createMetadata({
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso del servicio AutoLibre.",
  path: "/terminos",
});

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y Condiciones" updatedAt="junio 2026">
      <h2>1. Aceptación</h2>
      <p>
        Al acceder a este sitio web o registrarte en la lista de Early Access de
        AutoLibre, aceptás estos Términos y Condiciones en su totalidad.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        AutoLibre es una aplicación en desarrollo que permite a los usuarios
        conectar dispositivos OBD-II a sus vehículos para obtener diagnósticos
        asistidos por inteligencia artificial y gestionar trámites automotrices.
        El servicio está actualmente en etapa de Early Access.
      </p>

      <h2>3. Lista de espera</h2>
      <p>
        Al registrarte en la lista de Early Access, aceptás recibir
        comunicaciones de AutoLibre relacionadas con el lanzamiento del producto.
        Podés darte de baja en cualquier momento escribiendo a{" "}
        <a href="mailto:contact@autolibre.ai">contact@autolibre.ai</a>.
      </p>

      <h2>4. Limitación de responsabilidad</h2>
      <p>
        Los diagnósticos generados por AutoLibre son orientativos y no reemplazan
        la revisión de un mecánico profesional. AutoLibre no se responsabiliza
        por daños derivados de decisiones tomadas con base exclusiva en los
        resultados de la aplicación.
      </p>

      <h2>5. Propiedad intelectual</h2>
      <p>
        Todo el contenido de este sitio (textos, imágenes, diseño y código) es
        propiedad de AutoLibre. Queda prohibida su reproducción sin autorización
        expresa.
      </p>

      <h2>6. Modificaciones</h2>
      <p>
        Nos reservamos el derecho de modificar estos términos. Los cambios
        relevantes serán comunicados por email a los usuarios registrados.
      </p>

      <h2>7. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina. Ante
        cualquier disputa, las partes se someten a la jurisdicción de los
        tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
      </p>

      <h2>8. Contacto</h2>
      <p>
        Para consultas escribí a{" "}
        <a href="mailto:contact@autolibre.ai">contact@autolibre.ai</a>.
      </p>
    </LegalPage>
  );
}
