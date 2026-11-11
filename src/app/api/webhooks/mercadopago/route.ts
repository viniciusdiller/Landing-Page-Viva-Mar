import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago";
import {
  confirmReservationFromMetadata,
  hasProcessedPayment,
} from "@/lib/confirm-reservation";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Validação obrigatória da assinatura x-signature (painel do Mercado Pago >
// Suas integrações > Webhooks > chave secreta). Sem essa validação, qualquer
// pessoa não autenticada consegue chamar essa rota diretamente com um ID de
// pagamento aprovado (nosso ou reaproveitado) e forçar a criação repetida de
// reservas no Saas-Sancho — a re-consulta do status via API (mais abaixo)
// impede FALSIFICAR um pagamento, mas sozinha não impede REPLAY.
function isSignatureValid(request: NextRequest, paymentId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "MERCADOPAGO_WEBHOOK_SECRET não configurada — recusando webhook. Configure a chave secreta em Suas integrações > Webhooks no painel do Mercado Pago e defina MERCADOPAGO_WEBHOOK_SECRET no .env, senão reservas não vão mais ser confirmadas automaticamente.",
    );
    return false;
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );

  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${paymentId.toLowerCase()};request-id:${xRequestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(parts.v1);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(getClientIp(request), "webhook-mercadopago", {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}) as any);

    const type = searchParams.get("type") ?? body?.type;
    const paymentId = searchParams.get("data.id") ?? body?.data?.id;

    // Só nos interessam eventos de pagamento — reconhecemos os demais para
    // o Mercado Pago não ficar reenviando, mas não fazemos nada com eles.
    if (type !== "payment" || !paymentId) {
      return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
    }

    if (!isSignatureValid(request, String(paymentId))) {
      console.warn("Webhook Mercado Pago: assinatura x-signature inválida.");
      return NextResponse.json({ ok: false, error: "Assinatura inválida" }, { status: 401 });
    }

    // Nunca confiamos no status que vem no corpo do webhook — sempre
    // reconsultamos o pagamento direto na API do Mercado Pago.
    const payment = await getPayment(String(paymentId));

    if (payment.status !== "approved") {
      return NextResponse.json(
        { ok: true, status: payment.status, message: "Pagamento ainda não aprovado." },
        { status: 200 },
      );
    }

    if (!payment.metadata?.room_id) {
      console.error(
        `Webhook Mercado Pago: pagamento ${payment.id} aprovado sem metadata de reserva.`,
      );
      return NextResponse.json(
        { ok: false, error: "Pagamento sem metadados de reserva" },
        { status: 200 },
      );
    }

    if (hasProcessedPayment(payment.id)) {
      return NextResponse.json(
        { ok: true, paymentId: payment.id, message: "Pagamento já processado." },
        { status: 200 },
      );
    }

    const reservation = await confirmReservationFromMetadata(
      payment.metadata,
      payment.id,
    );

    return NextResponse.json(
      { ok: true, paymentId: payment.id, reservation },
      { status: 200 },
    );
  } catch (error) {
    // Log detalhado só no servidor — a resposta é pública (qualquer um pode
    // chamar essa rota diretamente), então não devolve detalhes internos.
    console.error("Erro ao processar webhook do Mercado Pago:", error);
    // 503 para o Mercado Pago reenviar: o Admin deduplica por paymentReference
    // (mp_<id>), então a repetição é segura. Com 200, um 401/falha de rede no
    // Admin deixaria o pagamento aprovado sem reserva e sem nova tentativa.
    return NextResponse.json({ ok: false, error: "Erro ao processar notificação." }, { status: 503 });
  }
}
