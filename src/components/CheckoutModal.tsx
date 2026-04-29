"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  TicketPercent,
  Loader2,
  Calendar,
  Users,
  AlertCircle,
} from "lucide-react";
import MercadoPagoCheckout from "./MercadoPagoCheckout";
import { formatBRL, submitReservation } from "@/lib/booking";

import type { BookingFormData, GuestData, RoomType } from "@/types";

interface CheckoutModalProps {
  open: boolean;
  room: RoomType | null;
  bookingContext: {
    nights: number;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
  onClose: () => void;
}

const DEFAULT_GUEST: GuestData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  cpf: "",
  specialRequests: "",
};

// Função para converter YYYY-MM-DD em DD/MM/YYYY
function formatDateBR(dateString: string) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export default function CheckoutModal({
  open,
  room,
  bookingContext,
  onClose,
}: CheckoutModalProps) {
  const [guest, setGuest] = useState<GuestData>(DEFAULT_GUEST);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(
    undefined,
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const subtotal = useMemo(() => {
    if (!room) return 0;
    return room.pricePerNight * Math.max(1, bookingContext.nights);
  }, [room, bookingContext.nights]);

  const total = Math.max(0, subtotal - discountAmount);

  if (!open || !room) return null;

  function updateGuest<K extends keyof GuestData>(key: K, value: GuestData[K]) {
    setGuest((prev) => ({ ...prev, [key]: value }));
  }

  async function applyCoupon() {
    if (!couponInput.trim()) {
      setCouponMessage("Digite um cupom para aplicar.");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponMessage("");

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(
        `${API_URL}/api/public/viva-mar/validate-coupon`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: couponInput.trim() }),
        },
      );

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon(data.code);
        const discountValue = (subtotal * data.discountPercentage) / 100;
        setDiscountAmount(discountValue);
        setCouponMessage(
          `Cupom ${data.code} aplicado! ${data.discountPercentage}% OFF`,
        );
      } else {
        setAppliedCoupon(undefined);
        setDiscountAmount(0);
        setCouponMessage(data.error || "Cupom inválido.");
      }
    } catch (error) {
      setAppliedCoupon(undefined);
      setDiscountAmount(0);
      setCouponMessage("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  async function handleSubmitReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!room) return;

    const formData: BookingFormData = {
      roomId: room.id,
      propertyId: room.propertyId,
      checkIn: bookingContext.checkIn,
      checkOut: bookingContext.checkOut,
      guests: bookingContext.guests,
      nights: Math.max(1, bookingContext.nights),
      pricePerNight: room.pricePerNight,
      subtotal,
      discountCode: appliedCoupon,
      discountAmount,
      total,
      guest,
    };

    setSubmitting(true);
    setResultMessage("");

    try {
      const response = await submitReservation(formData);
      setResultMessage(response.message);
    } catch {
      setResultMessage("Falha ao criar a reserva. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClassName =
    "w-full border-0 border-b border-gray-300 py-2.5 px-0 focus:ring-0 focus:border-black bg-transparent text-[15px] transition-colors outline-none placeholder:text-gray-400";

  const hasDates = Boolean(bookingContext.checkIn && bookingContext.checkOut);
  const exceedsCapacity = room ? bookingContext.guests > room.capacity : false;
  const isFull = room ? (room as any).remainingQuantity <= 0 : false;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Overlay Escuro */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Fechar checkout"
      />

      {/* Container do Modal */}
      <div className="relative w-full max-w-5xl bg-white shadow-2xl flex flex-col max-h-[95vh] md:max-h-[85vh] overflow-hidden">
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3
            className="text-[#2f3134] uppercase text-xs md:text-sm"
            style={{
              letterSpacing: "0.25em",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
            }}
          >
            Finalizar Reserva
          </h3>
          <button
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Corpo do Modal - Grid 2 colunas */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Lado Esquerdo - Resumo do Quarto */}
          <aside className="lg:w-2/5 bg-[#ececec] p-6 lg:p-8 flex flex-col border-r border-gray-200 lg:overflow-y-auto">
            <img
              src={room.images[0]}
              alt={room.name}
              className="w-full aspect-[4/3] object-cover mb-6 shadow-sm grayscale-[10%]"
            />
            <h4
              style={{ fontFamily: "var(--font-display)" }}
              className="text-2xl font-semibold mb-2 text-gray-900"
            >
              {room.name}
            </h4>
            {/* Comodidades (Amenities) adicionadas aqui */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-1 mb-5">
                {room.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="text-[10px] uppercase tracking-widest text-gray-500"
                  >
                    {amenity.label}{" "}
                    {index < room.amenities!.length - 1 && (
                      <span className="ml-2 text-gray-400">•</span>
                    )}
                  </span>
                ))}
              </div>
            )}
            <p className="text-gray-500 text-xs tracking-wider uppercase mb-8 leading-relaxed">
              {bookingContext.checkIn
                ? formatDateBR(bookingContext.checkIn)
                : "Selecione"}{" "}
              →{" "}
              {bookingContext.checkOut
                ? formatDateBR(bookingContext.checkOut)
                : "Selecione"}{" "}
              <br />
              {bookingContext.guests} hóspede(s)
            </p>
            <div className="space-y-3 pt-6 border-t border-gray-300/60 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <strong>{formatBRL(subtotal)}</strong>
              </div>
              <div className="flex justify-between text-[var(--color-success)]">
                <span>Desconto</span>
                <strong>- {formatBRL(discountAmount)}</strong>
              </div>
              <div className="pt-4 mt-2 border-t border-gray-300/60 flex justify-between text-base text-black">
                <span className="uppercase tracking-widest text-xs font-semibold self-center">
                  Total
                </span>
                <strong className="text-lg">{formatBRL(total)}</strong>
              </div>
            </div>
            {/* Cupom */}

            <div className="mt-8 pt-6 border-t border-gray-300/60 pb-2">
              <label className="block mb-3 text-[10px] tracking-widest uppercase font-semibold text-gray-500">
                <TicketPercent size={14} className="inline mr-2 -mt-0.5" />
                Cupom Promocional
              </label>

              {/* Container Unificado (Input + Botão) */}
              <div className="flex w-full bg-white border border-gray-300 focus-within:border-black transition-colors shadow-sm">
                <input
                  className="flex-1 bg-transparent border-0 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-0 placeholder:text-gray-400 uppercase disabled:opacity-50"
                  placeholder="EX: VIVAMAR10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  disabled={appliedCoupon !== undefined || isApplyingCoupon}
                />
                <button
                  type="button"
                  className="px-6 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                  onClick={applyCoupon}
                  disabled={isApplyingCoupon || appliedCoupon !== undefined}
                >
                  {isApplyingCoupon ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : appliedCoupon ? (
                    "Aplicado"
                  ) : (
                    "Aplicar"
                  )}
                </button>
              </div>

              {couponMessage && (
                <p
                  className={`mt-3 text-xs font-medium ${
                    appliedCoupon
                      ? "text-[var(--color-success)]"
                      : "text-red-500"
                  }`}
                >
                  {couponMessage}
                </p>
              )}
            </div>
          </aside>
          {/* Lado Direito - Formulário */}
          <form
            onSubmit={handleSubmitReservation}
            className="lg:w-3/5 p-6 lg:p-8 flex flex-col justify-between bg-white lg:overflow-y-auto "
          >
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-gray-800 mb-6">
                Informações de Reserva
              </h4>

              {!hasDates ? (
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-lg mb-8 flex items-start gap-3">
                  <Calendar
                    className="text-amber-600 mt-0.5"
                    size={18}
                    strokeWidth={1.5}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-amber-900">
                      Período não definido
                    </span>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Para prosseguir, selecione as datas de{" "}
                      <strong>Check-in</strong> e <strong>Check-out</strong> no
                      buscador e clique em <strong>BUSCAR</strong>.
                    </p>
                  </div>
                </div>
              ) : exceedsCapacity ? (
                <div className="bg-red-50/50 border border-red-100 p-4 rounded-lg mb-8 flex items-start gap-3">
                  <AlertCircle
                    className="text-red-600 mt-0.5"
                    size={18}
                    strokeWidth={1.5}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-red-900">
                      Capacidade Excedida
                    </span>
                    <p className="text-xs text-red-800 leading-relaxed">
                      Este quarto acomoda até {room.capacity} hóspedes. Por
                      favor, ajuste o número de pessoas ou selecione uma
                      acomodação de maior porte.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-vm-teal-50/30 border border-vm-teal-100 p-4 rounded-lg mb-8 flex items-start gap-3">
                  <Calendar
                    className="text-vm-teal-600 mt-0.5"
                    size={18}
                    strokeWidth={1.5}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-vm-teal-900">
                      Reserva Confirmada para o Período
                    </span>
                    <p className="text-xs text-vm-teal-800 leading-relaxed">
                      {formatDateBR(bookingContext.checkIn)} até{" "}
                      {formatDateBR(bookingContext.checkOut)}
                      <span className="mx-2 opacity-50">•</span>
                      {bookingContext.nights} noites para{" "}
                      {bookingContext.guests} hóspedes.
                    </p>
                  </div>
                </div>
              )}

              <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400 mb-6">
                Dados do Titular
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <input
                  className={inputClassName}
                  placeholder="Nome"
                  value={guest.firstName}
                  onChange={(e) => updateGuest("firstName", e.target.value)}
                  required
                />
                <input
                  className={inputClassName}
                  placeholder="Sobrenome"
                  value={guest.lastName}
                  onChange={(e) => updateGuest("lastName", e.target.value)}
                  required
                />
                <input
                  className={inputClassName}
                  type="email"
                  placeholder="E-mail"
                  value={guest.email}
                  onChange={(e) => updateGuest("email", e.target.value)}
                  required
                />
                <input
                  className={inputClassName}
                  placeholder="Telefone"
                  value={guest.phone}
                  onChange={(e) => updateGuest("phone", e.target.value)}
                  required
                />
                <input
                  className={`${inputClassName} sm:col-span-2`}
                  placeholder="CPF (opcional)"
                  value={guest.cpf}
                  onChange={(e) => updateGuest("cpf", e.target.value)}
                />
                <textarea
                  className={`${inputClassName} sm:col-span-2 min-h-[80px] resize-none`}
                  placeholder="Pedidos especiais (opcional)"
                  value={guest.specialRequests}
                  onChange={(e) =>
                    updateGuest("specialRequests", e.target.value)
                  }
                />
              </div>
            </div>

            {hasDates && !exceedsCapacity && !isFull && (
              <div className="mt-10 space-y-4">
                <button
                  type="submit"
                  className="w-full bg-black text-white py-4 uppercase tracking-[0.2em] text-xs font-semibold hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  {submitting ? "Processando..." : "Confirmar Reserva"}
                </button>

                <MercadoPagoCheckout
                  room={room}
                  bookingContext={bookingContext}
                  guest={guest}
                  total={total}
                  onClose={onClose}
                />
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
