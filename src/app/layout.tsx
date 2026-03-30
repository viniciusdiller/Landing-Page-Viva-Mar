import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pousada Viva Mar — Frente para o Mar em Florianópolis',
  description:
    'Reserve o seu quarto na Pousada Viva Mar e acorde com o som das ondas. Chalés e suítes com vista para o oceano, café da manhã incluso e atendimento personalizado.',
  keywords: ['pousada florianópolis', 'hotel praia', 'viva mar', 'reserva online', 'hospedagem frente mar'],
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
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
