import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { siteConfig } from "@/lib/seo/config";
import "./globals.css";

/**
 * Fuentes autohospedadas por next/font: cero requests a Google, cero
 * render-blocking y cero CLS. Ambas son variable fonts, así que un solo
 * archivo cubre todos los pesos.
 */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  /** Resuelve a absolutas todas las URLs relativas de canonical y OG. */
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    /** Las páginas internas sólo declaran su nombre; el sufijo lo pone acá. */
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.legalName, url: siteConfig.url }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  applicationName: siteConfig.name,
  category: "automotive",
  formatDetection: { telephone: false },
  // Los íconos los aportan `app/favicon.ico`, `app/icon.png` y
  // `app/apple-icon.png` por convención de archivo: Next los hashea y genera
  // los <link> solo. Declararlos acá además los duplicaría.
  manifest: "/manifest.webmanifest",
  /**
   * Token de Google Search Console. Sin la propiedad verificada no hay forma
   * de pedir reindexado ni de ver por qué Google no muestra el favicon, así
   * que el meta va en el layout — tiene que estar en el home, que es la URL
   * que se verifica. Sale de env para no versionar el token.
   */
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#2a8c3a",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh bg-surface text-ink">{children}</body>
    </html>
  );
}
