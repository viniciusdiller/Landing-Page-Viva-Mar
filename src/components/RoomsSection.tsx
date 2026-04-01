"use client";

import { useEffect, useMemo, useState } from "react";
import RoomCard from "./RoomCard";
import { fetchRooms } from "@/lib/mock-rooms";
import { calcNights } from "@/lib/booking";
import type { RoomSearchParams, RoomType } from "@/types";

interface RoomsSectionProps {
  searchParams?: RoomSearchParams;
  onBook: (
    room: RoomType,
    nights: number,
    checkIn: string,
    checkOut: string,
    guests: number,
  ) => void;
}

interface GalleryImage {
  src: string;
  alt: string;
}

const FALLBACK_IMAGES: GalleryImage[] = [
  {
    src: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    alt: "Piscina com vista panoramica",
  },
  {
    src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    alt: "Quarto premium com cama de casal",
  },
  {
    src: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
    alt: "Suite com janela ampla",
  },
  {
    src: "https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=1200&q=80",
    alt: "Banheiro de suite com banheira",
  },
  {
    src: "https://images.unsplash.com/photo-1616594039964-3f6d7d9b4e46?auto=format&fit=crop&w=1200&q=80",
    alt: "Quarto claro com decoracao minimalista",
  },
  {
    src: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=80",
    alt: "Academia com equipamentos",
  },
  {
    src: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=80",
    alt: "Prato de gastronomia autoral",
  },
  {
    src: "https://images.unsplash.com/photo-1470218091926-22a08a325802?auto=format&fit=crop&w=1200&q=80",
    alt: "Orla urbana proxima ao hotel",
  },
];

export default function RoomsSection({
  searchParams,
  onBook,
}: RoomsSectionProps) {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  const nights = calcNights(
    searchParams?.checkIn ?? "",
    searchParams?.checkOut ?? "",
  );

  useEffect(() => {
    setLoading(true);
    fetchRooms({
      checkIn: searchParams?.checkIn,
      checkOut: searchParams?.checkOut,
      guests: searchParams?.guests,
    })
      .then(setRooms)
      .finally(() => setLoading(false));
  }, [searchParams?.checkIn, searchParams?.checkOut, searchParams?.guests]);

  const galleryImages = useMemo(() => {
    const fromRooms: GalleryImage[] = rooms
      .flatMap((room) =>
        room.images.map((src, idx) => ({
          src,
          alt: `${room.name} - foto ${idx + 1}`,
        })),
      )
      .slice(0, 8);

    if (fromRooms.length >= 8) return fromRooms;

    return [...fromRooms, ...FALLBACK_IMAGES].slice(0, 8);
  }, [rooms]);

  return (
    <section id="quartos" className="py-16 md:py-24 bg-[#ececec]" aria-labelledby="quartos-heading">
      <div className="container-wide">
        <div className="max-w-5xl mx-auto">
          <h2
            id="quartos-heading"
            className="text-center text-[#2f3134] uppercase mb-12 md:mb-16"
            style={{
              fontSize: "clamp(1.25rem, 2vw, 2.1rem)",
              letterSpacing: "0.36em",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
            }}
          >
            CONHECA BEM DE PERTO
          </h2>

          {searchParams?.checkIn && searchParams?.checkOut && (
            <p
              className="text-center mb-8 text-[var(--color-text-muted)]"
              style={{ fontSize: "var(--text-sm)" }}
            >
              Disponibilidade consultada para {new Date(searchParams.checkIn).toLocaleDateString("pt-BR")} ate {" "}
              {new Date(searchParams.checkOut).toLocaleDateString("pt-BR")}
              {searchParams.guests ? `, ${searchParams.guests} hospede${searchParams.guests > 1 ? "s" : ""}` : ""}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="aspect-[4/3] bg-white/60 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {galleryImages.map((image, index) => (
                <figure
                  key={`${image.src}-${index}`}
                  className="group relative overflow-hidden bg-white"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/acomodacao-${index}/900/675`;
                    }}
                  />
                </figure>
              ))}
            </div>
          )}

          <div className="mt-12 md:mt-16">
            <h3
              className="text-[var(--color-text)] mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xl)",
                fontWeight: 600,
              }}
            >
              Quartos e valores
            </h3>

            <p
              className="text-[var(--color-text-muted)] mb-6"
              style={{ fontSize: "var(--text-sm)" }}
            >
              Valores e disponibilidade com base no mock atual de quartos.
            </p>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={`card-skeleton-${i}`}
                    className="rounded-xl overflow-hidden"
                    style={{ background: "var(--color-surface)" }}
                  >
                    <div
                      className="animate-pulse"
                      style={{
                        aspectRatio: "4/3",
                        background:
                          "linear-gradient(90deg, var(--color-surface-offset) 25%, var(--color-surface-dynamic, #e6e4df) 50%, var(--color-surface-offset) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s ease-in-out infinite",
                      }}
                    />
                    <div className="p-5 space-y-3">
                      <div
                        className="h-5 rounded"
                        style={{
                          background: "var(--color-surface-offset)",
                          width: "70%",
                        }}
                      />
                      <div
                        className="h-4 rounded"
                        style={{
                          background: "var(--color-surface-offset)",
                          width: "100%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12">
                <p
                  className="text-[var(--color-text-muted)] mb-2"
                  style={{ fontSize: "var(--text-base)" }}
                >
                  Nenhum quarto disponível para os critérios selecionados.
                </p>
                <p
                  className="text-[var(--color-text-faint)]"
                  style={{ fontSize: "var(--text-sm)" }}
                >
                  Tente alterar as datas ou o número de hóspedes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    checkIn={searchParams?.checkIn}
                    checkOut={searchParams?.checkOut}
                    guests={searchParams?.guests}
                    nights={nights || 1}
                    onBook={(r) =>
                      onBook(
                        r,
                        nights || 1,
                        searchParams?.checkIn ?? "",
                        searchParams?.checkOut ?? "",
                        searchParams?.guests ?? 1,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </section>
  );
}
