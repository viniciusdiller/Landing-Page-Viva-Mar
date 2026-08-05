"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Payment } from "@mercadopago/sdk-react";
import {
  X,
  Loader2,
  Calendar,
  AlertCircle,
  Gift,
  Copy,
  Check,
} from "lucide-react";
import { formatBRL, calcNights } from "@/lib/booking";
import { fetchPackages, calculatePackagesTotal } from "@/lib/api/packages";
import {
  processPayment,
  getPaymentStatus,
  createCheckoutPreference,
} from "@/lib/api/checkout";
import { ensureMercadoPagoInitialized } from "@/lib/mercadopago-client";
import { fetchAddressByCep } from "@/lib/api/cep";
import RoomPhotoCarousel from "@/components/RoomPhotoCarousel";
import { maskCPF, maskCEP, maskPhone } from "@/lib/masks";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";

import type {
  CheckoutSessionRequest,
  GuestData,
  RoomType,
  Package,
  SelectedPackage,
} from "@/types";

const PIX_POLL_INTERVAL_MS = 4000;

interface PixPayment {
  paymentId: number;
  externalReference: string;
  qrCode: string;
  qrCodeBase64: string;
}

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
  cep: "",
  address: "",
  addressNumber: "",
  addressComplement: "",
  neighborhood: "",
  city: "",
  state: "",
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
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null);
  const [pixStatus, setPixStatus] = useState<string | null>(null);
  const [copiedPixCode, setCopiedPixCode] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  // Controla só se já TENTAMOS criar a preferência (sucesso ou falha) — usado
  // pra não deixar o Brick preso pra sempre em "carregando" se essa chamada
  // falhar ou demorar: cartão e Pix não podem depender da carteira Mercado
  // Pago, que é só um extra opcional.
  const [preferenceAttempted, setPreferenceAttempted] = useState(false);
  // Depois que já desistimos de esperar (timeout) e renderizamos o Brick
  // sem carteira Mercado Pago, uma resposta atrasada da preferência não pode
  // mais ser aplicada — trocar o preferenceId nesse ponto remontaria o
  // Brick já em uso e reproduziria o bug do painel duplicado.
  const preferenceGivenUpRef = useRef(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setResultMessage("");
      setSubmitError(false);
      setGuestsCount(bookingContext.guests);
      setCheckIn(bookingContext.checkIn);
      setCheckOut(bookingContext.checkOut);
      setPixPayment(null);
      setPixStatus(null);
      ensureMercadoPagoInitialized();
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

  // Enquanto tiver um Pix pendente, consulta o status periodicamente e
  // redireciona pra tela de sucesso assim que o pagamento for aprovado
  // (o webhook confirma a reserva de forma independente, isso aqui é só
  // feedback visual pro hóspede).
  useEffect(() => {
    if (!pixPayment) return;

    const interval = setInterval(async () => {
      try {
        const status = await getPaymentStatus(
          pixPayment.paymentId,
          pixPayment.externalReference,
        );
        setPixStatus(status);
        if (status === "approved") {
          clearInterval(interval);
          window.location.href = "/reserva/sucesso";
        } else if (status === "rejected" || status === "cancelled") {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Erro ao consultar status do Pix:", error);
      }
    }, PIX_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pixPayment]);

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

  const todayISO = new Date().toISOString().split("T")[0];
  const hasDates = Boolean(checkIn && checkOut) && !hasDateError;
  const exceedsCapacity = room ? guestsCount > room.capacity : false;
  const isFull = room ? (room as any).remainingQuantity <= 0 : false;
  // minStayNights e minStayDays representam o mesmo tipo de mínimo (em
  // noites) por dois caminhos diferentes no SaaS — o maior dos dois é o que
  // vale. Validar isso aqui, antes do pagamento, evita cobrar o hóspede por
  // uma estadia que o backend vai recusar quando a reserva for confirmada
  // (o pagamento já aprovado não seria estornado automaticamente).
  const minimumStayNights = room
    ? Math.max(room.minStayNights ?? 0, room.minStayDays ?? 0)
    : 0;
  const meetsMinimumStay = minimumStayNights <= 0 || nights >= minimumStayNights;
  const guestFieldsComplete = Boolean(
    guest.firstName.trim() &&
      guest.lastName.trim() &&
      guest.email.trim() &&
      guest.phone.trim() &&
      guest.cpf?.trim(),
  );

  // Cria (ou renova, se o valor/dados mudarem) uma preferência do Mercado
  // Pago assim que os dados essenciais pra pagar estiverem prontos — só pra
  // liberar a opção de carteira "Mercado Pago" no Payment Brick, que exige
  // um preferenceId. Cartão e Pix não dependem disso.
  useEffect(() => {
    if (
      !room ||
      !guestFieldsComplete ||
      !hasDates ||
      exceedsCapacity ||
      isFull ||
      !meetsMinimumStay
    ) {
      setPreferenceId(null);
      setPreferenceAttempted(false);
      preferenceGivenUpRef.current = false;
      return;
    }

    let cancelled = false;
    setPreferenceId(null);
    setPreferenceAttempted(false);
    preferenceGivenUpRef.current = false;

    const checkoutRequest = buildCheckoutRequest();
    if (!checkoutRequest) return;

    // Se a criação da preferência travar (rede lenta, servidor fora do ar),
    // desiste depois de alguns segundos em vez de deixar o cliente esperando
    // pra sempre pra conseguir pagar com cartão ou Pix.
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      preferenceGivenUpRef.current = true;
      setPreferenceAttempted(true);
    }, 6000);

    createCheckoutPreference(checkoutRequest)
      .then((id) => {
        if (cancelled || preferenceGivenUpRef.current) return;
        clearTimeout(timeoutId);
        setPreferenceId(id);
        setPreferenceAttempted(true);
      })
      .catch((error) => {
        console.error("Erro ao criar preferência do Mercado Pago:", error);
        if (cancelled || preferenceGivenUpRef.current) return;
        clearTimeout(timeoutId);
        setPreferenceAttempted(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    room?.id,
    guestFieldsComplete,
    hasDates,
    exceedsCapacity,
    isFull,
    meetsMinimumStay,
    total,
    guest.email,
    checkIn,
    checkOut,
  ]);

  if (!open || !room) return null;

  function updateGuest<K extends keyof GuestData>(key: K, value: GuestData[K]) {
    setGuest((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCepChange(rawValue: string) {
    const masked = maskCEP(rawValue);
    updateGuest("cep", masked);

    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const found = await fetchAddressByCep(digits);
      if (found) {
        setGuest((prev) => ({
          ...prev,
          address: found.address || prev.address,
          neighborhood: found.neighborhood || prev.neighborhood,
          city: found.city || prev.city,
          state: found.state || prev.state,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar endereço pelo CEP:", error);
    } finally {
      setCepLoading(false);
    }
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

  function buildCheckoutRequest(): CheckoutSessionRequest | null {
    if (!room) return null;

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

    return {
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
  }

  // Callback do Payment Brick: já recebe o cartão tokenizado (ou os dados do
  // Pix) prontos pra mandar pro Mercado Pago — nenhum dado de cartão passa
  // pelo nosso servidor em texto puro.
  async function handlePaymentSubmit(param: { formData: unknown }) {
    const checkoutRequest = buildCheckoutRequest();
    if (!checkoutRequest) return;

    const formData = param.formData as Record<string, unknown>;
    // Fingerprint que o SDK do Mercado Pago coleta sozinho no navegador
    // assim que carrega — sem mandar isso pro backend, a análise de risco
    // do Mercado Pago fica sem sinal nenhum do dispositivo e tende a
    // restringir os meios de pagamento (na prática, só libera Pix).
    const deviceId = (window as any).MP_DEVICE_SESSION_ID as string | undefined;

    setResultMessage("");
    setSubmitError(false);

    try {
      const result = await processPayment(formData, checkoutRequest, deviceId);

      if (result.status === "approved") {
        window.location.href = "/reserva/sucesso";
        return;
      }

      if (result.qrCode && result.qrCodeBase64) {
        // Pix: mostra o QR code aqui mesmo, sem sair da página.
        setPixPayment({
          paymentId: result.paymentId,
          externalReference: result.externalReference,
          qrCode: result.qrCode,
          qrCodeBase64: result.qrCodeBase64,
        });
        return;
      }

      if (result.status === "pending" || result.status === "in_process") {
        window.location.href = "/reserva/pendente";
        return;
      }

      setResultMessage(
        "Pagamento não aprovado. Verifique os dados do cartão ou escolha outra forma de pagamento.",
      );
      setSubmitError(true);
    } catch (error) {
      setResultMessage(
        error instanceof Error
          ? error.message
          : "Falha ao processar o pagamento. Tente novamente.",
      );
      setSubmitError(true);
      // Deixa o Brick também mostrar seu próprio estado de erro/retry.
      throw error;
    }
  }

  function copyPixCode() {
    if (!pixPayment) return;
    navigator.clipboard.writeText(pixPayment.qrCode).then(() => {
      setCopiedPixCode(true);
      setTimeout(() => setCopiedPixCode(false), 2000);
    });
  }

  const inputClassName =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-[15px] text-gray-900 outline-none transition-colors focus:border-black placeholder:text-gray-400";

  const roomThumb = room.images[0];

  return (
    <div className="checkout-page fixed inset-0 z-[60] bg-white overflow-y-auto">
      {/* Cabeçalho */}
      <header className="border-b border-gray-100">
        <div className="max-w-[1180px] mx-auto flex items-center justify-between px-6 lg:px-10 py-6">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-900 uppercase hover:opacity-70 transition-opacity"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
            aria-label="Voltar para o site principal"
          >
            Viva Mar
          </button>
          <button
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors rounded-full"
            onClick={onClose}
            aria-label="Fechar checkout"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Corpo - 2 colunas, igual a um checkout de e-commerce */}
      <div className="max-w-[1180px] mx-auto lg:flex lg:items-start">
        {/* Coluna principal - Contato, Estadia, Pagamento */}
        <div className="flex-1 px-6 lg:px-10 py-10 lg:max-w-[680px]">
          {/* Contato */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-5">Contato</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className={`${inputClassName} sm:col-span-2`}
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
                onChange={(e) => updateGuest("phone", maskPhone(e.target.value))}
                inputMode="tel"
                required
              />
              <input
                className={inputClassName}
                placeholder="CPF"
                value={guest.cpf}
                onChange={(e) => updateGuest("cpf", maskCPF(e.target.value))}
                inputMode="numeric"
                required
              />

              <div className="relative sm:col-span-2">
                <input
                  className={inputClassName}
                  placeholder="CEP"
                  value={guest.cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  inputMode="numeric"
                />
                {cepLoading && (
                  <Loader2
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
                  />
                )}
              </div>

              <input
                className={`${inputClassName} sm:col-span-2`}
                placeholder="Endereço"
                value={guest.address}
                onChange={(e) => updateGuest("address", e.target.value)}
              />
              <input
                className={inputClassName}
                placeholder="Número"
                value={guest.addressNumber}
                onChange={(e) => updateGuest("addressNumber", e.target.value)}
              />
              <input
                className={inputClassName}
                placeholder="Complemento (opcional)"
                value={guest.addressComplement}
                onChange={(e) => updateGuest("addressComplement", e.target.value)}
              />
              <input
                className={inputClassName}
                placeholder="Bairro"
                value={guest.neighborhood}
                onChange={(e) => updateGuest("neighborhood", e.target.value)}
              />
              <input
                className={inputClassName}
                placeholder="Cidade"
                value={guest.city}
                onChange={(e) => updateGuest("city", e.target.value)}
              />
              <select
                className={`${inputClassName} sm:col-span-2 text-gray-900`}
                value={guest.state}
                onChange={(e) => updateGuest("state", e.target.value)}
              >
                <option value="">Estado</option>
                {BRAZILIAN_STATES.map((state) => (
                  <option key={state.uf} value={state.uf}>
                    {state.name}
                  </option>
                ))}
              </select>

              <textarea
                className={`${inputClassName} sm:col-span-2 min-h-[80px] resize-none`}
                placeholder="Pedidos especiais (opcional)"
                value={guest.specialRequests}
                onChange={(e) => updateGuest("specialRequests", e.target.value)}
              />
            </div>
          </section>

          {/* Detalhes da estadia (equivalente a "Entrega" num checkout de loja) */}
          <section className="mt-10 pt-10 border-t border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">
              Detalhes da estadia
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="block">
                <span className="text-xs text-gray-500">Check-in</span>
                <input
                  type="date"
                  min={todayISO}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className={`${inputClassName} mt-1 cursor-pointer`}
                  aria-invalid={hasDateError}
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Check-out</span>
                <input
                  type="date"
                  min={checkIn || todayISO}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={`${inputClassName} mt-1 cursor-pointer ${
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
                  onClick={() =>
                    setGuestsCount((current) => Math.max(1, current - 1))
                  }
                  className="w-9 h-9 flex items-center justify-center text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40"
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
                  className="w-9 h-9 flex items-center justify-center text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40"
                  disabled={room ? guestsCount >= room.capacity : false}
                  aria-label="Aumentar número de hóspedes"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">
                hóspede(s){room ? ` · máx. ${room.capacity}` : ""}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPackagesModalOpen(true)}
              className={`${inputClassName} flex items-center justify-between hover:bg-gray-50 transition-colors mb-2`}
            >
              <span className="flex items-center gap-2 text-gray-700">
                <Gift size={16} />
                {selectedPackagesCount > 0
                  ? `${selectedPackagesCount} adicional(is) selecionado(s)`
                  : "Selecionar pacotes e adicionais"}
              </span>
              <span className="text-sm font-semibold text-[var(--color-primary)]">
                {selectedPackagesCount > 0 ? `+ ${formatBRL(packagesTotal)}` : "Abrir"}
              </span>
            </button>
            {loadingPackages && (
              <p className="text-xs text-gray-500">Carregando pacotes...</p>
            )}

            {!checkIn || !checkOut ? (
              <div className="mt-4 bg-amber-50/60 border border-amber-100 p-4 rounded-lg flex items-start gap-3">
                <Calendar className="text-amber-600 mt-0.5" size={18} strokeWidth={1.5} />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Selecione as datas de <strong>check-in</strong> e{" "}
                  <strong>check-out</strong> para continuar.
                </p>
              </div>
            ) : !meetsMinimumStay ? (
              <div className="mt-4 bg-red-50/60 border border-red-100 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5" size={18} strokeWidth={1.5} />
                <p className="text-xs text-red-800 leading-relaxed">
                  Este quarto exige uma estadia mínima de {minimumStayNights}{" "}
                  {minimumStayNights === 1 ? "noite" : "noites"}. Ajuste as datas de
                  check-in/check-out para continuar.
                </p>
              </div>
            ) : exceedsCapacity ? (
              <div className="mt-4 bg-red-50/60 border border-red-100 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5" size={18} strokeWidth={1.5} />
                <p className="text-xs text-red-800 leading-relaxed">
                  Este quarto acomoda até {room.capacity} hóspedes. Ajuste o número
                  de pessoas ou escolha outra acomodação.
                </p>
              </div>
            ) : (
              hasDates && (
                <p className="mt-4 text-xs text-gray-500">
                  {formatDateBR(checkIn)} até {formatDateBR(checkOut)} ·{" "}
                  {nights} {nights === 1 ? "noite" : "noites"}
                </p>
              )
            )}
          </section>

          {/* Pagamento */}
          <section className="mt-10 pt-10 border-t border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Pagamento</h2>
            <p className="text-sm text-gray-500 mb-6">
              Todas as transações são seguras e criptografadas.
            </p>

            {hasDates && !exceedsCapacity && !isFull && meetsMinimumStay ? (
              <>
                {pixPayment ? (
                  <div className="border border-gray-200 rounded-lg p-6 text-center space-y-4">
                    <p className="text-xs uppercase tracking-widest font-semibold text-gray-500">
                      Pague com Pix
                    </p>
                    <img
                      src={`data:image/png;base64,${pixPayment.qrCodeBase64}`}
                      alt="QR Code Pix"
                      className="mx-auto w-48 h-48"
                    />
                    <button
                      type="button"
                      onClick={copyPixCode}
                      className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 text-xs font-semibold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {copiedPixCode ? <Check size={14} /> : <Copy size={14} />}
                      {copiedPixCode ? "Código copiado!" : "Copiar código Pix"}
                    </button>
                    <p className="text-xs text-gray-500">
                      {pixStatus === "rejected" || pixStatus === "cancelled"
                        ? "Este Pix não foi pago a tempo. Feche e tente novamente."
                        : "Aguardando pagamento... Assim que for identificado, sua reserva é confirmada automaticamente."}
                    </p>
                  </div>
                ) : guestFieldsComplete && preferenceAttempted ? (
                  <Payment
                    key={`${total}-${preferenceId ?? "no-wallet"}`}
                    initialization={{
                      amount: total,
                      payer: { email: guest.email },
                      ...(preferenceId ? { preferenceId } : {}),
                    }}
                    customization={{
                      paymentMethods: {
                        creditCard: "all",
                        debitCard: "all",
                        bankTransfer: "all",
                        maxInstallments: 12,
                        ...(preferenceId ? { mercadoPago: "all" } : {}),
                      },
                    }}
                    onSubmit={handlePaymentSubmit}
                    onError={(error) => {
                      console.error("Erro no Payment Brick:", error);
                    }}
                  />
                ) : guestFieldsComplete ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    Preparando formas de pagamento...
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 uppercase tracking-wider text-center py-6 border border-dashed border-gray-300 rounded-lg">
                    Preencha seus dados de contato acima para escolher a forma de
                    pagamento.
                  </p>
                )}

                {resultMessage && (
                  <p
                    className={`mt-4 text-sm font-medium text-center ${
                      submitError ? "text-red-500" : "text-[var(--color-success)]"
                    }`}
                  >
                    {resultMessage}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400 uppercase tracking-wider text-center py-6 border border-dashed border-gray-200 rounded-lg">
                Finalize os detalhes da estadia acima para ver as formas de
                pagamento.
              </p>
            )}
          </section>
        </div>

        {/* Barra lateral - Resumo do pedido */}
        <aside className="lg:w-[380px] xl:w-[420px] lg:sticky lg:top-0 bg-gray-50 px-6 lg:px-8 py-10 lg:border-l border-gray-100 lg:min-h-screen">
          <div className="flex gap-4 pb-6">
            {roomThumb ? (
              <div className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 shrink-0">
                <RoomPhotoCarousel
                  images={room.images}
                  alt={room.name}
                  sizeClassName="h-full"
                  className="h-full"
                  showInlineControls={false}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-md bg-gray-200 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{room.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {nights} {nights === 1 ? "noite" : "noites"} · {guestsCount}{" "}
                {guestsCount === 1 ? "hóspede" : "hóspedes"}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
              {formatBRL(subtotal)}
            </p>
          </div>

          {Array.from(selectedPackages.entries()).map(([id, quantity]) => {
            const pkg = packages.find((p) => p.id === id);
            if (!pkg) return null;
            return (
              <div key={id} className="flex gap-4 pb-4">
                <div className="w-16 h-16 rounded-md bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                  <Gift size={20} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{pkg.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Qtd. {quantity}</p>
                </div>
                <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                  {formatBRL(pkg.price * quantity)}
                </p>
              </div>
            );
          })}

          {/* Cupom */}
          <div className="flex w-full bg-white border border-gray-300 rounded-lg focus-within:border-black transition-colors overflow-hidden mb-6">
            <input
              className="flex-1 bg-transparent border-0 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-0 placeholder:text-gray-400 uppercase disabled:opacity-50"
              placeholder="Cupom promocional"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              disabled={appliedCoupon !== undefined || isApplyingCoupon}
            />
            <button
              type="button"
              className="px-5 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[90px]"
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
              className={`-mt-4 mb-6 text-xs font-medium ${
                appliedCoupon ? "text-[var(--color-success)]" : "text-red-500"
              }`}
            >
              {couponMessage}
            </p>
          )}

          <div className="border-t border-gray-200 pt-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatBRL(subtotal + packagesTotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[var(--color-success)]">
                <span>Desconto</span>
                <span>- {formatBRL(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-gray-200">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-lg font-semibold text-gray-900">
                <span className="text-xs font-normal text-gray-400 mr-1.5 align-middle">
                  BRL
                </span>
                {formatBRL(total)}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {isPackagesModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
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
  );
}
