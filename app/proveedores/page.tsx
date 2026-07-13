import type { Metadata } from "next";
import Link from "next/link";
import ProviderForm from "@/components/landing/provider-form";

export const metadata: Metadata = {
  title: "Sumá tu taller · AutoLibre",
  description:
    "Registrá tu taller en AutoLibre y empezá a recibir solicitudes de clientes verificados cerca tuyo.",
  robots: { index: true, follow: true },
};

export default function ProveedoresPage() {
  return (
    <main className="al-provider-page">
      <Link href="/" className="al-provider-page-back">
        ← Volver al inicio
      </Link>

      <div className="al-provider-page-card">
        <ProviderForm />
      </div>
    </main>
  );
}
