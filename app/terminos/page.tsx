import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones · AutoLibre",
  description: "Términos y condiciones de uso del servicio AutoLibre.",
  robots: { index: true, follow: false },
};

export default function TerminosPage() {
  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.5rem" }}>
      <Link href="/" style={{ fontSize: "0.875rem", color: "var(--al-cyan)" }}>
        ← Volver al inicio
      </Link>

      <h1 style={{ marginTop: "2rem", fontSize: "2rem", fontWeight: 800 }}>
        Términos y Condiciones
      </h1>
      <p style={{ color: "var(--al-text-muted)", marginTop: "0.5rem" }}>
        Última actualización: junio 2026
      </p>

      <section style={{ marginTop: "2rem", lineHeight: 1.7 }}>
        <h2>1. Aceptación</h2>
        <p>
          Al acceder a este sitio web o registrarte en la lista de Early Access de
          AutoLibre, aceptás estos Términos y Condiciones en su totalidad.
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>2. Descripción del servicio</h2>
        <p>
          AutoLibre es una aplicación en desarrollo que permite a los usuarios
          conectar dispositivos OBD-II a sus vehículos para obtener diagnósticos
          asistidos por inteligencia artificial y gestionar trámites automotrices.
          El servicio está actualmente en etapa de Early Access.
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>3. Lista de espera</h2>
        <p>
          Al registrarte en la lista de Early Access, aceptás recibir
          comunicaciones de AutoLibre relacionadas con el lanzamiento del
          producto. Podés darte de baja en cualquier momento escribiendo a{" "}
          <a href="mailto:contact@autolibre.ai" style={{ color: "var(--al-cyan)" }}>
            contact@autolibre.ai
          </a>
          .
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>4. Limitación de responsabilidad</h2>
        <p>
          Los diagnósticos generados por AutoLibre son orientativos y no
          reemplazan la revisión de un mecánico profesional. AutoLibre no se
          responsabiliza por daños derivados de decisiones tomadas con base
          exclusiva en los resultados de la aplicación.
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>5. Propiedad intelectual</h2>
        <p>
          Todo el contenido de este sitio (textos, imágenes, diseño y código) es
          propiedad de AutoLibre. Queda prohibida su reproducción sin
          autorización expresa.
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>6. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar estos términos. Los cambios
          relevantes serán comunicados por email a los usuarios registrados.
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>7. Ley aplicable</h2>
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Ante
          cualquier disputa, las partes se someten a la jurisdicción de los
          tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>8. Contacto</h2>
        <p>
          Para consultas escribí a{" "}
          <a href="mailto:contact@autolibre.ai" style={{ color: "var(--al-cyan)" }}>
            contact@autolibre.ai
          </a>
          .
        </p>
      </section>
    </main>
  );
}
