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
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2100&q=80"
          alt="Mesa de restaurante sofisticado com pratos e ambientação premium"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/58" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(25,63,221,0.22),transparent_50%)]" />
      </div>

      <div className="container-wide relative z-10 pt-28 md:pt-36 pb-24 md:pb-12 w-full">
        <div className="max-w-5xl mx-auto text-white mb-12 text-center">
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.2rem,5.2vw,4.6rem)",
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: "0.01em",
            }}
          >
            VIVA MAR
          </h1>
          <p
            className="mt-5 text-white/90 max-w-3xl mx-auto"
            style={{ fontSize: "var(--text-base)" }}
          >
            Conheça nossos quartos e reserve sua estadia na Pousada Viva Mar, o
            refúgio perfeito para relaxar e aproveitar o melhor de Saquarema.
          </p>

          <a
            href="#quartos"
            className="mt-7 inline-flex h-12 px-8 items-center justify-center text-white font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            FAÇA SUA RESERVA
          </a>
        </div>

        <div className="max-w-[1440px] w-full mx-auto md:translate-y-14">
          <SearchWidget onSearch={onSearch} />
        </div>
      </div>
    </section>
  );
}
