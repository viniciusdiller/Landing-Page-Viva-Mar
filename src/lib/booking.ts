import type { BookingFormData, BookingResponse } from '@/types';

function getApiBaseUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_VIVAMAR_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error('Defina NEXT_PUBLIC_API_URL para enviar reservas ao SaaS.');
  }

  return baseUrl.replace(/\/$/, '');
}

// ============================================================
// submitReservation — Função principal de checkout
// ============================================================
// Cria a reserva diretamente no SaaS (Saas-Sancho) via
// POST /api/public/viva-mar. O preço final é sempre recalculado
// no servidor a partir do quarto/datas/cupom — o `amount` enviado
// aqui é apenas informativo.
//
// A cobrança real via Mercado Pago ainda não está integrada:
// a reserva já nasce como "confirmed" no SaaS assim que este
// POST tem sucesso.
// ============================================================
export async function submitReservation(
  formData: BookingFormData
): Promise<BookingResponse> {
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}/api/public/viva-mar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: formData.roomId,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      amount: formData.total,
      guestName: `${formData.guest.firstName} ${formData.guest.lastName}`.trim(),
      guestEmail: formData.guest.email,
      guestPhone: formData.guest.phone,
      guestCpf: formData.guest.cpf,
      notes: formData.guest.specialRequests || 'Nenhuma observação.',
      ...(formData.discountCode ? { couponCode: formData.discountCode } : {}),
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || 'Falha ao criar a reserva. Tente novamente.',
    );
  }

  return {
    success: true,
    bookingId: data.id,
    status: data.status === 'confirmed' ? 'confirmed' : 'pending_payment',
    message: 'Reserva confirmada! Em breve você receberá os detalhes por e-mail.',
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
