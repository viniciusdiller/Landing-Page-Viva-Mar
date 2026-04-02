"use client";

import { useEffect, useState } from "react";
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

  // Função auxiliar para formatar moeda
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <section
      id="quartos"
      className="py-16 md:py-24 bg-[#ececec]"
      aria-labelledby="quartos-heading"
    >
      <div className="container-wide">
        <div className="max-w-[90rem] mx-auto px-4 md:px-8">
          {/* Cabeçalho Minimalista */}
          <h2
            id="quartos-heading"
            className="text-center text-[#2f3134] uppercase mb-8 md:mb-12"
            style={{
              fontSize: "clamp(1.25rem, 2vw, 2.1rem)",
              letterSpacing: "0.36em",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
            }}
          >
            CONHEÇA BEM DE PERTO
          </h2>

          {/* Informação de Datas de Busca */}
          {searchParams?.checkIn && searchParams?.checkOut && (
            <p
              className="text-center mb-10 text-[var(--color-text-muted)] tracking-wide"
              style={{ fontSize: "var(--text-sm)" }}
            >
              Disponibilidade consultada para{" "}
              {new Date(searchParams.checkIn).toLocaleDateString("pt-BR")} até{" "}
              {new Date(searchParams.checkOut).toLocaleDateString("pt-BR")}
              {searchParams.guests
                ? `, ${searchParams.guests} hóspede${searchParams.guests > 1 ? "s" : ""}`
                : ""}
            </p>
          )}

          {/* Grade de Quartos Funcional */}
          {loading ? (
            // Skeleton de Carregamento
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="aspect-[4/3] bg-white/60 animate-pulse"
                />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            // Estado Vazio (Sem Quartos)
            <div className="text-center py-20 bg-white/50 border border-white/80">
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
            // Cards Interativos
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
              {rooms.map((room) => (
                <figure
                  key={room.id}
                  className="group relative overflow-hidden bg-slate-900 cursor-pointer"
                  onClick={() =>
                    onBook(
                      room,
                      nights || 1,
                      searchParams?.checkIn ?? "",
                      searchParams?.checkOut ?? "",
                      searchParams?.guests ?? 1,
                    )
                  }
                >
                  {/* Imagem de Fundo */}
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full aspect-[4/3] object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-60"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        `https://picsum.photos/seed/${room.id}/900/675`;
                    }}
                  />

                  {/* Gradiente sutil permanente na base para o texto ficar sempre legível */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />

                  {/* Gradiente extra que escurece a imagem toda no hover */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Conteúdo do Card */}
                  <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end">
                    {/* Essa div principal empurra os itens 48 pixels pra baixo. No hover, ela sobe para a posição 0. */}
                    <div className="translate-y-[48px] group-hover:translate-y-0 transition-transform duration-500 ease-out flex flex-col">
                      {/* Nome e Preço (SEMPRE VISÍVEIS) */}
                      <h3
                        className="text-white text-lg md:text-xl font-semibold mb-1 drop-shadow-md"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {room.name}
                      </h3>
                      <p className="text-white/90 text-sm drop-shadow-md mb-4 font-medium">
                        {formatMoney(room.pricePerNight)}{" "}
                        <span className="text-white/60 text-xs font-normal">
                          / noite
                        </span>
                      </p>

                      {/* Elementos que aparecem apenas no hover (Botão e Capacidade) */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-between">
                        <span className="text-white/80 text-xs tracking-widest uppercase">
                          {room.capacity} hóspedes
                        </span>

                        <button
                          className="px-5 py-2.5 bg-white text-black font-semibold text-[10px] sm:text-xs tracking-[0.2em] uppercase transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBook(
                              room,
                              nights || 1,
                              searchParams?.checkIn ?? "",
                              searchParams?.checkOut ?? "",
                              searchParams?.guests ?? 1,
                            );
                          }}
                        >
                          Reservar
                        </button>
                      </div>
                    </div>
                  </div>
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
