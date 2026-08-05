"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BedDouble, Loader2, Moon, Users } from "lucide-react";
import { BED_TYPE_LABELS } from "@/types";
import RoomPhotoCarousel from "@/components/RoomPhotoCarousel";
import CheckoutModal from "@/components/CheckoutModal";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { fetchPublicRooms } from "@/lib/api/rooms";
import { calcNights, formatBRL } from "@/lib/booking";
import type { RoomType } from "@/types";

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const roomId = decodeURIComponent(params.id);

  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") ?? "");
  const [guests, setGuests] = useState(
    Number(searchParams.get("guests") ?? "1") || 1,
  );

  const [room, setRoom] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);
  // Atualizar as datas re-busca o quarto (pra pegar preço/disponibilidade
  // corretos pro período), mas isso não deve derrubar a página inteira pra
  // uma tela de carregamento de novo — só a primeira busca faz isso. Trocas
  // de data depois só mostram um indicador discreto perto do preço.
  const [refreshingPrice, setRefreshingPrice] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const loadedRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (loadedRoomIdRef.current === roomId) {
      setRefreshingPrice(true);
    } else {
      setLoading(true);
    }
    setNotFound(false);

    fetchPublicRooms({
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
    })
      .then((rooms) => {
        if (cancelled) return;
        const found = rooms.find((item) => item.id === roomId) ?? null;
        setRoom(found);
        setNotFound(!found);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (cancelled) return;
        loadedRoomIdRef.current = roomId;
        setLoading(false);
        setRefreshingPrice(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, checkIn, checkOut]);

  const nights = useMemo(() => calcNights(checkIn, checkOut), [checkIn, checkOut]);
  const hasDates = Boolean(checkIn && checkOut);
  const hasDateError = hasDates && nights <= 0;
  const minimumStayNights = room
    ? Math.max(room.minStayNights ?? 0, room.minStayDays ?? 0)
    : 0;
  const todayISO = new Date().toISOString().split("T")[0];
  const dateInputClassName =
    "w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)]";

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="border-b border-[var(--color-border)]">
        <div className="container-wide flex items-center justify-between h-20">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
            <span className="text-sm">Voltar</span>
          </Link>
          <Link
            href="/"
            className="uppercase text-[var(--color-text)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            Viva Mar
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="container-wide py-24 flex items-center justify-center gap-2 text-[var(--color-text-muted)]">
          <Loader2 size={18} className="animate-spin" />
          Carregando quarto...
        </div>
      ) : notFound || !room ? (
        <div className="container-wide py-24 text-center">
          <p className="mb-4 text-lg font-semibold">Quarto não encontrado.</p>
          <Link href="/#quartos" className="btn btn-primary">
            Ver acomodações
          </Link>
        </div>
      ) : (
        <>
          <div className="container-wide pt-8">
            <RoomPhotoCarousel
              images={room.images}
              alt={room.name}
              sizeClassName="aspect-[16/9] md:aspect-[21/9]"
              className="rounded-[var(--radius-xl)]"
            />
          </div>

          <div className="container-wide py-10 md:py-14 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16">
            <div>
              <h1
                className="text-2xl md:text-3xl font-semibold mb-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {room.name}
              </h1>

              <div className="mb-6 flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] px-3 py-1.5">
                  <Users size={14} aria-hidden="true" />
                  Até {room.maxOccupancy}{" "}
                  {room.maxOccupancy === 1 ? "hóspede" : "hóspedes"}
                </span>
                {minimumStayNights > 1 && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] px-3 py-1.5">
                    <Moon size={14} aria-hidden="true" />
                    Mínimo {minimumStayNights} noites
                  </span>
                )}
              </div>

              {room.beds.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] mb-3">
                    Camas
                  </h2>
                  <div className="mb-6 flex flex-wrap gap-2">
                    {room.beds.map((bed) => (
                      <span
                        key={bed.type}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)]"
                      >
                        <BedDouble size={14} aria-hidden="true" />
                        {bed.quantity}x {BED_TYPE_LABELS[bed.type]}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] mb-3">
                Comodidades
              </h2>
              {room.amenitiesList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {room.amenitiesList.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)]"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-faint)]">
                  Comodidades não informadas.
                </p>
              )}
            </div>

            <aside className="lg:sticky lg:top-8 h-fit border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 bg-[var(--color-surface)]">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-faint)] mb-1">
                Diária
              </p>
              <p className="flex items-center gap-2 text-2xl font-semibold text-[var(--color-primary)] mb-4">
                {formatBRL(room.pricePerNight)}
                {refreshingPrice && (
                  <Loader2
                    size={16}
                    className="animate-spin text-[var(--color-text-faint)]"
                    aria-label="Atualizando preço para as datas selecionadas"
                  />
                )}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <label className="block">
                  <span className="text-xs text-[var(--color-text-faint)]">
                    Check-in
                  </span>
                  <input
                    type="date"
                    min={todayISO}
                    value={checkIn}
                    onChange={(event) => setCheckIn(event.target.value)}
                    className={`${dateInputClassName} mt-1 cursor-pointer`}
                    aria-invalid={hasDateError}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-[var(--color-text-faint)]">
                    Check-out
                  </span>
                  <input
                    type="date"
                    min={checkIn || todayISO}
                    value={checkOut}
                    onChange={(event) => setCheckOut(event.target.value)}
                    className={`${dateInputClassName} mt-1 cursor-pointer ${
                      hasDateError ? "border-red-400 text-red-600" : ""
                    }`}
                    aria-invalid={hasDateError}
                  />
                </label>
              </div>

              {hasDateError && (
                <p className="text-xs text-red-500 mb-4">
                  O check-out deve ser depois do check-in.
                </p>
              )}

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGuests((current) => Math.max(1, current - 1))}
                    className="w-8 h-8 flex items-center justify-center text-sm font-semibold border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-40"
                    disabled={guests <= 1}
                    aria-label="Diminuir número de hóspedes"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-[var(--color-text)]">
                    {guests}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setGuests((current) =>
                        Math.min(room.maxOccupancy, current + 1),
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center text-sm font-semibold border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-40"
                    disabled={guests >= room.maxOccupancy}
                    aria-label="Aumentar número de hóspedes"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-[var(--color-text-muted)]">
                  hóspede(s) · máx. {room.maxOccupancy}
                </span>
              </div>

              <p className="text-sm text-[var(--color-text-muted)] mb-6">
                {!hasDates
                  ? "Selecione as datas para continuar"
                  : hasDateError
                    ? "Ajuste as datas selecionadas"
                    : room.available
                      ? "Disponível para reserva"
                      : "Sem disponibilidade no período selecionado"}
              </p>

              <button
                type="button"
                className="btn btn-primary w-full justify-center disabled:opacity-50 disabled:pointer-events-none"
                disabled={hasDateError}
                onClick={() => setCheckoutOpen(true)}
              >
                {room.available ? "Reservar" : "Consultar"}
              </button>
            </aside>
          </div>

          <CheckoutModal
            open={checkoutOpen}
            room={room}
            bookingContext={{
              nights: Math.max(1, nights),
              checkIn,
              checkOut,
              guests,
            }}
            onClose={() => setCheckoutOpen(false)}
          />
        </>
      )}

      <Footer />
      <WhatsAppButton />
    </main>
  );
}
