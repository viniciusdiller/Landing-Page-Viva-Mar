"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  RotateCcw,
  Ban,
  ArrowRight,
  ShieldCheck,
  User,
} from "lucide-react";
import { useGuest } from "@/lib/guest-context";
import {
  lookupGuestReservation,
  fetchGuestReservations,
  cancelGuestReservation,
  rescheduleGuestReservation,
} from "@/lib/api/guest";
import { formatBRL, calcNights, formatReservationCode } from "@/lib/booking";
import { maskCpfOrEmail, maskReservationCode } from "@/lib/masks";
import type { GuestReservation } from "@/types";

function addDaysISO(dateStr: string, days: number): string {
  const parts = dateStr.slice(0, 10).split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function GuestPortalModal() {
  const { guest, token, isAuthenticated, isPortalOpen, closePortal, login, logout } = useGuest();

  // Estados de Consulta Direta
  const [reservationCode, setReservationCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Estados de Reservas
  const [reservations, setReservations] = useState<GuestReservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");

  // Ações nas Reservas
  const [selectedReservation, setSelectedReservation] = useState<GuestReservation | null>(null);
  const [actionType, setActionType] = useState<"cancel" | "reschedule" | null>(null);
  const [newCheckIn, setNewCheckIn] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const todayISO = new Date().toISOString().split("T")[0];

  // Carregar reservas quando autenticado
  const loadReservations = useCallback(async (overrideToken?: string) => {
    const activeToken = overrideToken || token;
    if (!activeToken) return;
    setLoadingReservations(true);
    try {
      const data = await fetchGuestReservations(activeToken);
      if (Array.isArray(data) && data.length > 0) {
        setReservations(data);
      }
    } catch {
      // noop
    } finally {
      setLoadingReservations(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && isPortalOpen && token) {
      loadReservations();
    }
  }, [isAuthenticated, isPortalOpen, token, loadReservations]);

  // Bloqueia o scroll da tela de fundo enquanto o modal estiver aberto
  useEffect(() => {
    if (!isPortalOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isPortalOpen]);

  // Consulta de Reserva por Código e CPF/E-mail
  const handleLookupReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanCode = reservationCode.trim();
    const cleanIdentifier = identifier.trim();

    if (!cleanCode) {
      setAuthError("Informe o código da sua reserva.");
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

  // Cancelar reserva
  const handleConfirmCancel = async () => {
    if (!token || !selectedReservation) return;
    setActionLoading(true);
    setActionError(null);

    const result = await cancelGuestReservation(
      token,
      selectedReservation.reservationId || String(selectedReservation.id)
    );
    setActionLoading(false);

    if (result.ok) {
      setActionSuccess(
        result.message || "Reserva cancelada e estorno automático solicitado com sucesso."
      );
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

  // Remarcar reserva (toda validação de negócio é feita pelo backend)
  const handleConfirmReschedule = async () => {
    if (!token || !selectedReservation) return;

    setActionLoading(true);
    setActionError(null);

    const result = await rescheduleGuestReservation(
      token,
      selectedReservation.reservationId || String(selectedReservation.id),
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

  const isTodayOrFuture = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.slice(0, 10).split("-").map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return false;
    const checkDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate >= today;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain"
    >
      {/* Backdrop */}
      <div
        onClick={closePortal}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div
        className={`guest-portal-modal relative w-full max-w-2xl rounded-3xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-2xl overflow-hidden z-10 my-auto text-[var(--color-text)] ${
          actionType === "reschedule" ? "min-h-[500px]" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[#454a3a]">
              <User className="size-4" />
            </div>
            <div>
              <h2
                id="guest-portal-title"
                className="text-lg font-normal text-[var(--color-text)] leading-tight"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {isAuthenticated ? "Minha Conta · Reservas" : "Área do Hóspede"}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Pousada Viva Mar · Saquarema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                title="Sair da conta"
              >
                <LogOut className="size-3.5" />
                <span>Sair</span>
              </button>
            )}
            <button
              type="button"
              onClick={closePortal}
              className="flex size-8 items-center justify-center rounded-full text-zinc-500 hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {!isAuthenticated ? (
            /* ================= CONSULTA DIRETA DE RESERVA ================= */
            <div className="max-w-md mx-auto py-2">
              <form onSubmit={handleLookupReservation} className="space-y-4">
                <div className="text-center mb-6">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#e9ece6] text-[#454a3a] mb-3 border border-[#d5dbd0]">
                    <Search className="size-5" />
                  </div>
                  <h3
                    className="text-2xl font-normal text-[var(--color-text)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Consulte sua Reserva
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
                    Informe o código da sua reserva enviado por e-mail e o seu CPF ou e-mail cadastrado para visualizar seu voucher e gerenciar sua estadia.
                  </p>
                </div>

                {authError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                    Código da Reserva
                    <span className="ml-1 text-[11px] font-normal normal-case text-[var(--color-text-muted)]/75">
                      (ex: VIVA-1042 ou 1042)
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reservationCode}
                    onChange={(e) => setReservationCode(maskReservationCode(e.target.value))}
                    placeholder="Ex: VIVA-1042"
                    className="w-full font-mono uppercase tracking-wider rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none transition-all focus:border-[#5c6152] focus:ring-2 focus:ring-[#5c6152]/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                    CPF ou E-mail do Titular
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(maskCpfOrEmail(e.target.value))}
                    placeholder="000.000.000-00 ou seu@email.com"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none transition-all focus:border-[#5c6152] focus:ring-2 focus:ring-[#5c6152]/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#454a3a] py-3.5 text-sm font-medium text-white shadow-sm hover:bg-[#5c6152] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Consultando reserva...</span>
                    </>
                  ) : (
                    <>
                      <span>Consultar Reserva</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center text-xs text-[var(--color-text-muted)]">
                  <span>
                    Não encontrou seu código? Verifique a caixa de entrada ou spam do e-mail informado no checkout. Dúvidas: WhatsApp (22) 99202-7273.
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-[var(--color-text-muted)]">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  <span>Consulta protegida com autenticação criptográfica segura.</span>
                </div>
              </form>
            </div>
          ) : (
            /* ================= PAINEL DO HÓSPEDE (LOGADO) ================= */
            <div>
              {/* Mensagem de Boas-vindas */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--color-border)] pb-4">
                <div>
                  <h3
                    className="text-xl font-normal text-[var(--color-text)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Olá{guest?.name ? `, ${guest.name.split(" ")[0]}` : ""}!
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {guest?.email}
                  </p>
                </div>

                {/* Alternador de Abas */}
                <div className="flex rounded-xl bg-[var(--color-surface-2)] p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("upcoming")}
                    className={`rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
                      activeTab === "upcoming"
                        ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    Próximas ({upcomingReservations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className={`rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
                      activeTab === "history"
                        ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    Histórico ({historyReservations.length})
                  </button>
                </div>
              </div>

              {/* Lista de Reservas */}
              {loadingReservations ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
                  <Loader2 className="size-6 animate-spin text-[#454a3a]" />
                  <span className="text-xs">Carregando suas estadias...</span>
                </div>
              ) : (activeTab === "upcoming" ? upcomingReservations : historyReservations).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center my-4">
                  <p
                    className="text-base font-normal text-[var(--color-text)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {activeTab === "upcoming"
                      ? "Nenhuma estadia futura encontrada."
                      : "Nenhum histórico de estadia anterior."}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {activeTab === "upcoming"
                      ? "Suas novas reservas efetuadas com este e-mail aparecerão aqui automaticamente."
                      : "Reservas passadas ou canceladas ficam registradas nesta aba."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {(activeTab === "upcoming" ? upcomingReservations : historyReservations).map((res) => {
                    const nights = calcNights(res.checkIn, res.checkOut);
                    return (
                      <div
                        key={res.id || res.reservationId}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4
                                className="text-lg font-normal text-[var(--color-text)]"
                                style={{ fontFamily: "var(--font-body)" }}
                              >
                                {res.roomName}
                              </h4>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                  res.status === "confirmed"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : res.status === "cancelled"
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {res.status === "confirmed"
                                  ? "Confirmada"
                                  : res.status === "cancelled"
                                  ? "Cancelada"
                                  : "Pendente"}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                              Localizador: {res.displayCode || formatReservationCode(res.id)}
                            </p>
                          </div>

                          <div className="sm:text-right">
                            <span className="text-xs text-[var(--color-text-muted)] block">Total</span>
                            <span className="text-lg font-semibold text-[#454a3a]">
                              {formatBRL(res.amount)}
                            </span>
                          </div>
                        </div>

                        {/* Informações de Estadia */}
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl bg-[var(--color-surface-2)] p-3 text-xs">
                          <div>
                            <span className="text-[var(--color-text-muted)] block text-[10px] uppercase">
                              Check-in
                            </span>
                            <span className="font-semibold text-[var(--color-text)]">
                              {res.checkIn.slice(0, 10).split("-").reverse().join("/")}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)] block text-[10px] uppercase">
                              Check-out
                            </span>
                            <span className="font-semibold text-[var(--color-text)]">
                              {res.checkOut.slice(0, 10).split("-").reverse().join("/")}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-[var(--color-text-muted)] block text-[10px] uppercase">
                              Duração
                            </span>
                            <span className="font-semibold text-[var(--color-text)]">
                              {nights} {nights === 1 ? "diária" : "diárias"}
                            </span>
                          </div>
                        </div>

                        {/* Ações disponíveis apenas para reservas ativas confirmadas */}
                        {res.status === "confirmed" && isTodayOrFuture(res.checkIn) && (
                          <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReservation(res);
                                setNewCheckIn(res.checkIn.slice(0, 10));
                                setNewCheckOut(res.checkOut.slice(0, 10));
                                setActionType("reschedule");
                                setActionError(null);
                                setActionSuccess(null);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--color-text)] hover:bg-zinc-50 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="size-3.5 text-[#bd9a5f]" />
                              <span>Remarcar Estadia</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReservation(res);
                                setActionType("cancel");
                                setActionError(null);
                                setActionSuccess(null);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <Ban className="size-3.5" />
                              <span>Cancelar Reserva</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Interno de Ação (Cancelamento ou Remarcação) */}
        {actionType && selectedReservation && (
          <div className="absolute inset-0 bg-[var(--color-bg)]/95 backdrop-blur-md flex flex-col justify-center p-6 z-20 overflow-y-auto">
            <div className="max-w-md mx-auto w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xl my-auto">
              {actionType === "cancel" ? (
                <div>
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-700 mb-3 border border-rose-100">
                    <Ban className="size-6" />
                  </div>
                  <h4
                    className="text-xl font-normal text-center text-[var(--color-text)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Cancelar Reserva
                  </h4>
                  <p className="mt-2 text-xs text-center text-[var(--color-text-muted)]">
                    Tem certeza de que deseja cancelar sua estadia no{" "}
                    <strong>{selectedReservation.roomName}</strong> (
                    {selectedReservation.checkIn.slice(0, 10).split("-").reverse().join("/")} a{" "}
                    {selectedReservation.checkOut.slice(0, 10).split("-").reverse().join("/")})?
                  </p>

                  <div className="mt-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                    Cancelamentos realizados com até{" "}
                    <strong className="text-[var(--color-text)]">7 dias de antecedência</strong>{" "}
                    do check-in recebem o estorno integral (
                    <strong className="text-[var(--color-text)]">
                      {formatBRL(selectedReservation.amount)}
                    </strong>
                    ) automaticamente no mesmo meio de pagamento utilizado.
                  </div>

                  {actionError && (
                    actionError.includes("gestão") ? (
                      <div className="mt-4 rounded-2xl border border-[#e2cfa9] bg-[#faf4e8] p-3.5 text-xs text-[#5c4924] shadow-xs">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="size-4 shrink-0 text-[#a8843f] mt-0.5" />
                          <div className="space-y-2 flex-1">
                            <p className="font-semibold text-[#473719]">
                              Atendimento direto com a Gestão
                            </p>
                            <p className="leading-relaxed text-[#5c4924]">
                              {actionError}
                            </p>
                            <a
                              href={`https://wa.me/5522992917331?text=${encodeURIComponent(
                                `Olá! Gostaria de verificar o cancelamento da minha reserva ${formatReservationCode(
                                  selectedReservation.id
                                )} (${selectedReservation.roomName}, check-in em ${selectedReservation.checkIn
                                  .slice(0, 10)
                                  .split("-")
                                  .reverse()
                                  .join("/")}).`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#454a3a] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#5c6152] transition-colors"
                            >
                              <span>Falar com a Gestão no WhatsApp</span>
                              <ArrowRight className="size-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>{actionError}</span>
                      </div>
                    )
                  )}

                  {actionSuccess && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setActionType(null)}
                      className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-xs font-medium text-[var(--color-text)] hover:bg-zinc-50 cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleConfirmCancel}
                      className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-medium text-white hover:bg-rose-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {actionLoading ? <Loader2 className="size-4 animate-spin" /> : "Sim, Cancelar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#f4ece1] text-[#a8843f] mb-3 border border-[#e5dec9]">
                    <RotateCcw className="size-6" />
                  </div>
                  <h4
                    className="text-xl font-normal text-center text-[var(--color-text)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Remarcar Estadia
                  </h4>
                  <p className="mt-1 text-xs text-center text-[var(--color-text-muted)]">
                    {selectedReservation.roomName}
                  </p>

                  {actionError && (
                    actionError.includes("gestão") ? (
                      <div className="mt-4 rounded-2xl border border-[#e2cfa9] bg-[#faf4e8] p-3.5 text-xs text-[#5c4924] shadow-xs">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="size-4 shrink-0 text-[#a8843f] mt-0.5" />
                          <div className="space-y-2 flex-1">
                            <p className="font-semibold text-[#473719]">
                              Alteração na quantidade de diárias
                            </p>
                            <p className="leading-relaxed text-[#5c4924]">
                              {actionError}
                            </p>
                            <a
                              href={`https://wa.me/5522992917331?text=${encodeURIComponent(
                                `Olá! Gostaria de remarcar minha reserva ${formatReservationCode(
                                  selectedReservation.id
                                )} (${selectedReservation.roomName}) alterando a quantidade de diárias para o período de ${newCheckIn
                                  .split("-")
                                  .reverse()
                                  .join("/")} a ${newCheckOut.split("-").reverse().join("/")}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#454a3a] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#5c6152] transition-colors"
                            >
                              <span>Falar com a Gestão no WhatsApp</span>
                              <ArrowRight className="size-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>{actionError}</span>
                      </div>
                    )
                  )}

                  {actionSuccess && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-medium uppercase text-[var(--color-text-muted)]">
                          Novo Check-in
                        </label>
                        <span className="text-[10px] text-[#454a3a] font-medium">
                          A partir das 14:00
                        </span>
                      </div>
                      <input
                        type="date"
                        required
                        min={todayISO}
                        value={newCheckIn}
                        onChange={(e) => {
                          const date = e.target.value;
                          setNewCheckIn(date);
                          setActionError(null);
                          if (date) {
                            const nextDayStr = addDaysISO(date, 1);
                            if (!newCheckOut || newCheckOut <= date) {
                              setNewCheckOut(nextDayStr);
                            }
                          }
                        }}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs font-semibold text-[var(--color-text)] outline-none transition-all duration-200 hover:border-[#5c6152] focus:border-[#5c6152] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-medium uppercase text-[var(--color-text-muted)]">
                          Novo Check-out
                        </label>
                        <span className="text-[10px] text-[#454a3a] font-medium">
                          Até as 12:00
                        </span>
                      </div>
                      <input
                        type="date"
                        required
                        min={
                          newCheckIn
                            ? addDaysISO(newCheckIn, 1)
                            : addDaysISO(todayISO, 1)
                        }
                        value={newCheckOut}
                        onChange={(e) => {
                          setNewCheckOut(e.target.value);
                          setActionError(null);
                        }}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs font-semibold text-[var(--color-text)] outline-none transition-all duration-200 hover:border-[#5c6152] focus:border-[#5c6152] cursor-pointer"
                      />
                    </div>

                    <div className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2 flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                      <span>
                        Reserva original:{" "}
                        <strong className="text-[var(--color-text)]">
                          {calcNights(selectedReservation.checkIn, selectedReservation.checkOut)}{" "}
                          {calcNights(selectedReservation.checkIn, selectedReservation.checkOut) === 1
                            ? "diária"
                            : "diárias"}
                        </strong>
                      </span>
                      {newCheckIn && newCheckOut && new Date(newCheckOut) > new Date(newCheckIn) && (
                        <span>
                          Selecionado:{" "}
                          <strong className="text-[var(--color-text)]">
                            {calcNights(newCheckIn, newCheckOut)}{" "}
                            {calcNights(newCheckIn, newCheckOut) === 1 ? "diária" : "diárias"}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setActionType(null)}
                      className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-xs font-medium text-[var(--color-text)] hover:bg-zinc-50 cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleConfirmReschedule}
                      className="flex-1 rounded-xl bg-[#454a3a] py-2.5 text-xs font-medium text-white hover:bg-[#5c6152] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {actionLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Confirmar Remarcação"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
