"use client";

import { useEffect, useState } from "react";
import SearchWidget from "./SearchWidget";
import type { RoomSearchParams } from "@/types";
import { fetchPublicRooms } from "@/lib/api/rooms";

const MAIN_IMAGE = "/vivamar.png";
const SLIDE_INTERVAL_MS = 6000;
const MAX_PHOTOS = 8;

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
