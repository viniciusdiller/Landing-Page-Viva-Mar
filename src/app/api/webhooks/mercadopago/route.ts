import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Mitigação local contra reservas duplicadas: o Mercado Pago pode reenviar
// legitimamente a mesma notificação mais de uma vez, e mesmo com a
// assinatura obrigatória (acima) um reenvio genuíno ainda pode chegar duas
// vezes. Isso evita chamar confirmReservation() de novo pro mesmo
// pagamento já processado nesta instância do servidor. Não substitui uma
// constraint única por paymentId/externalReference no banco do Saas-Sancho
// (essa sim é a defesa definitiva, e vale ainda mais em ambientes com
// múltiplas instâncias) — é um reforço enquanto isso não existe lá.
const processedPaymentIds = new Set<number>();
const MAX_TRACKED_PAYMENT_IDS = 5000;

function markProcessed(paymentId: number) {
  if (processedPaymentIds.size >= MAX_TRACKED_PAYMENT_IDS) {
    processedPaymentIds.clear();
  }
  processedPaymentIds.add(paymentId);
}

function getApiBaseUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_VIVAMAR_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("Defina NEXT_PUBLIC_API_URL para confirmar reservas no SaaS.");
  }

  return baseUrl.replace(/\/$/, "");
}

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

function safeParsePackages(
  raw: unknown,
): Array<{ name: string; quantity: number; price: number }> {
  if (typeof raw !== "string" || !raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildAddressLine(metadata: Record<string, unknown>) {
  const address = String(metadata.guest_address || "").trim();
  if (!address) return null;

  const number = String(metadata.guest_address_number || "").trim();
  const complement = String(metadata.guest_address_complement || "").trim();
  const neighborhood = String(metadata.guest_neighborhood || "").trim();
  const city = String(metadata.guest_city || "").trim();
  const state = String(metadata.guest_state || "").trim();
  const cep = String(metadata.guest_cep || "").trim();

  const streetPart = [address, number].filter(Boolean).join(", ");
  const complementPart = complement ? ` (${complement})` : "";
  const cityPart = [neighborhood, [city, state].filter(Boolean).join("/")]
    .filter(Boolean)
    .join(" - ");

  return `Endereço: ${[streetPart + complementPart, cityPart, cep].filter(Boolean).join(", ")}.`;
}

function buildReservationNotes(metadata: Record<string, unknown>, paymentId: number) {
  const specialRequests = String(metadata.special_requests || "").trim();
  const packages = safeParsePackages(metadata.packages_json);

  const parts = [
    specialRequests || "Nenhuma observação.",
    packages.length > 0
      ? `Adicionais: ${packages.map((pkg) => `${pkg.name} x${pkg.quantity}`).join(", ")}`
      : null,
    buildAddressLine(metadata),
    `Pagamento Mercado Pago #${paymentId}.`,
  ].filter(Boolean);

  return parts.join(" ");
}

async function confirmReservation(metadata: Record<string, unknown>, paymentId: number) {
  const baseUrl = getApiBaseUrl();
  const guestName = `${metadata.guest_first_name || ""} ${metadata.guest_last_name || ""}`.trim();

  const response = await fetch(`${baseUrl}/api/public/viva-mar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomId: metadata.room_id,
      checkIn: metadata.check_in,
      checkOut: metadata.check_out,
      guestName,
      guestEmail: metadata.guest_email,
      guestPhone: metadata.guest_phone,
      guestCpf: metadata.guest_cpf || undefined,
      notes: buildReservationNotes(metadata, paymentId),
      ...(metadata.coupon_code ? { couponCode: metadata.coupon_code } : {}),
      paymentReference: String(paymentId),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.error || `Falha ao confirmar reserva no SaaS (${response.status}).`,
    );
  }

  return response.json();
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

    if (processedPaymentIds.has(payment.id)) {
      return NextResponse.json(
        { ok: true, paymentId: payment.id, message: "Pagamento já processado." },
        { status: 200 },
      );
    }

    const reservation = await confirmReservation(payment.metadata, payment.id);
    markProcessed(payment.id);

    return NextResponse.json(
      { ok: true, paymentId: payment.id, reservation },
      { status: 200 },
    );
  } catch (error) {
    // Log detalhado só no servidor — a resposta é pública (qualquer um pode
    // chamar essa rota diretamente), então não devolve detalhes internos.
    console.error("Erro ao processar webhook do Mercado Pago:", error);
    // Sempre 200 aqui: um 4xx/5xx faz o Mercado Pago reenviar a notificação
    // indefinidamente. O erro já foi logado para investigação manual.
    return NextResponse.json({ ok: false, error: "Erro ao processar notificação." }, { status: 200 });
  }
}
