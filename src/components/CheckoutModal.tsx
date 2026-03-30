'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, TicketPercent, Loader2 } from 'lucide-react';
import MercadoPagoCheckout from './MercadoPagoCheckout';
import { formatBRL, submitReservation } from '@/lib/booking';
import { validateCoupon } from '@/lib/coupons';
import type { BookingFormData, GuestData, RoomType } from '@/types';

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
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  cpf: '',
  specialRequests: '',
};

export default function CheckoutModal({ open, room, bookingContext, onClose }: CheckoutModalProps) {
  const [guest, setGuest] = useState<GuestData>(DEFAULT_GUEST);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(undefined);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  useEffect(() => {
    if (open) {
      setResultMessage('');
    }
  }, [open]);

  const subtotal = useMemo(() => {
    if (!room) return 0;
    return room.pricePerNight * Math.max(1, bookingContext.nights);
  }, [room, bookingContext.nights]);

  useEffect(() => {
    if (!couponInput.trim()) {
      setAppliedCoupon(undefined);
      setDiscountAmount(0);
      setCouponMessage('');
      return;
    }

    const result = validateCoupon(couponInput.trim(), bookingContext.nights, subtotal);
    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon.code);
      setDiscountAmount(result.discountAmount);
    } else {
      setAppliedCoupon(undefined);
      setDiscountAmount(0);
    }
    setCouponMessage(result.message);
  }, [couponInput, bookingContext.nights, subtotal]);

  const total = Math.max(0, subtotal - discountAmount);

  if (!open || !room) return null;

  function updateGuest<K extends keyof GuestData>(key: K, value: GuestData[K]) {
    setGuest((prev) => ({ ...prev, [key]: value }));
  }

  function applyCoupon() {
    if (!couponInput.trim()) {
      setCouponMessage('Digite um cupom para aplicar.');
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
    setResultMessage('');

    try {
      const response = await submitReservation(formData);
      setResultMessage(response.message);
    } catch {
      setResultMessage('Falha ao criar a reserva. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button className="absolute inset-0 bg-black/55" onClick={onClose} aria-label="Fechar checkout" />

      <div className="absolute inset-0 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto w-full max-w-5xl rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl">
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600 }}>
              Finalizar reserva
            </h3>
            <button className="p-2 rounded-md hover:bg-[var(--color-surface-offset)]" onClick={onClose} aria-label="Fechar">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <aside className="p-5 md:p-6 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <img src={room.images[0]} alt={room.name} className="w-full h-44 object-cover rounded-xl mb-4" />
              <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }} className="mb-1">{room.name}</h4>
              <p className="text-[var(--color-text-muted)] mb-4" style={{ fontSize: 'var(--text-sm)' }}>
                {bookingContext.checkIn || 'Selecione'} → {bookingContext.checkOut || 'Selecione'} • {bookingContext.guests} hóspede(s)
              </p>

              <div className="space-y-2" style={{ fontSize: 'var(--text-sm)' }}>
                <div className="flex justify-between"><span>Subtotal</span><strong>{formatBRL(subtotal)}</strong></div>
                <div className="flex justify-between text-[var(--color-success)]"><span>Desconto</span><strong>- {formatBRL(discountAmount)}</strong></div>
                <div className="pt-2 border-t border-[var(--color-border)] flex justify-between" style={{ fontSize: 'var(--text-base)' }}>
                  <span>Total</span><strong>{formatBRL(total)}</strong>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--color-border)] p-3">
                <label className="block mb-2" style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                  <TicketPercent size={14} className="inline mr-1" /> Cupão de desconto
                </label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    placeholder="Ex: VIVAMAR10"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  />
                  <button type="button" className="btn btn-secondary" onClick={applyCoupon}>Aplicar</button>
                </div>
                {couponMessage && (
                  <p className="mt-2" style={{ fontSize: 'var(--text-xs)', color: appliedCoupon ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {couponMessage}
                  </p>
                )}
              </div>
            </aside>

            <form onSubmit={handleSubmitReservation} className="p-5 md:p-6 space-y-4">
              <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Dados do hóspede</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="input" placeholder="Nome" value={guest.firstName} onChange={(e) => updateGuest('firstName', e.target.value)} required />
                <input className="input" placeholder="Sobrenome" value={guest.lastName} onChange={(e) => updateGuest('lastName', e.target.value)} required />
                <input className="input" type="email" placeholder="E-mail" value={guest.email} onChange={(e) => updateGuest('email', e.target.value)} required />
                <input className="input" placeholder="Telefone" value={guest.phone} onChange={(e) => updateGuest('phone', e.target.value)} required />
                <input className="input sm:col-span-2" placeholder="CPF (opcional)" value={guest.cpf} onChange={(e) => updateGuest('cpf', e.target.value)} />
                <textarea className="input sm:col-span-2 min-h-[90px]" placeholder="Pedidos especiais (opcional)" value={guest.specialRequests} onChange={(e) => updateGuest('specialRequests', e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Criar pré-reserva no SaaS
              </button>

              <MercadoPagoCheckout />

              {resultMessage && (
                <p className="rounded-lg p-3 bg-[var(--color-primary-light)] text-[var(--color-primary)]" style={{ fontSize: 'var(--text-sm)' }}>
                  {resultMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
