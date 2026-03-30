import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pousada Viva Mar — Praia da Vila em Saquarema',
  description:
    'Reserve sua estadia na Pousada Viva Mar em Saquarema/RJ com vista para o mar, café da manhã panorâmico e booking online.',
  keywords: ['pousada saquarema', 'praia da vila', 'viva mar', 'reserva online', 'hotel saquarema rj'],
  openGraph: {
    title: 'Pousada Viva Mar',
    description: 'Acorde com o oceano à sua frente. Reserve agora.',
    type: 'website',
  },
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
