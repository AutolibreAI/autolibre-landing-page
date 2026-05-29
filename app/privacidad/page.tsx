import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad · AutoLibre",
  description: "Política de privacidad de AutoLibre conforme a la Ley 25.326 de Protección de Datos Personales de Argentina.",
  robots: { index: true, follow: false },
};

export default function PrivacidadPage() {
  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.5rem" }}>
      <Link href="/" style={{ fontSize: "0.875rem", color: "var(--al-cyan)" }}>
        ← Volver al inicio
      </Link>

      <h1 style={{ marginTop: "2rem", fontSize: "2rem", fontWeight: 800 }}>
        Política de Privacidad
      </h1>
      <p style={{ color: "var(--al-text-muted)", marginTop: "0.5rem" }}>
        Última actualización: junio 2026
      </p>

      <section style={{ marginTop: "2rem", lineHeight: 1.7 }}>
        <h2>1. Responsable del tratamiento</h2>
        <p>
          AutoLibre (en adelante "la empresa", "nosotros") es responsable del
          tratamiento de los datos personales recolectados a través de este sitio
          web conforme a la{" "}
          <strong>Ley N.° 25.326 de Protección de Datos Personales</strong> de la
          República Argentina y su decreto reglamentario.
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>2. Datos que recolectamos</h2>
        <p>
          Al registrarte en nuestra lista de Early Access, recolectamos tu{" "}
          <strong>nombre y dirección de correo electrónico</strong>. Estos datos se
          usan exclusivamente para enviarte información sobre el lanzamiento del
          producto.
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>3. Finalidad del tratamiento</h2>
        <p>
          Los datos se usan para: (a) informarte del lanzamiento de AutoLibre,
          (b) enviarte novedades sobre el producto para las que te hayas
          registrado, y (c) mejorar nuestra comunicación.
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>4. Derechos del titular</h2>
        <p>
          Tenés derecho de acceso, rectificación, supresión, confidencialidad y
          oposición sobre tus datos personales. Para ejercerlos, escribí a{" "}
          <a href="mailto:contact@autolibre.ai" style={{ color: "var(--al-cyan)" }}>
            contact@autolibre.ai
          </a>
          .
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>5. Conservación de datos</h2>
        <p>
          Conservamos tus datos mientras sean necesarios para la finalidad
          descrita o hasta que solicites su eliminación.
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>6. Terceros</h2>
        <p>
          Utilizamos Supabase como proveedor de base de datos. No vendemos ni
          cedemos tus datos a terceros con fines comerciales.
        </p>

        <h2 style={{ marginTop: "1.5rem" }}>7. Contacto</h2>
        <p>
          Para cualquier consulta sobre esta política escribí a{" "}
          <a href="mailto:contact@autolibre.ai" style={{ color: "var(--al-cyan)" }}>
            contact@autolibre.ai
          </a>
          .
        </p>
      </section>
    </main>
  );
}
