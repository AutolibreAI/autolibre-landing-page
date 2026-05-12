import Image from "next/image";
import Link from "next/link";
import type { LandingBrand } from "@/lib/landing-types";

type LandingNavProps = {
  readonly brand: LandingBrand;
};

export default function LandingNav({ brand }: LandingNavProps) {
  return (
    <div className="al-nav-shell">
      <header className="al-nav">
        <div className="al-nav-brand">
          <span className="al-nav-icon">
            <Image src="/autolibre-favicon.png" alt="" width={18} height={18} />
          </span>
          <strong>{brand.name}</strong>
          <span className="al-nav-badge">{brand.badge}</span>
        </div>
        <nav className="al-nav-links" aria-label="Navegacion principal">
          <Link href="#hero">Inicio</Link>
          <Link href="#problem">Producto</Link>
          <Link href="#form-section">Early Access</Link>
          <Link href="#faqs">FAQs</Link>
          <Link href="#footer">Contacto</Link>
        </nav>
      </header>
    </div>
  );
}
