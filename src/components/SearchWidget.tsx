"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { RoomSearchParams } from "@/types";

interface SearchWidgetProps {
  onSearch: (params: RoomSearchParams) => void;
}

export default function SearchWidget({ onSearch }: SearchWidgetProps) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState(2);
  const [coupon, setCoupon] = useState("");
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
      destination: "Pousada Viva Mar - Saquarema",
      checkIn,
      checkOut,
      guests,
    });
    document.getElementById("quartos")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-none md:rounded-sm border border-white/50 bg-white shadow-[0_10px_32px_rgba(0,0,0,0.28)] overflow-hidden"
      aria-label="Buscar quartos disponíveis na Pousada Viva Mar"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-px bg-slate-200">
        <div className="min-w-0 bg-white px-6 py-4 min-h-[90px] flex items-center justify-between gap-2 md:col-span-2 xl:col-span-3">
          <div>
            <p className="text-[11px] font-semibold text-slate-700">Destino ou Hotel</p>
            <p className="mt-2 text-[clamp(1.05rem,1.45vw,1.65rem)] leading-tight font-semibold text-[var(--color-primary)]">Selecione</p>
          </div>
          <ChevronDown size={20} className="text-[var(--color-primary)]" aria-hidden="true" />
        </div>

        <div className="min-w-0 bg-white px-6 py-4 min-h-[90px] xl:col-span-2">
          <label htmlFor="checkin" className="text-[11px] font-semibold text-slate-700">Check-in</label>
          <input
            id="checkin"
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="mt-2 w-full min-w-0 pr-8 text-[clamp(0.95rem,1vw,1.1rem)] leading-tight font-semibold text-[var(--color-primary)] bg-transparent outline-none"
            aria-invalid={hasDateError}
          />
        </div>

        <div className="min-w-0 bg-white px-6 py-4 min-h-[90px] xl:col-span-2">
          <label htmlFor="checkout" className="text-[11px] font-semibold text-slate-700">Check-out</label>
          <input
            id="checkout"
            type="date"
            min={checkIn}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={`mt-2 w-full min-w-0 pr-8 text-[clamp(0.95rem,1vw,1.1rem)] leading-tight font-semibold bg-transparent outline-none ${hasDateError ? "text-[var(--color-error)]" : "text-[var(--color-primary)]"}`}
            aria-invalid={hasDateError}
          />
        </div>

        <div className="min-w-0 bg-white px-6 py-4 min-h-[90px] xl:col-span-2">
          <label htmlFor="guests" className="text-[11px] font-semibold text-slate-700">Hóspedes</label>
          <div className="relative mt-2">
            <select
              id="guests"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full min-w-0 appearance-none pr-8 text-[clamp(0.95rem,1.05vw,1.1rem)] leading-tight font-semibold text-[var(--color-primary)] bg-transparent border-0 rounded-none outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} {n > 1 ? "adultos" : "adulto"}</option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-primary)]"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="min-w-0 bg-white px-6 py-4 min-h-[90px] md:col-span-2 xl:col-span-2">
          <label htmlFor="coupon" className="text-[11px] font-semibold text-slate-700">Cupom</label>
          <input
            id="coupon"
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="mt-2 w-full min-w-0 text-[clamp(0.95rem,1.05vw,1.1rem)] leading-tight text-slate-500 bg-transparent outline-none"
            placeholder="Meu Cupom"
          />
        </div>

        <button
          type="submit"
          className="min-h-[90px] px-8 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-base tracking-[0.06em] transition-colors inline-flex items-center justify-center gap-2 xl:col-span-1"
          aria-label="Buscar quartos"
        >
          <Search size={18} /> BUSCAR
        </button>
      </div>
      {showError && hasDateError && (
        <p className="m-3 px-3 py-2 text-xs text-[var(--color-error)] bg-red-50 border border-red-200 rounded-lg">
          A data de check-out deve ser posterior ao check-in.
        </p>
      )}
    </form>
  );
}
