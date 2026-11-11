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
  Ban,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  ChevronRight,
  RotateCcw,
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
import { maskCpfOrEmail } from "@/lib/masks";
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
      setAuthError("Informe o código localizador da sua reserva.");
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

    const result = await cancelGuestReservation(token, selectedReservation.reservationId || selectedReservation.id);
    setActionLoading(false);

    if (result.ok) {
      setActionSuccess("Reserva cancelada com sucesso.");
      await loadReservations();
      setTimeout(() => {
        setActionType(null);
        setSelectedReservation(null);
        setActionSuccess(null);
      }, 1500);
    } else {
      setActionError(result.error || "Não foi possível cancelar a reserva.");
    }
  };

  const handleConfirmReschedule = async () => {
    if (!token || !selectedReservation || !newCheckIn || !newCheckOut) {
      setActionError("Informe as novas datas de check-in e check-out.");
      return;
    }

    if (new Date(newCheckOut) <= new Date(newCheckIn)) {
      setActionError("A data de check-out deve ser posterior ao check-in.");
      return;
    }

    const nights = calcNights(newCheckIn, newCheckOut);
    const minNights = selectedReservation.minStayNights || 1;
    if (nights < minNights) {
      setActionError(
        `Esta acomodação exige um mínimo de ${minNights} ${minNights === 1 ? "noite" : "noites"}.`
      );
      return;
    }

    setActionLoading(true);
    setActionError(null);

    const result = await rescheduleGuestReservation(
      token,
      selectedReservation.reservationId || selectedReservation.id,
      newCheckIn,
      newCheckOut
    );
    setActionLoading(false);

    if (result.ok) {
      setActionSuccess("Reserva remarcada com sucesso!");
      await loadReservations();
      setTimeout(() => {
        setActionType(null);
        setSelectedReservation(null);
        setActionSuccess(null);
      }, 1500);
    } else {
      setActionError(result.error || "Não foi possível remarcar a reserva.");
    }
  };

  const handleResendVoucher = async (res: GuestReservation) => {
    if (!token) return;
    setVoucherSendingId(res.reservationId);
    setVoucherSuccess(null);

    const result = await resendGuestVoucher(token, res.reservationId);
    setVoucherSendingId(null);

    if (result.ok) {
      setVoucherSuccess("Voucher reenviado com sucesso para seu e-mail!");
      setTimeout(() => setVoucherSuccess(null), 4000);
    } else {
      alert(result.error || "Não foi possível reenviar o voucher no momento.");
    }
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
      aria-labelledby="guest-portal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={closePortal}
        className="fixed inset-0 bg-[#292a24]/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#faf8f2] border border-[#e6e8dc] shadow-2xl overflow-hidden z-10 my-auto text-[#292a24]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6e8dc] bg-[#ffffff] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#f1e6cf] text-[#a8843f]">
              <User className="size-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#a8843f]">
                Pousada Viva Mar
              </p>
              <h2
                id="guest-portal-title"
                className="font-serif text-xl font-semibold text-[#494d40] leading-tight"
                style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)" }}
              >
                {isAuthenticated ? "Minha Conta • Reservas" : "Área do Hóspede"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closePortal}
            aria-label="Fechar"
            className="flex size-8 items-center justify-center rounded-full text-[#6c6a5c] hover:bg-[#f3efe6] hover:text-[#292a24] transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!isAuthenticated ? (
            /* Login / Consulta Direta */
            <div className="space-y-6">
              <div className="rounded-xl border border-[#e6e8dc] bg-[#f4f5f0] p-4 text-xs text-[#5c6152] flex items-start gap-3">
                <ShieldCheck className="size-5 shrink-0 text-[#a8843f] mt-0.5" />
                <div>
                  <p className="font-semibold text-[#494d40] mb-0.5">Acesso Seguro do Titular</p>
                  <p className="leading-relaxed">
                    Informe o código localizador recebido no e-mail de confirmação e seu CPF ou e-mail cadastrado.
                  </p>
                </div>
              </div>

              {authError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-3">
                  <AlertCircle className="size-5 shrink-0 text-red-600" />
                  <p>{authError}</p>
                </div>
              )}

              <form onSubmit={handleLookupReservation} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6c6a5c] mb-1.5">
                    Código Localizador da Reserva
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: mp_123456789 ou manual_123"
                    value={reservationCode}
                    onChange={(e) => setReservationCode(e.target.value)}
                    className="w-full rounded-lg border border-[#ccd0bc] bg-white px-3.5 py-2.5 text-sm font-mono text-[#292a24] placeholder:text-[#a9a596] focus:border-[#bd9a5f] focus:ring-1 focus:ring-[#bd9a5f] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6c6a5c] mb-1.5">
                    CPF ou E-mail do Titular
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00 ou seu@email.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(maskCpfOrEmail(e.target.value))}
                    className="w-full rounded-lg border border-[#ccd0bc] bg-white px-3.5 py-2.5 text-sm text-[#292a24] placeholder:text-[#a9a596] focus:border-[#bd9a5f] focus:ring-1 focus:ring-[#bd9a5f] outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#bd9a5f] hover:bg-[#a8843f] text-white py-3 px-4 font-semibold text-sm shadow-sm transition-colors disabled:opacity-60"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Consultando reserva…
                    </>
                  ) : (
                    <>
                      <Search className="size-4" />
                      Consultar Reserva
                    </>
                  )}
                </button>
              </form>

              <div className="border-t border-[#e6e8dc] pt-4 text-center text-xs text-[#6c6a5c]">
                Dúvidas sobre sua estadia?{" "}
                <a
                  href="https://wa.me/5522992027273"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#a8843f] hover:underline"
                >
                  Fale com nossa recepção no WhatsApp
                </a>
              </div>
            </div>
          ) : (
            /* Painel Autenticado */
            <div className="space-y-6">
              {/* Top Guest Bar */}
              <div className="flex items-center justify-between border-b border-[#e6e8dc] pb-4">
                <div>
                  <p className="text-xs text-[#6c6a5c]">Hóspede conectado:</p>
                  <p className="text-sm font-semibold text-[#494d40]">
                    {guest?.name || guest?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6c6a5c] hover:text-red-700 transition-colors"
                >
                  <LogOut className="size-3.5" />
                  Sair
                </button>
              </div>

              {voucherSuccess && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-900 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-700 shrink-0" />
                  <span>{voucherSuccess}</span>
                </div>
              )}

              {/* Sub-telas de Ação: Remarcar ou Cancelar */}
              {actionType === "reschedule" && selectedReservation ? (
                <div className="rounded-2xl border border-[#e6e8dc] bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e6e8dc] pb-3">
                    <h3 className="font-semibold text-[#494d40] text-sm flex items-center gap-2">
                      <Calendar className="size-4 text-[#a8843f]" />
                      Remarcar Estadia • {selectedReservation.roomName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setActionType(null);
                        setActionError(null);
                      }}
                      className="text-xs text-[#6c6a5c] hover:underline"
                    >
                      Voltar
                    </button>
                  </div>

                  <p className="text-xs text-[#6c6a5c] leading-relaxed">
                    Escolha as novas datas de estadia. A disponibilidade e estadia mínima de{" "}
                    <strong>{selectedReservation.minStayNights || 1} noite(s)</strong> serão verificadas pelo sistema.
                  </p>

                  {actionError && (
                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0 text-red-600" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  {actionSuccess && (
                    <div className="rounded-lg bg-green-50 p-3 text-xs text-green-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#6c6a5c] mb-1">
                        Novo Check-in
                      </label>
                      <input
                        type="date"
                        required
                        value={newCheckIn}
                        onChange={(e) => setNewCheckIn(e.target.value)}
                        className="w-full rounded-md border border-[#ccd0bc] px-3 py-2 text-sm text-[#292a24] outline-none focus:border-[#bd9a5f]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#6c6a5c] mb-1">
                        Novo Check-out
                      </label>
                      <input
                        type="date"
                        required
                        min={newCheckIn}
                        value={newCheckOut}
                        onChange={(e) => setNewCheckOut(e.target.value)}
                        className="w-full rounded-md border border-[#ccd0bc] px-3 py-2 text-sm text-[#292a24] outline-none focus:border-[#bd9a5f]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setActionType(null)}
                      className="px-4 py-2 text-xs font-semibold text-[#6c6a5c] hover:bg-[#f3efe6] rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleConfirmReschedule}
                      className="inline-flex items-center gap-2 rounded-md bg-[#bd9a5f] hover:bg-[#a8843f] text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      Confirmar Remarcação
                    </button>
                  </div>
                </div>
              ) : actionType === "cancel" && selectedReservation ? (
                <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-red-200/60 pb-3">
                    <h3 className="font-semibold text-red-900 text-sm flex items-center gap-2">
                      <Ban className="size-4 text-red-700" />
                      Confirmar Cancelamento • {selectedReservation.roomName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setActionType(null);
                        setActionError(null);
                      }}
                      className="text-xs text-[#6c6a5c] hover:underline"
                    >
                      Voltar
                    </button>
                  </div>

                  <p className="text-xs text-red-900 leading-relaxed">
                    A reserva será cancelada e a acomodação liberada no sistema.
                    <strong> Atenção:</strong> Condições de reembolso ou estorno não são automáticas e devem ser combinadas diretamente com a recepção da pousada.
                  </p>

                  {actionError && (
                    <div className="rounded-lg bg-red-100 p-3 text-xs text-red-800 flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0 text-red-600" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  {actionSuccess && (
                    <div className="rounded-lg bg-green-100 p-3 text-xs text-green-900 flex items-center gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setActionType(null)}
                      className="px-4 py-2 text-xs font-semibold text-[#6c6a5c] hover:bg-white rounded-md transition-colors"
                    >
                      Manter Reserva
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleConfirmCancel}
                      className="inline-flex items-center gap-2 rounded-md bg-red-700 hover:bg-red-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      Confirmar Cancelamento
                    </button>
                  </div>
                </div>
              ) : (
                /* Lista Normal com Abas */
                <>
                  {/* Tabs */}
                  <div className="flex items-center gap-2 border-b border-[#e6e8dc]">
                    <button
                      type="button"
                      onClick={() => setActiveTab("upcoming")}
                      className={`pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
                        activeTab === "upcoming"
                          ? "text-[#a8843f]"
                          : "text-[#6c6a5c] hover:text-[#292a24]"
                      }`}
                    >
                      Próximas Reservas ({upcomingReservations.length})
                      {activeTab === "upcoming" && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#a8843f]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("history")}
                      className={`pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
                        activeTab === "history"
                          ? "text-[#a8843f]"
                          : "text-[#6c6a5c] hover:text-[#292a24]"
                      }`}
                    >
                      Histórico ({historyReservations.length})
                      {activeTab === "history" && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#a8843f]" />
                      )}
                    </button>
                  </div>

                  {loadingReservations ? (
                    <div className="py-12 text-center text-[#6c6a5c] flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 animate-spin text-[#a8843f]" />
                      <span className="text-xs">Atualizando reservas…</span>
                    </div>
                  ) : activeTab === "upcoming" ? (
                    upcomingReservations.length === 0 ? (
                      <div className="py-10 text-center text-xs text-[#6c6a5c] bg-white rounded-xl border border-[#e6e8dc] p-6">
                        Você não possui nenhuma reserva futura confirmada no momento.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingReservations.map((res) => (
                          <div
                            key={res.id || res.reservationId}
                            className="rounded-xl border border-[#e6e8dc] bg-white p-5 space-y-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="inline-block rounded bg-[#f1e6cf] px-2.5 py-0.5 text-[11px] font-semibold text-[#5c4924] font-mono mb-1.5">
                                  {res.reservationId}
                                </span>
                                <h4 className="font-serif text-lg font-semibold text-[#494d40]">
                                  {res.roomName}
                                </h4>
                              </div>
                              <span className="rounded-full bg-[#f1e6cf] px-3 py-1 text-[11px] font-semibold text-[#5c4924] uppercase tracking-wide">
                                Confirmada
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-y border-[#e6e8dc] py-3 text-xs">
                              <div>
                                <span className="text-[#6c6a5c] block">Check-in</span>
                                <span className="font-semibold text-[#494d40]">
                                  {formatDate(res.checkIn)}
                                </span>
                                <span className="text-[10px] text-[#a9a596] block">A partir das 14h</span>
                              </div>
                              <div>
                                <span className="text-[#6c6a5c] block">Check-out</span>
                                <span className="font-semibold text-[#494d40]">
                                  {formatDate(res.checkOut)}
                                </span>
                                <span className="text-[10px] text-[#a9a596] block">Até as 12h</span>
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <span className="text-[#6c6a5c] block">Total Pago</span>
                                <span className="font-semibold text-[#a8843f] text-sm">
                                  {formatBRL(res.amount)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <button
                                type="button"
                                disabled={voucherSendingId === res.reservationId}
                                onClick={() => handleResendVoucher(res)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a8843f] hover:underline"
                              >
                                {voucherSendingId === res.reservationId ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Mail className="size-3.5" />
                                )}
                                Reenviar Voucher
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
                                  className="inline-flex items-center gap-1.5 rounded-md border border-[#ccd0bc] bg-white px-3 py-1.5 text-xs font-semibold text-[#494d40] hover:bg-[#f4f5f0] transition-colors"
                                >
                                  <Calendar className="size-3.5" />
                                  Remarcar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedReservation(res);
                                    setActionType("cancel");
                                  }}
                                  className="text-xs font-semibold text-red-700 hover:underline px-2 py-1.5"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : historyReservations.length === 0 ? (
                    <div className="py-10 text-center text-xs text-[#6c6a5c] bg-white rounded-xl border border-[#e6e8dc] p-6">
                      Nenhuma reserva anterior encontrada no histórico.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historyReservations.map((res) => (
                        <div
                          key={res.id || res.reservationId}
                          className="rounded-xl border border-[#e6e8dc] bg-white/70 p-4 space-y-2 opacity-85"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-[#6c6a5c]">
                              {res.reservationId}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                                res.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-stone-100 text-stone-700"
                              }`}
                            >
                              {res.status === "cancelled" ? "Cancelada" : "Concluída"}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-[#494d40]">
                            {res.roomName}
                          </div>
                          <div className="text-xs text-[#6c6a5c] flex items-center gap-4">
                            <span>
                              {formatDate(res.checkIn)} a {formatDate(res.checkOut)}
                            </span>
                            <span>•</span>
                            <span>{formatBRL(res.amount)}</span>
                          </div>
                        </div>
                      ))}
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

