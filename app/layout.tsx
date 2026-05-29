import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
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
  title: "AutoLibre · Diagnóstico OBD2 con IA para tu auto",
  description:
    "Traducí fallos OBD2 a lenguaje simple con IA. Gestioná VTV, seguros y mantenimiento preventivo en Argentina. Registrate para el Early Access de AutoLibre.",
  keywords: [
    "diagnóstico vehicular IA",
    "escáner OBD2 Argentina",
    "mantenimiento preventivo flotas",
    "traductor códigos DTC",
    "inspección pre-compra digital",
    "gestión de VTV y multas",
    "telemetría automotriz",
  ],
  authors: [{ name: "AutoLibre" }],
  alternates: {
    canonical: "https://autolibre.ai",
  },
  openGraph: {
    title: "AutoLibre · Tu auto siempre supo qué tenía. Ahora vos también.",
    description:
      "La app que traduce los datos OBD-II de tu auto a lenguaje simple. Diagnóstico inteligente, gestión de VTV, seguro y mantenimiento en Argentina.",
    url: "https://autolibre.ai",
    siteName: "AutoLibre",
    images: [
      {
        url: "/landing/mockup_3_documentos.png",
        width: 1270,
        height: 952,
        alt: "AutoLibre app — diagnóstico OBD2 e historial de vehículo",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoLibre · Diagnóstico OBD2 con IA para tu auto",
    description:
      "Dejá de adivinar qué le pasa a tu auto. Diagnóstico inteligente y gestión de trámites en un solo lugar.",
    images: ["/landing/mockup_3_documentos.png"],
  },
  icons: {
    icon: "/autolibre-favicon.png",
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
      lang="es"
      className={`${geistSans.className} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('al-theme')||'dark';if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
