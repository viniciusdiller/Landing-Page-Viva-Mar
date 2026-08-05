// Integração com o Mercado Pago (Payment Brick — cartão, Pix e Mercado Pago
// embutidos na própria página, sem redirecionar pro site do Mercado Pago).
// Server-only: usa o Access Token secreto, nunca deve ser importado por um
// componente "use client" nem exposto ao navegador.

import { randomUUID } from "crypto";

export interface MercadoPagoPayment {
  id: number;
  status: string;
  statusDetail: string;
  externalReference: string | null;
  transactionAmount: number;
  metadata: Record<string, unknown>;
}

function getAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error(
      "Defina MERCADOPAGO_ACCESS_TOKEN para processar pagamentos pelo Mercado Pago.",
    );
  }

  return token;
}

// Allowlist dos campos que o Payment Brick de fato devolve no onSubmit —
// evita "mass assignment": sem isso, um POST forjado direto pra nossa rota
// (sem passar pelo Brick) poderia injetar campos arbitrários da API de
// pagamentos do Mercado Pago dentro de formData.
const ALLOWED_FORM_DATA_FIELDS = new Set([
  "token",
  "issuer_id",
  "payment_method_id",
  "installments",
  "payer",
  "campaign_id",
]);

function pickAllowedFormData(formData: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(formData).filter(([key]) => ALLOWED_FORM_DATA_FIELDS.has(key)),
  );
}

export interface CreatePaymentInput {
  // Corpo já pronto que veio do Payment Brick (token, payment_method_id,
  // installments, payer, etc.) — o formato varia por método de pagamento
  // (cartão, Pix, boleto), então repassamos só os campos esperados (ver
  // ALLOWED_FORM_DATA_FIELDS).
  formData: Record<string, unknown>;
  // Sobrescreve formData.transaction_amount: nunca confiamos no valor que o
  // Brick manda (roda no navegador, é alterável), sempre usamos o total
  // calculado a partir do que o próprio backend/preço do quarto informou.
  transactionAmount: number;
  description: string;
  externalReference: string;
  notificationUrl?: string;
  metadata?: Record<string, unknown>;
  // Fingerprint do navegador que o SDK do Mercado Pago coleta sozinho
  // (window.MP_DEVICE_SESSION_ID) assim que é carregado. Sem isso, o motor
  // antifraude do Mercado Pago não tem nenhum sinal sobre o dispositivo/
  // sessão de quem está pagando e tende a ser bem mais conservador — na
  // prática, restringindo a cartão/liberando só Pix, ou recusando cartões
  // que seriam aprovados. Enviado como header X-meli-session-id.
  deviceId?: string;
}

// O Mercado Pago recusa a criação do pagamento inteiro se notification_url
// não for uma URL pública válida (ex.: http://localhost:3002/... em dev dá
// "notificaction_url attribute must be url valid"). Em produção (https) isso
// funciona normalmente; em dev local (ou se NEXT_PUBLIC_SITE_URL não estiver
// configurada) a gente simplesmente não informa — o pagamento ainda é
// processado normalmente, só o webhook de confirmação automática da reserva
// não vai disparar (fica só como aviso no log do servidor).
function isPublicHttpsUrl(url: string | undefined): url is string {
  return Boolean(url && url.startsWith("https://"));
}

export interface MercadoPagoPaymentResult {
  id: number;
  status: string;
  statusDetail: string;
  paymentMethodId: string | null;
  paymentTypeId: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
}

export async function createPayment(
  input: CreatePaymentInput,
): Promise<MercadoPagoPaymentResult> {
  if (!isPublicHttpsUrl(input.notificationUrl)) {
    console.warn(
      "MercadoPago: notification_url ausente ou não-https (configure NEXT_PUBLIC_SITE_URL) — o pagamento vai ser processado, mas o webhook não vai confirmar a reserva automaticamente.",
    );
  }

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
      // Evita cobrar duas vezes se o cliente reenviar a mesma requisição
      // (ex.: retry de rede) — cada tentativa nova precisa de uma chave nova.
      "X-Idempotency-Key": randomUUID(),
      ...(input.deviceId ? { "X-meli-session-id": input.deviceId } : {}),
    },
    body: JSON.stringify({
      ...pickAllowedFormData(input.formData),
      transaction_amount: input.transactionAmount,
      description: input.description,
      external_reference: input.externalReference,
      ...(isPublicHttpsUrl(input.notificationUrl)
        ? { notification_url: input.notificationUrl }
        : {}),
      metadata: input.metadata,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const causeMessage = Array.isArray(payload?.cause)
      ? payload.cause.map((c: { description?: string }) => c.description).join(" ")
      : null;
    throw new Error(
      causeMessage || payload?.message || `Falha ao processar pagamento (${response.status}).`,
    );
  }

  const transactionData = payload.point_of_interaction?.transaction_data;

  return {
    id: payload.id,
    status: payload.status,
    statusDetail: payload.status_detail,
    paymentMethodId: payload.payment_method_id ?? null,
    paymentTypeId: payload.payment_type_id ?? null,
    qrCode: transactionData?.qr_code ?? null,
    qrCodeBase64: transactionData?.qr_code_base64 ?? null,
    ticketUrl: transactionData?.ticket_url ?? payload.transaction_details?.external_resource_url ?? null,
  };
}

export interface CreatePreferenceInput {
  items: Array<{ title: string; quantity: number; unitPrice: number }>;
  payerEmail: string;
  externalReference: string;
  notificationUrl?: string;
  metadata?: Record<string, unknown>;
}

// Cria uma preferência do Mercado Pago só pra satisfazer a exigência do
// Payment Brick de ter um preferenceId pra liberar a opção de carteira
// "Mercado Pago" (customization.paymentMethods.mercadoPago). Cartão e Pix
// continuam sendo processados direto via createPayment/v1/payments — essa
// preferência nunca é usada pra redirecionar o hóspede pra fora da página.
export async function createCheckoutPreference(
  input: CreatePreferenceInput,
): Promise<string> {
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify({
      items: input.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: "BRL",
      })),
      payer: { email: input.payerEmail },
      external_reference: input.externalReference,
      ...(isPublicHttpsUrl(input.notificationUrl)
        ? { notification_url: input.notificationUrl }
        : {}),
      metadata: input.metadata,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message || `Falha ao criar preferência de pagamento (${response.status}).`,
    );
  }

  return payload.id as string;
}

const NUMERIC_PAYMENT_ID = /^\d+$/;

export async function getPayment(paymentId: string): Promise<MercadoPagoPayment> {
  if (!NUMERIC_PAYMENT_ID.test(paymentId)) {
    throw new Error("ID de pagamento inválido.");
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message || `Falha ao consultar pagamento ${paymentId} (${response.status}).`,
    );
  }

  return {
    id: payload.id,
    status: payload.status,
    statusDetail: payload.status_detail,
    externalReference: payload.external_reference ?? null,
    transactionAmount: Number(payload.transaction_amount),
    metadata: payload.metadata ?? {},
  };
}
