import type { BookingFormData, CreateBookingPayload, BookingResponse } from '@/types';

// ============================================================
// submitReservation — Função principal de checkout
// ============================================================
// Fluxo completo:
//   1. Monta o payload com todos os dados da reserva
//   2. Cria um rascunho da reserva no SaaS (status: pending_payment)
//   3. Obtém a preference_id do Mercado Pago
//   4. O cliente paga via SDK do Mercado Pago
//   5. O webhook /api/webhooks/mercadopago confirma o pagamento
//   6. O SaaS sincroniza a reserva confirmada no Channex
// ============================================================
export async function submitReservation(
  formData: BookingFormData
): Promise<BookingResponse> {
  // --- MONTAR PAYLOAD ---
  const payload: CreateBookingPayload = {
    roomId: formData.roomId,
    propertyId: formData.propertyId,
    checkIn: formData.checkIn,
    checkOut: formData.checkOut,
    nights: formData.nights,
    guestCount: formData.guests,
    guest: formData.guest,
    pricePerNight: formData.pricePerNight,
    subtotal: formData.subtotal,
    discountCode: formData.discountCode ?? null,
    discountAmount: formData.discountAmount,
    total: formData.total,
    // Status inicial: aguardando pagamento.
    // Será atualizado para 'approved' pelo webhook do Mercado Pago.
    paymentStatus: 'pending',
    source: 'landing_page',
    createdAt: new Date().toISOString(),
  };

  // ============================================================
  // TODO: Substituir pelo fetch real:
  //
  // PASSO 1 — Criar reserva com status 'pending_payment' no SaaS:
  //   const bookingRes = await fetch('/api/bookings/create', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(payload),
  //   });
  //   const booking = await bookingRes.json();
  //
  // PASSO 2 — Gerar preferência no Mercado Pago:
  //   const mpRes = await fetch('/api/payments/create-preference', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ bookingId: booking.bookingId, total: payload.total }),
  //   });
  //   const { preferenceId } = await mpRes.json();
  //
  // PASSO 3 — Inicializar o SDK do Mercado Pago com preferenceId
  //   e redirecionar para o checkout ou renderizar o Brick.
  //
  // PASSO 4 — Aguardar o webhook em /api/webhooks/mercadopago
  //   para confirmar o pagamento e atualizar a reserva no Channex.
  // ============================================================

  console.log('[submitReservation] Payload para a API:', payload);

  // Mock — simula resposta da API
  await new Promise((r) => setTimeout(r, 1200));

  return {
    success: true,
    bookingId: `BK-${Date.now()}`,
    status: 'pending_payment',
    message: 'Reserva criada! Conclua o pagamento para confirmar.',
  };
}

// Calcula número de noites entre duas datas
export function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

// Formata preço em BRL
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
