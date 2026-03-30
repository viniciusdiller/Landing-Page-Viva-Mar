'use client';

import SearchWidget from './SearchWidget';
import type { RoomSearchParams } from '@/types';

interface HeroProps {
  onSearch: (params: RoomSearchParams) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
      aria-label="Apresentação da Pousada Viva Mar"
    >
      {/* Background foto */}
      <div className="absolute inset-0">
        <img
          src="https://picsum.photos/seed/ocean-beach-resort/1600/900"
          alt="Vista do oceano Atlântico da Pousada Viva Mar"
          width={1600}
          height={900}
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
        {/* Gradient overlay — escurece o fundo para legibilidade */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, oklch(0.12 0.04 220 / 0.55) 0%, oklch(0.12 0.04 220 / 0.30) 40%, oklch(0.08 0.04 220 / 0.70) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="container-wide relative z-10 flex flex-col items-center text-center pt-24 pb-8">
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full"
          style={{
            background: 'oklch(1 0 0 / 0.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid oklch(1 0 0 / 0.2)',
          }}
        >
          <span
            className="text-white/90"
            style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            Florianópolis, SC — Frente para o Mar
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-white mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 7vw, 6rem)',
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            maxWidth: '15ch',
          }}
        >
          Acorde com o oceano
          <em className="block italic" style={{ color: 'var(--color-accent)' }}>
            à sua frente
          </em>
        </h1>

        {/* Subheadline */}
        <p
          className="text-white/80 mb-10"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            maxWidth: '48ch',
            lineHeight: 1.6,
          }}
        >
          Suítes e chalês com vista para o Atlântico, café da manhã artesanal
          e acesso direto à praia. Disponibilidade em tempo real.
        </p>

        {/* Search Widget */}
        <div className="w-full max-w-3xl">
          <SearchWidget onSearch={onSearch} />
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12">
          {[
            { value: '4.9★', label: '450+ avaliações' },
            { value: '12 anos', label: 'no mercado' },
            { value: '100%', label: 'frente para o mar' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-white"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 600 }}
              >
                {stat.value}
              </div>
              <div className="text-white/60" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.04em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50">
        <div
          className="w-px bg-white/30 animate-pulse"
          style={{ height: '40px' }}
          aria-hidden="true"
        />
        <span style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Explorar
        </span>
      </div>
    </section>
  );
}
