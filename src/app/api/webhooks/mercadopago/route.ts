import { NextRequest, NextResponse } from 'next/server';
import type { MercadoPagoWebhookPayload, PaymentStatus } from '@/types';

function mapMpStatus(status: string): PaymentStatus {
  const normalized = status.toLowerCase();
  if (normalized === 'approved') return 'approved';
  if (normalized === 'in_process') return 'in_process';
  if (normalized === 'rejected') return 'rejected';
  if (normalized === 'cancelled') return 'cancelled';
  if (normalized === 'refunded') return 'refunded';
  return 'pending';
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as MercadoPagoWebhookPayload;

    // Segurança recomendada (implementar em produção):
    // 1) Validar assinatura x-signature com MP_WEBHOOK_SECRET.
    // 2) Buscar detalhes do pagamento no endpoint oficial do Mercado Pago.
    // 3) Localizar booking interno pelo external_reference ou metadata.bookingId.

    const paymentId = payload.data?.id;

    // MOCK: Em produção, obter status real via API do Mercado Pago:
    // const mpPayment = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, ...)
    // const paymentStatus = mapMpStatus(mpPayment.status)
    const paymentStatus: PaymentStatus = mapMpStatus('approved');

    // MOCK: Enviar atualização para API interna do SaaS para confirmar/cancelar reserva
    // await fetch(`${process.env.INTERNAL_API_URL}/bookings/confirm-payment`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ paymentId, paymentStatus, webhookPayload: payload }),
    // });

    return NextResponse.json(
      {
        ok: true,
        receivedAt: new Date().toISOString(),
        paymentId,
        paymentStatus,
        message: 'Webhook processado. Reserva deve ser confirmada no painel após atualização.',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Falha ao processar webhook do Mercado Pago',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 400 }
    );
  }
}
