'use client';

import { useState } from 'react';
import { MapPin, Calendar, Users, Search } from 'lucide-react';
import type { RoomSearchParams } from '@/types';

interface SearchWidgetProps {
  onSearch: (params: RoomSearchParams) => void;
  compact?: boolean;
}

export default function SearchWidget({ onSearch, compact = false }: SearchWidgetProps) {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState(2);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch({ destination: 'Pousada Viva Mar', checkIn, checkOut, guests });
    // Rola até a vitrine de quartos
    document.getElementById('quartos')?.scrollIntoView({ behavior: 'smooth' });
  }

  const baseInputStyle = {
    background: 'white',
    border: 'none',
    borderRadius: 0,
    fontSize: 'var(--text-sm)',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    color: 'var(--color-text)',
    width: '100%',
    minHeight: '56px',
    outline: 'none',
  } as React.CSSProperties;

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Buscar quartos disponíveis"
      style={{
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 8px 40px oklch(0.1 0.03 220 / 0.25)',
        overflow: 'hidden',
        border: '1px solid oklch(1 0 0 / 0.8)',
      }}
    >
      <div className="flex flex-col md:flex-row">
        {/* Destino (estático — é sempre a Pousada Viva Mar) */}
        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-[var(--color-border)]">
          <label htmlFor="search-destination" className="sr-only">Destino</label>
          <MapPin
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]"
            aria-hidden="true"
          />
          <div style={baseInputStyle}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destino</div>
            <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>Pousada Viva Mar, Florianópolis</div>
          </div>
        </div>

        {/* Check-in */}
        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-[var(--color-border)]">
          <label htmlFor="search-checkin" className="sr-only">Data de check-in</label>
          <Calendar
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)] pointer-events-none z-10"
            aria-hidden="true"
          />
          <div className="absolute top-3 left-10" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', pointerEvents: 'none' }}>
            Check-in
          </div>
          <input
            id="search-checkin"
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => setCheckIn(e.target.value)}
            style={{ ...baseInputStyle, paddingTop: '1.75rem', paddingBottom: '0.35rem' }}
            required
          />
        </div>

        {/* Check-out */}
        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-[var(--color-border)]">
          <label htmlFor="search-checkout" className="sr-only">Data de check-out</label>
          <Calendar
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)] pointer-events-none z-10"
            aria-hidden="true"
          />
          <div className="absolute top-3 left-10" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', pointerEvents: 'none' }}>
            Check-out
          </div>
          <input
            id="search-checkout"
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
            style={{ ...baseInputStyle, paddingTop: '1.75rem', paddingBottom: '0.35rem' }}
            required
          />
        </div>

        {/* Hóspedes */}
        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-[var(--color-border)]">
          <label htmlFor="search-guests" className="sr-only">Número de hóspedes</label>
          <Users
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)] pointer-events-none z-10"
            aria-hidden="true"
          />
          <div className="absolute top-3 left-10" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', pointerEvents: 'none' }}>
            Hóspedes
          </div>
          <select
            id="search-guests"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            style={{ ...baseInputStyle, paddingTop: '1.75rem', paddingBottom: '0.35rem', cursor: 'pointer' }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} hóspede{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Botão buscar */}
        <button
          type="submit"
          className="btn btn-primary flex items-center justify-center gap-2"
          style={{
            borderRadius: '0 var(--radius-xl) var(--radius-xl) 0',
            padding: '0 2rem',
            minHeight: '56px',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
          }}
          aria-label="Buscar quartos disponíveis"
        >
          <Search size={18} aria-hidden="true" />
          <span className="md:hidden lg:inline">Buscar</span>
        </button>
      </div>
    </form>
  );
}
