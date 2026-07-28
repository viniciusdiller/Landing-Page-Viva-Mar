"use client";

import { useEffect, useState } from "react";
import { Sun, Waves, Coffee, Wifi, Car } from "lucide-react";
import SearchWidget from "./SearchWidget";
import type { RoomSearchParams } from "@/types";
import { fetchPublicRooms } from "@/lib/api/rooms";

const MAIN_IMAGE = "/vivamarhd.png";
const SLIDE_INTERVAL_MS = 6000;
const MAX_PHOTOS = 8;

const FEATURES = [
  { icon: Sun, title: "Pé na areia", description: "A poucos passos do mar" },
  { icon: Waves, title: "2 piscinas", description: "Adulto e infantil com vista" },
  { icon: Waves, title: "Sauna", description: "Adulta" },
  { icon: Coffee, title: "Café da manhã", description: "Completo e com vista para o mar" },
  { icon: Wifi, title: "Wi-Fi", description: "Internet de alta velocidade" },
  { icon: Car, title: "Estacionamento", description: "Privativo e gratuito" },
];

interface HeroProps {
  onSearch: (params: RoomSearchParams) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchPublicRooms({})
      .then((rooms) => {
        if (cancelled) return;
        const uniquePhotos = Array.from(
          new Set(rooms.flatMap((room) => room.photoUrls).filter(Boolean)),
        ).slice(0, MAX_PHOTOS);
        setPhotos(uniquePhotos);
      })
      .catch(() => {
        if (!cancelled) setPhotos([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (photos.length < 2) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % photos.length);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [photos.length]);

  const backgroundImages = [
    MAIN_IMAGE,
    ...photos.filter((photo) => photo !== MAIN_IMAGE),
  ];

  return (
    <>
      <section
        id="hero"
        className="relative min-h-screen min-h-[100svh] flex items-center overflow-hidden"
        aria-label="Apresentação da Pousada Viva Mar em Saquarema"
      >
        <div className="absolute inset-0">
          {backgroundImages.map((src, index) => (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${
                index === activeIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/22 via-black/8 to-black/38" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(189,154,95,0.16),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent md:to-40%" />
        </div>

        <div className="container-wide relative z-10 pt-24 pb-28 md:pb-16 w-full">
          <div className="max-w-2xl text-white">
            <h1
              className="uppercase"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.3rem,5vw,4rem)",
                lineHeight: 1.1,
                fontWeight: 600,
                letterSpacing: "0.01em",
                textShadow: "0 2px 20px rgba(0,0,0,0.55)",
              }}
            >
              Pé na areia.
              <br />
              Praia, conforto
              <br />e bem-estar.
            </h1>
            <p
              className="mt-5 text-white/90 max-w-md"
              style={{ fontSize: "var(--text-base)", textShadow: "0 1px 12px rgba(0,0,0,0.55)" }}
            >
              Desfrute de momentos inesquecíveis com uma vista incrível.
            </p>

            <a
              href="#quartos"
              className="mt-8 inline-flex h-12 px-8 items-center justify-center rounded-sm text-white font-semibold uppercase tracking-[0.14em] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
              style={{ fontSize: "var(--text-xs)" }}
            >
              Fazer reserva
            </a>
          </div>
        </div>
      </section>

      <div className="relative bg-[var(--color-secondary)]">
        <div className="container-wide relative z-10 -translate-y-14 md:-translate-y-16">
          <div className="max-w-[1440px] w-full mx-auto">
            <SearchWidget onSearch={onSearch} />
          </div>
        </div>

        <div className="container-wide pb-10 md:pb-14 -mt-6 md:-mt-8">
          <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-white/15 border border-white/15">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center gap-2 px-4 py-8"
              >
                <Icon
                  size={26}
                  strokeWidth={1.3}
                  className="text-white/90"
                  aria-hidden="true"
                />
                <p
                  className="text-white uppercase"
                  style={{ fontSize: "var(--text-sm)", fontWeight: 600, letterSpacing: "0.06em" }}
                >
                  {title}
                </p>
                <p className="text-white/70" style={{ fontSize: "var(--text-xs)" }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
