"use client";

import Link from "next/link";
import { BedDouble, ImageOff, Moon, Users } from "lucide-react";
import type { RoomType } from "@/types";
import { BED_TYPE_LABELS } from "@/types";
import { formatBRL } from "@/lib/booking";

interface RoomCardProps {
  room: RoomType;
  detailHref: string;
}

function AvailabilityBadge({ available }: { available: boolean }) {
  return available ? (
    <span className="badge badge-teal">Disponivel</span>
  ) : (
    <span className="badge badge-sand">Indisponivel</span>
  );
}

export default function RoomCard({ room, detailHref }: RoomCardProps) {
  const primaryPhoto = room.photoUrls[0] ?? room.images[0] ?? null;
  const ctaLabel = room.available ? "Reservar" : "Consultar";
  const capacityLabel = `${room.maxOccupancy} ${room.maxOccupancy === 1 ? "hospede" : "hospedes"}`;
  const minimumStayNights = Math.max(room.minStayNights ?? 0, room.minStayDays ?? 0);

  return (
    <article className="card flex h-full flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="relative aspect-[4/3] bg-[linear-gradient(135deg,#dde3e8_0%,#f8fafc_100%)]">
        {primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={room.name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center gap-3 text-[var(--color-text-muted)]">
            <ImageOff size={20} aria-hidden="true" />
            <span className="text-sm font-medium">Imagem indisponivel</span>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4">
          <AvailabilityBadge available={room.available} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3
              className="text-xl font-semibold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {room.name}
            </h3>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
              Diaria
            </p>
            <strong className="text-lg text-[var(--color-primary)]">
              {formatBRL(room.pricePerNight)}
            </strong>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] px-3 py-1.5">
            <Users size={14} aria-hidden="true" />
            Ate {capacityLabel}
          </span>
          {minimumStayNights > 1 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] px-3 py-1.5">
              <Moon size={14} aria-hidden="true" />
              Minimo {minimumStayNights} noites
            </span>
          )}
          {room.beds.length > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] px-3 py-1.5">
              <BedDouble size={14} aria-hidden="true" />
              {room.beds.map((bed) => `${bed.quantity}x ${BED_TYPE_LABELS[bed.type]}`).join(", ")}
            </span>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {room.amenitiesList.length > 0 ? (
            room.amenitiesList.slice(0, 6).map((amenity) => (
              <span
                key={`${room.id}-${amenity}`}
                className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]"
              >
                {amenity}
              </span>
            ))
          ) : (
            <span className="text-sm text-[var(--color-text-faint)]">
              Comodidades nao informadas.
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--color-divider)] pt-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            {room.available
              ? "Disponivel para reserva"
              : "Sem disponibilidade no periodo selecionado"}
          </p>

          <Link
            href={detailHref}
            className={`btn ${room.available ? "btn-primary" : "btn-secondary"}`}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}