"use client";

import { useEffect, useState } from "react";
import { fetchPublicRooms } from "@/lib/api/rooms";
import type { RoomSearchParams, RoomType } from "@/types";
import RoomCard from "./RoomCard";

interface RoomListProps {
  searchParams?: RoomSearchParams;
}

function buildRoomDetailHref(room: RoomType, searchParams?: RoomSearchParams) {
  const query = new URLSearchParams();
  if (searchParams?.checkIn) query.set("checkIn", searchParams.checkIn);
  if (searchParams?.checkOut) query.set("checkOut", searchParams.checkOut);
  if (searchParams?.guests) query.set("guests", String(searchParams.guests));

  const queryString = query.toString();
  return `/quartos/${encodeURIComponent(room.id)}${queryString ? `?${queryString}` : ""}`;
}

export default function RoomList({ searchParams }: RoomListProps) {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRooms() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchPublicRooms({
          checkIn: searchParams?.checkIn,
          checkOut: searchParams?.checkOut,
        });

        if (!cancelled) {
          setRooms(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setRooms([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nao foi possivel carregar os quartos no momento.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRooms();

    return () => {
      cancelled = true;
    };
  }, [searchParams?.checkIn, searchParams?.checkOut]);

  return (
    <>
      {searchParams?.checkIn && searchParams?.checkOut && (
        <p
          className="mb-10 text-center tracking-wide text-[var(--color-text-muted)]"
          style={{ fontSize: "var(--text-sm)" }}
        >
          Disponibilidade consultada para {" "}
          {new Date(searchParams.checkIn).toLocaleDateString("pt-BR")} ate{" "}
          {new Date(searchParams.checkOut).toLocaleDateString("pt-BR")}
          {searchParams.guests
            ? `, ${searchParams.guests} hospede${searchParams.guests > 1 ? "s" : ""}`
            : ""}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`room-skeleton-${index}`}
              className="card h-[28rem] animate-pulse bg-white/70"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[var(--radius-xl)] border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="mb-2 text-base font-semibold text-[var(--color-error)]">
            Nao foi possivel carregar os quartos.
          </p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white/70 px-6 py-14 text-center">
          <p className="mb-2 text-base text-[var(--color-text-muted)]">
            Nenhum quarto ativo foi encontrado para os criterios selecionados.
          </p>
          <p className="text-sm text-[var(--color-text-faint)]">
            Revise as datas e tente novamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              detailHref={buildRoomDetailHref(room, searchParams)}
            />
          ))}
        </div>
      )}
    </>
  );
}