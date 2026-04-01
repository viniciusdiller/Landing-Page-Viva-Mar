'use client';

import { useMemo, useState } from 'react';
import { MapPin, Calendar, Users, Search } from 'lucide-react';
import type { RoomSearchParams } from '@/types';

interface SearchWidgetProps {
  onSearch: (params: RoomSearchParams) => void;
}

export default function SearchWidget({ onSearch }: SearchWidgetProps) {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState(2);
  const [showError, setShowError] = useState(false);

  const hasDateError = useMemo(() => new Date(checkOut) <= new Date(checkIn), [checkIn, checkOut]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasDateError) {
      setShowError(true);
      return;
    }

    setShowError(false);
    onSearch({
      destination: 'Pousada Viva Mar - Saquarema',
      checkIn,
      checkOut,
      guests,
    });
    document.getElementById('quartos')?.scrollIntoView({ behavior: 'smooth' });
  }

  const fieldClass =
    'group relative rounded-xl border border-[var(--color-border)] bg-white/96 transition-shadow hover:shadow-sm focus-within:ring-2 focus-within:ring-[var(--color-primary)]/25';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/65 bg-white/85 p-3 md:p-4 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
      aria-label="Buscar quartos disponíveis na Pousada Viva Mar"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
        <div className={`${fieldClass} md:col-span-3`}>
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" aria-hidden="true" />
          <div className="pl-10 pr-4 py-3 min-h-[58px]">
            <label className="block text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-faint)] font-semibold">Destino</label>
            <p className="text-[var(--color-text)] font-semibold text-sm leading-tight">Pousada Viva Mar, Saquarema</p>
          </div>
        </div>

        <div className={`${fieldClass} md:col-span-2`}>
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" aria-hidden="true" />
          <label htmlFor="checkin" className="sr-only">Check-in</label>
          <input
            id="checkin"
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full rounded-xl min-h-[58px] pl-10 pr-3 pt-5 pb-1 text-sm bg-transparent outline-none"
            aria-invalid={hasDateError}
          />
          <span className="absolute left-10 top-2 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-faint)] font-semibold">Check-in</span>
        </div>

        <div className={`${fieldClass} md:col-span-2`}>
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" aria-hidden="true" />
          <label htmlFor="checkout" className="sr-only">Check-out</label>
          <input
            id="checkout"
            type="date"
            min={checkIn}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={`w-full rounded-xl min-h-[58px] pl-10 pr-3 pt-5 pb-1 text-sm bg-transparent outline-none ${hasDateError ? 'text-[var(--color-error)]' : ''}`}
            aria-invalid={hasDateError}
          />
          <span className="absolute left-10 top-2 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-faint)] font-semibold">Check-out</span>
        </div>

        <div className={`${fieldClass} md:col-span-2`}>
          <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" aria-hidden="true" />
          <label htmlFor="guests" className="sr-only">Hóspedes</label>
          <select id="guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full rounded-xl min-h-[58px] pl-10 pr-3 pt-5 pb-1 text-sm bg-transparent outline-none cursor-pointer">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} hóspede{n > 1 ? 's' : ''}</option>
            ))}
          </select>
          <span className="absolute left-10 top-2 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-faint)] font-semibold">Hóspedes</span>
        </div>

        <button type="submit" className="btn btn-primary md:col-span-3 min-h-[58px] px-6 justify-center rounded-xl" aria-label="Buscar quartos">
          <Search size={16} /> Ver disponibilidade
        </button>
      </div>
      {showError && hasDateError && (
        <p className="mt-2 px-3 py-2 text-xs text-[var(--color-error)] bg-red-50 border border-red-200 rounded-lg">
          A data de check-out deve ser posterior ao check-in.
        </p>
      )}
    </form>
  );
}
