'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";
import ProviderModal from "@/components/landing/provider-modal";
import type { LandingBrand } from "@/lib/landing-types";

type LandingNavProps = {
  readonly brand: LandingBrand;
};

const NAV_LINKS = [
  { href: "#hero", label: "Inicio" },
  { href: "#problem", label: "Producto" },
  { href: "#form-section", label: "Early Access" },
  { href: "#faqs", label: "FAQs" },
  { href: "#footer", label: "Contacto" },
] as const;

export default function LandingNav({ brand }: LandingNavProps) {
  const { theme, toggleTheme } = useTheme();
  const [providerOpen, setProviderOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  function openProvider() {
    setProviderOpen(true);
    closeMenu();
  }

  return (
    <div className="al-nav-shell">
      <header className="al-nav">
        <div className="al-nav-brand">
          <span className="al-nav-icon">
            <Image src="/logo-verde.jpeg" alt="AutoLibre" width={18} height={18} />
          </span>
          <strong>{brand.name}</strong>
          <span className="al-nav-badge">{brand.badge}</span>
        </div>

        <nav className="al-nav-links" aria-label="Navegacion principal">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>

        <div className="al-nav-actions">
          <button onClick={openProvider} className="al-nav-provider-btn">
            Soy proveedor
          </button>
          <button
            onClick={toggleTheme}
            className="al-theme-toggle"
            aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
            title={`Modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
          >
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <button
            className="al-nav-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="al-mobile-menu"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="al-nav-mobile-backdrop" onClick={closeMenu} aria-hidden="true" />
          <div id="al-mobile-menu" className="al-nav-mobile-menu" role="dialog" aria-label="Menú de navegación">
            <nav className="al-nav-mobile-links" aria-label="Navegación móvil">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} onClick={closeMenu}>{link.label}</Link>
              ))}
            </nav>
            <div className="al-nav-mobile-bottom">
              <button onClick={openProvider} className="al-nav-provider-btn al-nav-mobile-full">
                Soy proveedor
              </button>
            </div>
          </div>
        </>
      )}

      <ProviderModal open={providerOpen} onClose={() => setProviderOpen(false)} />
    </div>
  );
}
