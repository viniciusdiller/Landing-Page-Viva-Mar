'use client';

import { useEffect, useState } from 'react';
import RoomCard from './RoomCard';
import { fetchRooms } from '@/lib/mock-rooms';
import { calcNights } from '@/lib/booking';
import type { RoomType, RoomSearchParams } from '@/types';

interface RoomsSectionProps {
  searchParams?: RoomSearchParams;
  onBook: (room: RoomType, nights: number, checkIn: string, checkOut: string, guests: number) => void;
}

export default function RoomsSection({ searchParams, onBook }: RoomsSectionProps) {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  const nights = calcNights(searchParams?.checkIn ?? '', searchParams?.checkOut ?? '');

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

  return (
    <section id="quartos" className="section" aria-labelledby="quartos-heading">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-10 max-w-xl">
          <p
            className="text-[var(--color-primary)] mb-2"
            style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Acomodações
          </p>
          <h2
            id="quartos-heading"
            className="text-[var(--color-text)] mb-3"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 600 }}
          >
            Acomodações da Pousada Viva Mar
          </h2>
          <p className="text-[var(--color-text-muted)]" style={{ fontSize: 'var(--text-base)' }}>
            {searchParams?.checkIn && searchParams?.checkOut
              ? `Disponibilidade para ${new Date(searchParams.checkIn).toLocaleDateString('pt-BR')} — ${new Date(searchParams.checkOut).toLocaleDateString('pt-BR')}${searchParams.guests ? `, ${searchParams.guests} hóspede${searchParams.guests > 1 ? 's' : ''}` : ''}`
              : '5 tipos de apartamentos com conforto, varanda com rede e clima praiano em Saquarema.'}
          </p>
        </div>

        {/* Grid / Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)' }}>
                <div
                  className="animate-pulse"
                  style={{
                    aspectRatio: '4/3',
                    background: 'linear-gradient(90deg, var(--color-surface-offset) 25%, var(--color-surface-dynamic, #e6e4df) 50%, var(--color-surface-offset) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                  }}
                />
                <div className="p-5 space-y-3">
                  <div className="h-5 rounded" style={{ background: 'var(--color-surface-offset)', width: '70%' }} />
                  <div className="h-4 rounded" style={{ background: 'var(--color-surface-offset)', width: '100%' }} />
                  <div className="h-4 rounded" style={{ background: 'var(--color-surface-offset)', width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--color-text-muted)] mb-4" style={{ fontSize: 'var(--text-lg)' }}>
              Nenhum quarto disponível para os critérios selecionados.
            </p>
            <p className="text-[var(--color-text-faint)]" style={{ fontSize: 'var(--text-sm)' }}>
              Tente alterar as datas ou o número de hóspedes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
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
                    searchParams?.checkIn ?? '',
                    searchParams?.checkOut ?? '',
                    searchParams?.guests ?? 1
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </section>
  );
}
