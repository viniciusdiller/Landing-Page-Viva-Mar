"use client";

import SearchWidget from "./SearchWidget";
import type { RoomSearchParams } from "@/types";

interface HeroProps {
  onSearch: (params: RoomSearchParams) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-screen min-h-[100svh] flex items-center overflow-hidden"
      aria-label="Apresentação da Pousada Viva Mar em Saquarema"
    >
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80"
          alt="Praia da Vila em Saquarema com vista para o mar"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/28 to-black/58" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(25,63,221,0.16),transparent_45%)]" />
      </div>

      <div className="container-wide relative z-10 pt-24 pb-10 md:pb-14 w-full">
        <div className="max-w-3xl text-white mb-8">
          <p className="inline-flex px-3 py-1 rounded-full text-xs uppercase tracking-[0.12em] font-semibold bg-white/15 border border-white/30 mb-5">
            Em frente à Praia da Vila • Saquarema - RJ
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem,6vw,4.8rem)",
              lineHeight: 1.05,
              fontWeight: 700,
            }}
          >
            Tranquilidade, natureza e mar
            <span className="block text-[var(--color-accent)]">
              na melhor vista de Saquarema
            </span>
          </h1>
          <p
            className="mt-5 text-white/85 max-w-2xl"
            style={{ fontSize: "var(--text-base)" }}
          >
            Reserve sua estadia com café da manhã no terraço panorâmico, piscina
            com cascata e bar pé na areia.
          </p>
        </div>

        <div className="max-w-6xl w-full">
          <SearchWidget onSearch={onSearch} />
        </div>
      </div>
    </section>
  );
}
