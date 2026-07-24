import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Pousada Viva Mar",
  description:
    "Reserve sua estadia na Pousada Viva Mar em Saquarema/RJ com vista para o mar, café da manhã panorâmico e booking online.",
  keywords: [
    "pousada saquarema",
    "praia da vila",
    "viva mar",
    "reserva online",
    "hotel saquarema rj",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Pousada Viva Mar",
    description: "Acorde com o oceano à sua frente. Reserve agora.",
    type: "website",
    url: siteUrl,
    locale: "pt_BR",
    siteName: "Pousada Viva Mar",
    images: [{ url: "/vivamarhd.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pousada Viva Mar",
    description: "Acorde com o oceano à sua frente. Reserve agora.",
    images: ["/vivamarhd.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "Pousada Viva Mar",
  description:
    "Pousada em Saquarema/RJ com vista para o mar, café da manhã panorâmico e reserva online.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Av. Min. Salgado Filho, 8484 - Barra Nova",
    addressLocality: "Saquarema",
    addressRegion: "RJ",
    postalCode: "28990-000",
    addressCountry: "BR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -22.931874738769693,
    longitude: -42.576149223932745,
  },
  telephone: "+55 22 99202-7273",
  url: siteUrl,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
