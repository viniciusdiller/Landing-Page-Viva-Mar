"use client";

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X, CalendarDays, Mail, LogOut } from 'lucide-react';
import { guestRequest, type GuestReservation } from '@/lib/api/guest';
import { formatBRL } from '@/lib/booking';

export default function GuestPortalModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [token, setToken] = useState('');
  const [reservation, setReservation] = useState<GuestReservation | null>(null);
  const [code, setCode] = useState(''), [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [mode, setMode] = useState<'details' | 'cancel' | 'reschedule'>('details');
  const [start, setStart] = useState(''), [end, setEnd] = useState('');
  const inputClass = 'w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600';
  const buttonClass = 'rounded-md bg-[var(--color-primary)] px-4 py-3 font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50';
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, []);
  async function run(task: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await task(); } catch (err) { setError(err instanceof Error ? err.message : 'Falha de conexão. Tente novamente.'); }
    finally { setBusy(false); }
  }
  function logout() { setToken(''); setReservation(null); setIdentifier(''); setMode('details'); setError(''); setMessage(''); }
  async function lookup(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const data = await guestRequest('lookup', undefined, { code, identifier });
      if (!data.token || !data.reservations?.[0]) throw new Error('Reserva não encontrada.');
      setToken(data.token); setReservation(data.reservations[0]); setIdentifier('');
    });
  }
  async function mutate(action: 'cancel' | 'reschedule' | 'voucher') {
    if (!reservation) return;
    await run(async () => {
      const result = await guestRequest(action, token, { ...(action === 'voucher' ? {} : { reservationId: reservation.reservationId }), ...(action === 'reschedule' ? { newCheckIn: start, newCheckOut: end } : {}) });
      if (result.reservations?.[0]) setReservation(result.reservations[0]);
      setMessage(result.message || 'Solicitação concluída.'); setMode('details');
    });
  }
  const date = (value: string) => value.split('-').reverse().join('/');
  const statuses: Record<string, string> = { confirmed: 'Confirmada', cancelled: 'Cancelada', pending: 'Pendente' };
  return (
    <dialog ref={dialog} aria-labelledby="guest-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto w-[calc(100%_-_2rem)] max-w-xl max-h-[90dvh] overflow-y-auto rounded-xl border-0 bg-[var(--color-bg)] p-0 text-[var(--color-text)] shadow-2xl backdrop:bg-black/60">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-5">
        <div><p className="text-xs uppercase tracking-widest text-[var(--color-primary)]">Pousada Viva Mar</p><h2 id="guest-title" className="mt-1 text-2xl font-semibold">Minhas reservas</h2></div>
        <button type="button" aria-label="Fechar minhas reservas" disabled={busy} onClick={onClose} className="rounded p-2 hover:bg-slate-100"><X size={22} /></button>
      </div>
      <div className="space-y-5 p-6">
        {!reservation ? <form onSubmit={lookup} className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">Consulte o voucher e gerencie sua estadia com o código recebido por e-mail.</p>
          <label className="block space-y-2"><span>Código da reserva</span><input autoFocus required maxLength={50} value={code} onChange={event => setCode(event.target.value)} placeholder="Ex.: mp_123456789" className={inputClass} autoComplete="off" /></label>
          <label className="block space-y-2"><span>CPF ou e-mail do titular</span><input required maxLength={160} value={identifier} onChange={event => setIdentifier(event.target.value)} className={inputClass} autoComplete="off" /></label>
          <button disabled={busy} className={`${buttonClass} w-full`}>{busy ? 'Consultando…' : 'Consultar reserva'}</button>
        </form> : <>
          <div className="flex items-center justify-between gap-3"><span className="rounded bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900">{statuses[reservation.status] || reservation.status}</span><button disabled={busy} onClick={logout} className="inline-flex items-center gap-2 text-sm underline"><LogOut size={15} />Sair</button></div>
          <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-white p-5">
            <p className="break-all font-mono text-sm text-blue-800">{reservation.reservationId}</p><h3 className="text-xl font-semibold">{reservation.roomName}</h3>
            <p>{reservation.guestName}</p><dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-500">Check-in</dt><dd className="font-semibold">{date(reservation.checkIn)}</dd></div><div><dt className="text-slate-500">Check-out</dt><dd className="font-semibold">{date(reservation.checkOut)}</dd></div><div className="col-span-2"><dt className="text-slate-500">Valor da hospedagem</dt><dd className="font-semibold">{formatBRL(reservation.amount)}</dd></div></dl>
          </div>
          {mode === 'details' && <div className="flex flex-wrap gap-3">
            {reservation.status === 'confirmed' && <button disabled={busy} onClick={() => mutate('voucher')} className={buttonClass}><Mail className="mr-2 inline" size={16} />Reenviar voucher</button>}
            {reservation.canModify && <><button disabled={busy} onClick={() => { setMode('reschedule'); setStart(reservation.checkIn); setEnd(reservation.checkOut); }} className="rounded-md border border-slate-300 px-4 py-3"><CalendarDays className="mr-2 inline" size={16} />Remarcar</button><button disabled={busy} onClick={() => setMode('cancel')} className="px-2 py-3 text-sm text-red-700 underline">Cancelar reserva</button></>}
          </div>}
          {mode === 'reschedule' && <form className="space-y-4" onSubmit={event => { event.preventDefault(); mutate('reschedule'); }}>
            <h3 className="font-semibold">Remarcar estadia</h3><p className="text-sm text-slate-600">O portal permite manter a duração e o valor da hospedagem, respeitando disponibilidade e estadia mínima. Alterações de tarifa ou reservas com desconto podem exigir atendimento pela recepção.</p>
            <p className="text-sm">Estadia mínima padrão: {reservation.minStayNights || 1} noite(s). Regras sazonais são verificadas na confirmação.</p>
            <label className="block space-y-2"><span>Novo check-in</span><input type="date" required value={start} onChange={event => setStart(event.target.value)} className={inputClass} /></label>
            <label className="block space-y-2"><span>Novo check-out</span><input type="date" required min={start} value={end} onChange={event => setEnd(event.target.value)} className={inputClass} /></label>
            <button disabled={busy} className={buttonClass}>Confirmar remarcação</button><button type="button" disabled={busy} onClick={() => setMode('details')} className="ml-3 underline">Voltar</button>
          </form>}
          {mode === 'cancel' && <div className="space-y-4"><h3 className="font-semibold">Confirmar cancelamento?</h3><p className="text-sm">A reserva será cancelada e a acomodação liberada. O reembolso não é automático: condições e valores devem ser tratados com a recepção.</p><button disabled={busy} onClick={() => mutate('cancel')} className="rounded-md bg-red-700 px-4 py-3 font-semibold text-white">Confirmar cancelamento</button><button disabled={busy} onClick={() => setMode('details')} className="ml-3 underline">Voltar</button></div>}
        </>}
        {busy && <p role="status" className="text-sm">Processando…</p>}
        {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="rounded bg-green-50 p-3 text-sm text-green-900">{message}</p>}
        <p className="text-xs text-slate-500">Precisa de ajuda? <a href="mailto:pousadavivamarsaqua@gmail.com" className="underline">Fale com a recepção</a>.</p>
      </div>
    </dialog>
  );
}
