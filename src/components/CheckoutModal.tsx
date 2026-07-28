"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  TicketPercent,
  Loader2,
  Calendar,
  Users,
  AlertCircle,
  Gift,
} from "lucide-react";
import { formatBRL, calcNights } from "@/lib/booking";
import { fetchPackages, calculatePackagesTotal } from "@/lib/api/packages";
import { createCheckoutSession } from "@/lib/api/checkout";
import RoomPhotoCarousel from "@/components/RoomPhotoCarousel";

import type {
  CheckoutSessionRequest,
  GuestData,
  RoomType,
  Package,
  SelectedPackage,
} from "@/types";

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
  const [submitError, setSubmitError] = useState(false);
  const [guestsCount, setGuestsCount] = useState(bookingContext.guests);
  const [checkIn, setCheckIn] = useState(bookingContext.checkIn);
  const [checkOut, setCheckOut] = useState(bookingContext.checkOut);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Map<string, number>>(
    new Map(),
  );
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [isPackagesModalOpen, setIsPackagesModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setResultMessage("");
      setSubmitError(false);
      setGuestsCount(bookingContext.guests);
      setCheckIn(bookingContext.checkIn);
      setCheckOut(bookingContext.checkOut);
      // Carregar pacotes quando o modal abre
      setLoadingPackages(true);
      fetchPackages()
        .then(setPackages)
        .catch((error) => {
          console.error("Erro ao carregar pacotes:", error);
          setPackages([]);
        })
        .finally(() => setLoadingPackages(false));
    } else {
      document.body.style.overflow = "unset";
      // Limpar pacotes selecionados quando fecha
      setSelectedPackages(new Map());
      setIsPackagesModalOpen(false);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const nights = useMemo(() => calcNights(checkIn, checkOut), [checkIn, checkOut]);
  const hasDateError = Boolean(checkIn && checkOut) && nights <= 0;

  const subtotal = useMemo(() => {
    if (!room) return 0;
    return room.pricePerNight * Math.max(1, nights);
  }, [room, nights]);

  const packagesTotal = useMemo(() => {
    return calculatePackagesTotal(
      packages,
      Array.from(selectedPackages.entries()).map(([id, quantity]) => ({
        id,
        quantity,
      })),
    );
  }, [packages, selectedPackages]);

  const total = Math.max(0, subtotal + packagesTotal - discountAmount);
  const selectedPackagesCount = Array.from(selectedPackages.values()).reduce(
    (acc, quantity) => acc + quantity,
    0,
  );

  if (!open || !room) return null;

  function updateGuest<K extends keyof GuestData>(key: K, value: GuestData[K]) {
    setGuest((prev) => ({ ...prev, [key]: value }));
  }

  function togglePackage(packageId: string, quantity: number) {
    setSelectedPackages((prev) => {
      const updated = new Map(prev);
      if (quantity > 0) {
        updated.set(packageId, quantity);
      } else {
        updated.delete(packageId);
      }
      return updated;
    });
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

    const selectedPackagesArray: SelectedPackage[] = Array.from(
      selectedPackages.entries(),
    ).map(([id, quantity]) => {
      const pkg = packages.find((p) => p.id === id);
      return {
        id,
        name: pkg?.name || "",
        description: pkg?.description || "",
        price: pkg?.price || 0,
        icon: pkg?.icon,
        quantity,
      };
    });

    const checkoutRequest: CheckoutSessionRequest = {
      roomId: room.id,
      roomName: room.name,
      propertyId: room.propertyId,
      checkIn,
      checkOut,
      guests: guestsCount,
      nights: Math.max(1, nights),
      pricePerNight: room.pricePerNight,
      subtotal,
      discountCode: appliedCoupon,
      discountAmount,
      packages: selectedPackagesArray,
      packagesTotal,
      total,
      guest,
    };

    setSubmitting(true);
    setResultMessage("");

    try {
      const { initPoint } = await createCheckoutSession(checkoutRequest);
      // Sai do site e vai para o checkout hospedado do Mercado Pago — a
      // reserva só é criada de fato depois que o pagamento é aprovado lá
      // (ver o webhook em src/app/api/webhooks/mercadopago/route.ts).
      window.location.href = initPoint;
    } catch (error) {
      setResultMessage(
        error instanceof Error
          ? error.message
          : "Falha ao iniciar o pagamento. Tente novamente.",
      );
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClassName =
    "w-full border-0 border-b border-gray-300 py-2.5 px-0 focus:ring-0 focus:border-black bg-transparent text-[15px] transition-colors outline-none placeholder:text-gray-400";

  const todayISO = new Date().toISOString().split("T")[0];
  const hasDates = Boolean(checkIn && checkOut) && !hasDateError;
  const exceedsCapacity = room ? guestsCount > room.capacity : false;
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

        {/* Foto do quarto em destaque, ocupando a largura toda do modal */}
        <RoomPhotoCarousel
          images={room.images}
          alt={room.name}
          sizeClassName="h-48 sm:h-64 md:h-72"
          className="shrink-0"
        />

        {/* Corpo do Modal - Grid 2 colunas */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Lado Esquerdo - Resumo do Quarto */}
          <aside className="lg:w-2/5 bg-[#ececec] p-6 lg:p-8 flex flex-col border-r border-gray-200 lg:overflow-y-auto">
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
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] tracking-widest uppercase text-gray-500">
                    Check-in
                  </span>
                  <input
                    type="date"
                    min={todayISO}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="mt-1 w-full border-0 border-b border-gray-300 bg-transparent py-1.5 text-sm font-semibold text-gray-900 outline-none focus:border-black cursor-pointer"
                    aria-invalid={hasDateError}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] tracking-widest uppercase text-gray-500">
                    Check-out
                  </span>
                  <input
                    type="date"
                    min={checkIn || todayISO}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className={`mt-1 w-full border-0 border-b bg-transparent py-1.5 text-sm font-semibold outline-none cursor-pointer ${
                      hasDateError
                        ? "border-red-400 text-red-600"
                        : "border-gray-300 text-gray-900 focus:border-black"
                    }`}
                    aria-invalid={hasDateError}
                  />
                </label>
              </div>
              {hasDateError ? (
                <p className="mt-2 text-xs text-red-500">
                  O check-out deve ser depois do check-in.
                </p>
              ) : (
                checkIn &&
                checkOut && (
                  <p className="mt-2 text-xs text-gray-500 uppercase tracking-wider">
                    {nights} {nights === 1 ? "noite" : "noites"}
                  </p>
                )
              )}
            </div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setGuestsCount((current) => Math.max(1, current - 1))
                  }
                  className="w-7 h-7 flex items-center justify-center text-sm font-semibold border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-40"
                  disabled={guestsCount <= 1}
                  aria-label="Diminuir número de hóspedes"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold text-gray-900">
                  {guestsCount}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setGuestsCount((current) =>
                      room ? Math.min(room.capacity, current + 1) : current + 1,
                    )
                  }
                  className="w-7 h-7 flex items-center justify-center text-sm font-semibold border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-40"
                  disabled={room ? guestsCount >= room.capacity : false}
                  aria-label="Aumentar número de hóspedes"
                >
                  +
                </button>
              </div>
              <span className="text-xs tracking-wider uppercase text-gray-500">
                hóspede(s){room ? ` · máx. ${room.capacity}` : ""}
              </span>
            </div>

            {/* Pacotes e Adicionais */}
            <div className="mb-8 pt-6 border-t border-gray-300/60">
              <label className="block mb-4 text-[10px] tracking-widest uppercase font-semibold text-gray-500">
                <Gift size={14} className="inline mr-2 -mt-0.5" />
                Pacotes & Adicionais
              </label>

              <button
                type="button"
                onClick={() => setIsPackagesModalOpen(true)}
                className="w-full flex items-center justify-between border border-gray-300 bg-white hover:bg-gray-50 transition-colors px-4 py-3"
              >
                <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  {selectedPackagesCount > 0
                    ? `${selectedPackagesCount} adicional(is) selecionado(s)`
                    : "Selecionar pacotes e adicionais"}
                </span>
                <span className="text-xs font-bold text-[var(--color-primary)]">
                  {selectedPackagesCount > 0
                    ? `+ ${formatBRL(packagesTotal)}`
                    : "Abrir"}
                </span>
              </button>

              {loadingPackages && (
                <p className="mt-3 text-xs text-gray-500">Carregando pacotes...</p>
              )}

              {!loadingPackages && packages.length === 0 && (
                <p className="mt-3 text-xs text-gray-400">
                  Nenhum pacote disponível no momento.
                </p>
              )}

              {packagesTotal > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-300/60 flex justify-between text-sm font-semibold text-gray-700">
                  <span>Adicionais</span>
                  <span className="text-[var(--color-primary)]">
                    + {formatBRL(packagesTotal)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-300/60 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (diária)</span>
                <strong>{formatBRL(subtotal)}</strong>
              </div>
              {packagesTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Adicionais</span>
                  <strong className="text-[var(--color-primary)]">
                    + {formatBRL(packagesTotal)}
                  </strong>
                </div>
              )}
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

              {!checkIn || !checkOut ? (
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
                      <strong>Check-in</strong> e <strong>Check-out</strong> ao
                      lado, no resumo do quarto.
                    </p>
                  </div>
                </div>
              ) : hasDateError ? (
                <div className="bg-red-50/50 border border-red-100 p-4 rounded-lg mb-8 flex items-start gap-3">
                  <AlertCircle
                    className="text-red-600 mt-0.5"
                    size={18}
                    strokeWidth={1.5}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-red-900">
                      Datas inválidas
                    </span>
                    <p className="text-xs text-red-800 leading-relaxed">
                      O check-out deve ser depois do check-in. Ajuste as datas
                      no resumo do quarto.
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
                      Período Selecionado
                    </span>
                    <p className="text-xs text-vm-teal-800 leading-relaxed">
                      {formatDateBR(checkIn)} até{" "}
                      {formatDateBR(checkOut)}
                      <span className="mx-2 opacity-50">•</span>
                      {nights} noites para{" "}
                      {guestsCount} hóspedes.
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
                  placeholder="CPF"
                  value={guest.cpf}
                  onChange={(e) => updateGuest("cpf", e.target.value)}
                  required
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
                  className="w-full bg-black text-white py-4 uppercase tracking-[0.2em] text-xs font-semibold hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  {submitting ? "Redirecionando..." : "Ir para pagamento"}
                </button>

                {resultMessage && (
                  <p
                    className={`text-sm font-medium text-center ${
                      submitError ? "text-red-500" : "text-[var(--color-success)]"
                    }`}
                  >
                    {resultMessage}
                  </p>
                )}
              </div>
            )}
          </form>
        </div>

        {isPackagesModalOpen && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
              onClick={() => setIsPackagesModalOpen(false)}
              aria-label="Fechar seleção de pacotes"
            />

            <div className="relative w-full max-w-2xl max-h-[80vh] bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-gray-800">
                  Pacotes & Adicionais
                </h4>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                  onClick={() => setIsPackagesModalOpen(false)}
                  aria-label="Fechar pacotes"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
                {loadingPackages ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={`pkg-modal-skeleton-${i}`}
                        className="h-20 bg-gray-100 animate-pulse rounded"
                      />
                    ))}
                  </div>
                ) : packages.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhum pacote disponível no momento.
                  </p>
                ) : (
                  packages.map((pkg) => {
                    const quantity = selectedPackages.get(pkg.id) ?? 0;
                    return (
                      <div
                        key={pkg.id}
                        className="border border-gray-300 rounded p-3 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-gray-900">
                              {pkg.name}
                            </h5>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              {pkg.description}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-[var(--color-primary)] whitespace-nowrap ml-2">
                            {formatBRL(pkg.price)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              togglePackage(pkg.id, Math.max(0, quantity - 1))
                            }
                            className="w-8 h-8 flex items-center justify-center text-sm font-semibold border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                            disabled={quantity === 0}
                          >
                            −
                          </button>
                          <span className="w-10 text-center text-sm font-semibold">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              togglePackage(pkg.id, Math.min(10, quantity + 1))
                            }
                            className="w-8 h-8 flex items-center justify-center text-sm font-semibold border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                          {quantity > 0 && (
                            <span className="ml-auto text-xs sm:text-sm font-semibold text-gray-600">
                              {formatBRL(pkg.price * quantity)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="text-sm text-gray-700">
                  {selectedPackagesCount > 0
                    ? `${selectedPackagesCount} item(ns) selecionado(s)`
                    : "Nenhum adicional selecionado"}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-[var(--color-primary)]">
                    + {formatBRL(packagesTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPackagesModalOpen(false)}
                    className="px-4 py-2 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
