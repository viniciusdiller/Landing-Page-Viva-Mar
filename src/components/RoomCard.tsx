'use client';

import { useState } from 'react';
import { Users, BedDouble, Maximize, ArrowRight, Wifi, Wind, Tv, Coffee, Waves, Trees, ParkingCircle, Bath, Utensils } from 'lucide-react';
import type { RoomType } from '@/types';
import { formatBRL } from '@/lib/booking';

// Mapeamento de nome de ícone (string) para componente Lucide
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  wifi: Wifi,
  'air-vent': Wind,
  tv: Tv,
  coffee: Coffee,
  waves: Waves,
  bath: Bath,
  trees: Trees,
  'parking-circle': ParkingCircle,
  utensils: Utensils,
};

function AmenityIcon({ name, label }: { name: string; label: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <span style={{ fontSize: 'var(--text-xs)' }}>{label}</span>;
  return (
    <span
      className="flex items-center gap-1 text-[var(--color-text-muted)]"
      style={{ fontSize: 'var(--text-xs)' }}
      title={label}
    >
      <Icon size={13} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

interface RoomCardProps {
  room: RoomType;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  nights?: number;
  onBook: (room: RoomType) => void;
}

export default function RoomCard({ room, checkIn, checkOut, guests, nights = 1, onBook }: RoomCardProps) {
  const [imgIdx, setImgIdx] = useState(0);

  return (
    <article
      className="card group flex flex-col h-full"
      aria-label={`Quarto: ${room.name}`}
    >
      {/* Imagem */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '4/3' }}
      >
        <img
          src={room.images[imgIdx] ?? room.images[0]}
          alt={`${room.name} — Pousada Viva Mar`}
          width={800}
          height={500}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/fallback-${room.id}/800/500`;
          }}
        />
        {/* Thumbnail dots */}
        {room.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {room.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                aria-label={`Ver foto ${i + 1}`}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  background: i === imgIdx ? 'white' : 'oklch(1 0 0 / 0.5)',
                  transform: i === imgIdx ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}
        {/* View badge */}
        {room.view && (
          <div
            className="absolute top-3 left-3 badge badge-teal"
            style={{ backdropFilter: 'blur(6px)' }}
          >
            <Waves size={11} aria-hidden="true" />
            {room.view}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title */}
        <h3
          className="mb-1 text-[var(--color-text)]"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600 }}
        >
          {room.name}
        </h3>

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 mb-3">
          <span className="flex items-center gap-1 text-[var(--color-text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
            <Users size={13} aria-hidden="true" />
            Até {room.maxOccupancy} hóspedes
          </span>
          {room.bedType && (
            <span className="flex items-center gap-1 text-[var(--color-text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
              <BedDouble size={13} aria-hidden="true" />
              {room.bedType}
            </span>
          )}
          {room.size && (
            <span className="flex items-center gap-1 text-[var(--color-text-muted)]" style={{ fontSize: 'var(--text-xs)' }}>
              <Maximize size={13} aria-hidden="true" />
              {room.size}
            </span>
          )}
        </div>

        {/* Description */}
        <p
          className="text-[var(--color-text-muted)] mb-4 flex-1"
          style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
        >
          {room.description}
        </p>

        {/* Amenities (primeiras 4) */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-5">
          {room.amenities.slice(0, 4).map((a) => (
            <AmenityIcon key={a.label} name={a.icon} label={a.label} />
          ))}
          {room.amenities.length > 4 && (
            <span className="text-[var(--color-text-faint)]" style={{ fontSize: 'var(--text-xs)' }}>
              +{room.amenities.length - 4} mais
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div
          className="flex items-end justify-between pt-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div>
            <div className="text-[var(--color-text-faint)]" style={{ fontSize: 'var(--text-xs)' }}>a partir de</div>
            <div
              className="text-[var(--color-primary)]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, lineHeight: 1 }}
            >
              {formatBRL(room.pricePerNight)}
            </div>
            <div className="text-[var(--color-text-faint)]" style={{ fontSize: 'var(--text-xs)' }}>/noite</div>
            {nights > 1 && (
              <div className="text-[var(--color-text-muted)] mt-0.5" style={{ fontSize: 'var(--text-xs)' }}>
                {formatBRL(room.pricePerNight * nights)} total ({nights} noites)
              </div>
            )}
          </div>
          <button
            onClick={() => onBook(room)}
            className="btn btn-primary flex items-center gap-1.5"
            style={{ padding: '0.6rem 1.1rem', fontSize: 'var(--text-sm)' }}
            aria-label={`Reservar ${room.name}`}
          >
            Reservar
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
