import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoLibreAI | Diagnóstico Vehicular con IA y Gestión Automotriz",
  description:
    "Traducí fallos OBD2 a lenguaje simple con IA. Gestioná VTV, seguros y mantenimiento preventivo en Argentina. Registrate para el Early Access de AutoLibreAI.",
  keywords: [
    "diagnóstico vehicular IA",
    "escáner OBD2 Argentina",
    "mantenimiento preventivo flotas",
    "traductor códigos DTC",
    "inspección pre-compra digital",
    "gestión de VTV y multas",
    "telemetría automotriz",
  ],
  authors: [{ name: "AutoLibreAI Team" }],
  openGraph: {
    title: "AutoLibreAI - Tu auto siempre supo qué tenía. Ahora vos también.",
    description:
      "La plataforma que elimina el estrés del mantenimiento vehicular mediante inteligencia artificial y diagnóstico remoto.",
    url: "https://autolibre.ai", // Reemplazar con tu dominio real
    siteName: "AutoLibreAI",
    images: [
      {
        url: "/autolibre-favicon.png", // Asegurate de tener una imagen atractiva aquí
        width: 1200,
        height: 630,
        alt: "Preview de la App AutoLibreAI",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoLibreAI | Inteligencia Automotriz en tu bolsillo",
    description:
      "Dejá de adivinar qué le pasa a tu auto. Diagnóstico inteligente y gestión de trámites en un solo lugar.",
    images: ["/autolibre-favicon.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.className} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/*  */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
