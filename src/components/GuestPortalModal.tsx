"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  Mail,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  BedDouble,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Info,
} from "lucide-react";
import { useGuest } from "@/lib/guest-context";
import {
  lookupGuestReservation,
  fetchGuestReservations,
  cancelGuestReservation,
  rescheduleGuestReservation,
  resendGuestVoucher,
} from "@/lib/api/guest";
import { formatBRL, calcNights } from "@/lib/booking";
import {
  maskCpfOrEmail,
  maskReservationCode,
  formatDisplayReservationCode,
} from "@/lib/masks";
import type { GuestReservation } from "@/types";

export default function GuestPortalModal() {
  const { guest, token, isAuthenticated, isPortalOpen, closePortal, login, logout } = useGuest();

  const [reservationCode, setReservationCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [reservations, setReservations] = useState<GuestReservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");

  const [selectedReservation, setSelectedReservation] = useState<GuestReservation | null>(null);
  const [actionType, setActionType] = useState<"cancel" | "reschedule" | null>(null);
  const [newCheckIn, setNewCheckIn] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [voucherSendingId, setVoucherSendingId] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadReservations = useCallback(async (overrideToken?: string) => {
    const activeToken = overrideToken || token;
    if (!activeToken) return;
    setLoadingReservations(true);
    try {
      const data = await fetchGuestReservations(activeToken);
      if (Array.isArray(data)) {
        setReservations(data);
      }
    } finally {
      setLoadingReservations(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && isPortalOpen && token) {
      loadReservations();
    }
  }, [isAuthenticated, isPortalOpen, token, loadReservations]);

  useEffect(() => {
    if (!isPortalOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isPortalOpen]);

  const handleLookupReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanCode = reservationCode.trim();
    const cleanIdentifier = identifier.trim();

    if (!cleanCode) {
      setAuthError("Informe o código localizador do seu voucher.");
      return;
    }

    if (!cleanIdentifier) {
      setAuthError("Informe o CPF ou e-mail cadastrado na reserva.");
      return;
    }

    setAuthLoading(true);
    const result = await lookupGuestReservation(cleanCode, cleanIdentifier);
    setAuthLoading(false);

    if (result.ok && result.token && result.guest) {
      login(result.token, result.guest);
      if (result.reservations && result.reservations.length > 0) {
        setReservations(result.reservations);
      } else {
        await loadReservations(result.token);
      }
      setReservationCode("");
      setIdentifier("");
      setAuthError(null);
    } else {
      setAuthError(
        result.error || "Reserva não encontrada. Verifique o código e o CPF ou e-mail informados."
      );
    }
  };

  const handleConfirmCancel = async () => {
    if (!token || !selectedReservation) return;
    setActionLoading(true);
    setActionError(null);

    const identifierToCancel = selectedReservation.displayCode || selectedReservation.reservationId || String(selectedReservation.id);
    const result = await cancelGuestReservation(token, identifierToCancel);
    setActionLoading(false);

    if (result.ok) {
      setActionSuccess("Reserva cancelada com sucesso.");
      await loadReservations();
      setTimeout(() => {
        setActionType(null);
        setSelectedReservation(null);
        setActionSuccess(null);
      }, 1600);
    } else {
      setActionError(result.error || "Não foi possível cancelar a reserva no momento.");
    }
  };

  const handleConfirmReschedule = async () => {
    if (!token || !selectedReservation || !newCheckIn || !newCheckOut) {
      setActionError("Informe as novas datas de check-in e check-out.");
      return;
    }

    if (new Date(newCheckOut) <= new Date(newCheckIn)) {
      setActionError("A data de check-out deve ser posterior à data de check-in.");
      return;
    }

    const nights = calcNights(newCheckIn, newCheckOut);
    const minNights = selectedReservation.minStayNights || 1;
    if (nights < minNights) {
      setActionError(
        `Esta acomodação exige uma estadia mínima de ${minNights} ${minNights === 1 ? "noite" : "noites"}.`
      );
      return;
    }

    setActionLoading(true);
    setActionError(null);

    const identifierToReschedule = selectedReservation.displayCode || selectedReservation.reservationId || String(selectedReservation.id);
    const result = await rescheduleGuestReservation(
      token,
      identifierToReschedule,
      newCheckIn,
      newCheckOut
    );
    setActionLoading(false);

    if (result.ok) {
      setActionSuccess("Estadia remarcada com sucesso!");
      await loadReservations();
      setTimeout(() => {
        setActionType(null);
        setSelectedReservation(null);
        setActionSuccess(null);
      }, 1600);
    } else {
      setActionError(result.error || "Não foi possível remarcar a reserva.");
    }
  };

  const handleResendVoucher = async (res: GuestReservation) => {
    if (!token) return;
    const identifierToSend = res.displayCode || res.reservationId || String(res.id);
    setVoucherSendingId(res.reservationId || String(res.id));
    setVoucherSuccess(null);

    const result = await resendGuestVoucher(token, identifierToSend);
    setVoucherSendingId(null);

    if (result.ok) {
      setVoucherSuccess("Voucher enviado com sucesso para seu e-mail!");
      setTimeout(() => setVoucherSuccess(null), 4000);
    } else {
      alert(result.error || "Não foi possível reenviar o voucher no momento.");
    }
  };

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isTodayOrFuture = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.slice(0, 10).split("-").map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return false;
    const checkDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate >= today;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.slice(0, 10).split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const upcomingReservations = reservations.filter(
    (r) => r.status === "confirmed" && isTodayOrFuture(r.checkIn)
  );
  const historyReservations = reservations.filter(
    (r) => r.status === "cancelled" || !isTodayOrFuture(r.checkIn)
  );

  if (!isPortalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="concierge-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop com desfoque acolhedor */}
      <div
        onClick={closePortal}
        className="fixed inset-0 bg-[#1c1d18]/70 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Container Principal do Concierge */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#faf8f2] border border-[#e8e4d8] shadow-2xl overflow-hidden z-10 my-auto text-[#292a24] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho Elegante do Modal */}
        <header className="flex items-center justify-between border-b border-[#ece6d7] bg-[#ffffff] px-6 sm:px-8 py-5">
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#f4ece1] text-[#bd9a5f] shadow-inner">
              <Sparkles className="size-4" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#bd9a5f]">
                Pousada Viva Mar • Barra Nova
              </p>
              <h2
                id="concierge-title"
                className="font-serif text-2xl tracking-tight text-[#292a24] font-medium leading-none mt-0.5"
                style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)" }}
              >
                {isAuthenticated ? "Minhas Reservas" : "Concierge do Hóspede"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closePortal}
            aria-label="Fechar janela"
            className="flex size-8 items-center justify-center rounded-full text-[#6c6a5c] hover:bg-[#f3efe6] hover:text-[#292a24] active:scale-95 transition-all"
          >
            <X className="size-5" strokeWidth={1.6} />
          </button>
        </header>

        {/* Corpo do Modal */}
        <div className="p-6 sm:p-8 max-h-[82vh] overflow-y-auto">
          {!isAuthenticated ? (
            /* ============================================================== */
            /* TELA 1: LOGIN / LOCALIZADOR DA RESERVA COM MÁSCARAS           */
            /* ============================================================== */
            <div className="space-y-6">
              <div className="rounded-xl border border-[#e5dec9] bg-[#fbf9f4] p-4 text-xs text-[#5c6152] flex items-start gap-3.5">
                <ShieldCheck className="size-5 shrink-0 text-[#bd9a5f] mt-0.5" strokeWidth={1.8} />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#292a24]">Área Exclusiva do Titular</p>
                  <p className="leading-relaxed text-[#6c6a5c]">
                    Localize sua estadia para consultar detalhes, remarcar datas ou reenviar seu voucher de hospedagem.
                  </p>
                </div>
              </div>

              {authError && (
                <div className="rounded-xl border border-red-200/90 bg-red-50/80 p-4 text-xs text-red-900 flex items-start gap-3">
                  <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                  <p className="leading-relaxed">{authError}</p>
                </div>
              )}

              <form onSubmit={handleLookupReservation} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#5c6152]">
                      Código do Voucher
                    </label>
                    <span className="text-[10.5px] text-[#a9a596]">Enviado por e-mail</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: VIVA-13151"
                      value={reservationCode}
                      onChange={(e) => setReservationCode(maskReservationCode(e.target.value))}
                      className="w-full rounded-lg border border-[#dcd7c9] bg-white px-4 py-3 text-sm font-mono tracking-wider text-[#292a24] placeholder:text-[#b4af9e] focus:border-[#bd9a5f] focus:ring-2 focus:ring-[#bd9a5f]/20 outline-none transition-all uppercase"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#8e8a7c]">
                    Dica: digite apenas o número da sua reserva (ex: <strong>13151</strong>) que formatamos automaticamente.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#5c6152] mb-1.5">
                    CPF ou E-mail Cadastrado
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00 ou seu@email.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(maskCpfOrEmail(e.target.value))}
                    className="w-full rounded-lg border border-[#dcd7c9] bg-white px-4 py-3 text-sm text-[#292a24] placeholder:text-[#b4af9e] focus:border-[#bd9a5f] focus:ring-2 focus:ring-[#bd9a5f]/20 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#bd9a5f] hover:bg-[#a8843f] active:scale-[0.98] text-white py-3.5 px-5 font-semibold text-sm shadow-sm transition-all duration-150 disabled:opacity-60 cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Localizando voucher…
                    </>
                  ) : (
                    <>
                      <Search className="size-4" strokeWidth={2} />
                      Acessar Minha Reserva
                    </>
                  )}
                </button>
              </form>

              <div className="border-t border-[#ece6d7] pt-4 text-center text-xs text-[#6c6a5c]">
                Precisa de auxílio imediato?{" "}
                <a
                  href="https://wa.me/5522992027273"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#bd9a5f] hover:text-[#a8843f] underline underline-offset-2"
                >
                  Fale com a Recepção no WhatsApp
                </a>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* TELA 2: PAINEL AUTENTICADO DO HÓSPEDE (VOUCHER PASS)          */
            /* ============================================================== */
            <div className="space-y-6">
              
              {/* Barra de Identificação do Hóspede */}
              <div className="flex items-center justify-between border-b border-[#ece6d7] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[#f4ece1] text-[#bd9a5f] font-semibold text-xs border border-[#e8dccb]">
                    {(guest?.name || guest?.email || "H").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6c6a5c] uppercase tracking-wider">Hóspede Conectado</p>
                    <p className="text-sm font-semibold text-[#292a24] leading-tight">
                      {guest?.name || guest?.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6c6a5c] hover:text-red-700 active:scale-95 transition-colors px-2 py-1 rounded"
                >
                  <LogOut className="size-3.5" />
                  Sair
                </button>
              </div>

              {/* Mensagem de Voucher Reenviado */}
              {voucherSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900 flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{voucherSuccess}</span>
                </div>
              )}

              {/* Sub-tela: Remarcação de Datas */}
              {actionType === "reschedule" && selectedReservation ? (
                <div className="rounded-2xl border border-[#e5dec9] bg-white p-5 sm:p-6 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#ece6d7] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <CalendarDays className="size-4 text-[#bd9a5f]" />
                      <h3
                        className="font-serif text-lg font-semibold text-[#292a24]"
                        style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)" }}
                      >
                        Remarcar Estadia • {selectedReservation.roomName}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActionType(null);
                        setActionError(null);
                      }}
                      className="text-xs text-[#6c6a5c] hover:text-[#292a24] underline underline-offset-2"
                    >
                      Voltar
                    </button>
                  </div>

                  <p className="text-xs text-[#6c6a5c] leading-relaxed">
                    Selecione o novo período desejado. Nosso sistema validará a disponibilidade da acomodação para o mínimo de{" "}
                    <strong className="text-[#292a24]">{selectedReservation.minStayNights || 1} noite(s)</strong>.
                  </p>

                  {actionError && (
                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2 border border-red-200">
                      <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  {actionSuccess && (
                    <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center gap-2 border border-emerald-200">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c6152] mb-1.5">
                        Novo Check-in
                      </label>
                      <input
                        type="date"
                        required
                        value={newCheckIn}
                        onChange={(e) => setNewCheckIn(e.target.value)}
                        className="w-full rounded-lg border border-[#dcd7c9] px-3.5 py-2.5 text-sm text-[#292a24] outline-none focus:border-[#bd9a5f] focus:ring-1 focus:ring-[#bd9a5f]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c6152] mb-1.5">
                        Novo Check-out
                      </label>
                      <input
                        type="date"
                        required
                        min={newCheckIn}
                        value={newCheckOut}
                        onChange={(e) => setNewCheckOut(e.target.value)}
                        className="w-full rounded-lg border border-[#dcd7c9] px-3.5 py-2.5 text-sm text-[#292a24] outline-none focus:border-[#bd9a5f] focus:ring-1 focus:ring-[#bd9a5f]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setActionType(null)}
                      className="px-4 py-2.5 text-xs font-semibold text-[#6c6a5c] hover:bg-[#f3efe6] rounded-lg transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleConfirmReschedule}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#bd9a5f] hover:bg-[#a8843f] active:scale-[0.98] text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      Confirmar Nova Estadia
                    </button>
                  </div>
                </div>
              ) : actionType === "cancel" && selectedReservation ? (
                /* Sub-tela: Confirmação de Cancelamento Sereno */
                <div className="rounded-2xl border border-stone-300 bg-white p-5 sm:p-6 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#ece6d7] pb-3.5">
                    <h3
                      className="font-serif text-lg font-semibold text-[#292a24]"
                      style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)" }}
                    >
                      Confirmação de Cancelamento • {selectedReservation.roomName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setActionType(null);
                        setActionError(null);
                      }}
                      className="text-xs text-[#6c6a5c] hover:text-[#292a24] underline underline-offset-2"
                    >
                      Voltar
                    </button>
                  </div>

                  <div className="rounded-xl bg-[#faf8f2] border border-[#e8e4d8] p-4 text-xs text-[#5c6152] space-y-1.5 leading-relaxed">
                    <p className="font-semibold text-[#292a24]">Atenção sobre o cancelamento:</p>
                    <p>
                      Ao confirmar, a acomodação será liberada no sistema e sua reserva cancelada.
                    </p>
                    <p className="text-[#6c6a5c]">
                      Conforme a política da pousada, eventuais reembolsos ou emissão de carta de crédito para remarcação futura são combinados diretamente com a nossa recepção.
                    </p>
                  </div>

                  {actionError && (
                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2 border border-red-200">
                      <AlertCircle className="size-4 shrink-0 text-red-600" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  {actionSuccess && (
                    <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center gap-2 border border-emerald-200">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setActionType(null)}
                      className="px-5 py-2.5 text-xs font-semibold text-[#292a24] bg-[#f4ece1] hover:bg-[#ebdfce] rounded-lg transition-colors cursor-pointer"
                    >
                      Manter Minha Reserva
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleConfirmCancel}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-700 hover:bg-red-800 active:scale-[0.98] text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      Confirmar Cancelamento
                    </button>
                  </div>
                </div>
              ) : (
                /* ============================================================== */
                /* LISTAGEM DE RESERVAS: VOUCHER CARDS                            */
                /* ============================================================== */
                <>
                  {/* Navegação de Abas */}
                  <div className="flex items-center gap-2 border-b border-[#ece6d7] pb-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("upcoming")}
                      className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        activeTab === "upcoming"
                          ? "bg-[#5c6152] text-white shadow-sm"
                          : "text-[#6c6a5c] hover:text-[#292a24] hover:bg-[#f3efe6]"
                      }`}
                    >
                      Próximas Estadias ({upcomingReservations.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("history")}
                      className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        activeTab === "history"
                          ? "bg-[#5c6152] text-white shadow-sm"
                          : "text-[#6c6a5c] hover:text-[#292a24] hover:bg-[#f3efe6]"
                      }`}
                    >
                      Histórico ({historyReservations.length})
                    </button>
                  </div>

                  {loadingReservations ? (
                    <div className="py-16 text-center text-[#6c6a5c] flex flex-col items-center justify-center gap-3">
                      <Loader2 className="size-6 animate-spin text-[#bd9a5f]" />
                      <span className="text-xs uppercase tracking-wider font-medium text-[#8e8a7c]">
                        Carregando suas estadias…
                      </span>
                    </div>
                  ) : activeTab === "upcoming" ? (
                    upcomingReservations.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#6c6a5c] bg-white rounded-2xl border border-[#e5dec9] p-8 space-y-2">
                        <BedDouble className="size-6 text-[#bd9a5f] mx-auto opacity-70" strokeWidth={1.5} />
                        <p className="font-semibold text-sm text-[#292a24]">Nenhuma reserva futura ativa</p>
                        <p className="text-[#8e8a7c]">Você não possui nenhuma estadia futura confirmada no momento.</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {upcomingReservations.map((res) => {
                          const codeFormatted = formatDisplayReservationCode(
                            res.displayCode,
                            res.reservationId,
                            res.id
                          );
                          const isCopied = copiedCode === codeFormatted;

                          return (
                            <article
                              key={res.id || res.reservationId}
                              className="rounded-2xl border border-[#e5dec9] bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                            >
                              {/* Topo do Voucher */}
                              <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#bd9a5f]">
                                      VOUCHER OFICIAL
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f6f0] border border-[#e1e5d8] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#454a3a]">
                                      <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                      Confirmada
                                    </span>
                                  </div>

                                  <h4
                                    className="font-serif text-2xl font-semibold text-[#292a24] tracking-tight"
                                    style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)" }}
                                  >
                                    {res.roomName}
                                  </h4>
                                </div>

                                {/* Pílula do Código do Voucher com Cópia Rápida */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(codeFormatted)}
                                  title="Clique para copiar o código"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2dcce] bg-[#fbf9f4] px-3 py-1.5 text-xs font-mono font-bold text-[#292a24] hover:bg-[#f4ece1] hover:border-[#bd9a5f] active:scale-95 transition-all cursor-pointer"
                                >
                                  <span>{codeFormatted}</span>
                                  {isCopied ? (
                                    <Check className="size-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="size-3.5 text-[#8e8a7c]" />
                                  )}
                                </button>
                              </div>

                              {/* Picote estilizado de voucher de hotel */}
                              <div className="border-t border-dashed border-[#e5dec9] my-3.5" />

                              {/* Grade de Informações da Estadia */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-1 text-xs">
                                <div>
                                  <span className="text-[#8e8a7c] block text-[11px] uppercase tracking-wider">
                                    Check-in
                                  </span>
                                  <span className="font-semibold text-sm text-[#292a24] block mt-0.5">
                                    {formatDate(res.checkIn)}
                                  </span>
                                  <span className="text-[10px] text-[#a9a596]">A partir das 14h</span>
                                </div>

                                <div>
                                  <span className="text-[#8e8a7c] block text-[11px] uppercase tracking-wider">
                                    Check-out
                                  </span>
                                  <span className="font-semibold text-sm text-[#292a24] block mt-0.5">
                                    {formatDate(res.checkOut)}
                                  </span>
                                  <span className="text-[10px] text-[#a9a596]">Até as 12h</span>
                                </div>

                                <div>
                                  <span className="text-[#8e8a7c] block text-[11px] uppercase tracking-wider">
                                    Duração
                                  </span>
                                  <span className="font-semibold text-sm text-[#292a24] block mt-0.5">
                                    {calcNights(res.checkIn, res.checkOut)}{" "}
                                    {calcNights(res.checkIn, res.checkOut) === 1 ? "noite" : "noites"}
                                  </span>
                                  <span className="text-[10px] text-[#a9a596]">Barra Nova</span>
                                </div>

                                <div>
                                  <span className="text-[#8e8a7c] block text-[11px] uppercase tracking-wider">
                                    Total Pago
                                  </span>
                                  <span className="font-semibold text-sm text-[#bd9a5f] block mt-0.5">
                                    {formatBRL(res.amount)}
                                  </span>
                                  <span className="text-[10px] text-emerald-700">100% quitado</span>
                                </div>
                              </div>

                              {/* Barra de Ações do Voucher */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#ece6d7] mt-3">
                                <button
                                  type="button"
                                  disabled={voucherSendingId === (res.reservationId || String(res.id))}
                                  onClick={() => handleResendVoucher(res)}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#bd9a5f] hover:text-[#a8843f] active:scale-95 transition-all cursor-pointer"
                                >
                                  {voucherSendingId === (res.reservationId || String(res.id)) ? (
                                    <>
                                      <Loader2 className="size-3.5 animate-spin" />
                                      Enviando por e-mail…
                                    </>
                                  ) : (
                                    <>
                                      <Mail className="size-3.5" />
                                      Reenviar Voucher por E-mail
                                    </>
                                  )}
                                </button>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedReservation(res);
                                      setNewCheckIn(res.checkIn.slice(0, 10));
                                      setNewCheckOut(res.checkOut.slice(0, 10));
                                      setActionType("reschedule");
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcd7c9] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#292a24] hover:bg-[#faf8f2] active:scale-95 transition-all cursor-pointer"
                                  >
                                    <Calendar className="size-3.5 text-[#5c6152]" />
                                    Remarcar
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedReservation(res);
                                      setActionType("cancel");
                                    }}
                                    className="text-xs font-medium text-stone-500 hover:text-red-700 px-2 py-1.5 transition-colors cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )
                  ) : historyReservations.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#6c6a5c] bg-white rounded-2xl border border-[#e5dec9] p-8 space-y-2">
                      <Clock className="size-6 text-[#bd9a5f] mx-auto opacity-70" strokeWidth={1.5} />
                      <p className="font-semibold text-sm text-[#292a24]">Nenhuma estadia anterior</p>
                      <p className="text-[#8e8a7c]">Seu histórico de estadias passadas ou canceladas aparecerá aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historyReservations.map((res) => {
                        const codeFormatted = formatDisplayReservationCode(
                          res.displayCode,
                          res.reservationId,
                          res.id
                        );

                        return (
                          <div
                            key={res.id || res.reservationId}
                            className="rounded-xl border border-[#e5dec9] bg-white/75 p-4 sm:p-5 space-y-2 opacity-90"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-[#6c6a5c]">
                                {codeFormatted}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  res.status === "cancelled"
                                    ? "bg-stone-200 text-stone-700"
                                    : "bg-[#f4ece1] text-[#bd9a5f]"
                                }`}
                              >
                                {res.status === "cancelled" ? "Cancelada" : "Concluída"}
                              </span>
                            </div>

                            <div
                              className="font-serif text-lg font-semibold text-[#292a24]"
                              style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)" }}
                            >
                              {res.roomName}
                            </div>

                            <div className="text-xs text-[#6c6a5c] flex items-center gap-3">
                              <span>
                                {formatDate(res.checkIn)} a {formatDate(res.checkOut)}
                              </span>
                              <span>•</span>
                              <span className="font-medium text-[#292a24]">{formatBRL(res.amount)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
