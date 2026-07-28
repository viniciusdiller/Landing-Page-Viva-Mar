// Integração com o Mercado Pago (Checkout Pro).
// Server-only: usa o Access Token secreto, nunca deve ser importado por um
// componente "use client" nem exposto ao navegador.

export interface MercadoPagoPreferenceItem {
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePreferenceInput {
  items: MercadoPagoPreferenceItem[];
  externalReference: string;
  payerName?: string;
  payerEmail?: string;
  metadata?: Record<string, unknown>;
  backUrls: {
    success: string;
    pending: string;
    failure: string;
  };
  notificationUrl: string;
}

// O Mercado Pago só respeita "auto_return" (redirecionamento automático de
// volta pro site após o pagamento) quando back_urls.success é https — em
// localhost/http ele rejeita a preferência inteira com "auto_return invalid.
// back_url.success must be defined". Em produção (https) isso liga sozinho.
function shouldAutoReturn(successUrl: string) {
  return successUrl.startsWith("https://");
}

export interface MercadoPagoPreference {
  id: string;
  initPoint: string;
}

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

export async function createCheckoutPreference(
  input: CreatePreferenceInput,
): Promise<MercadoPagoPreference> {
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({
      items: input.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: "BRL",
      })),
      payer: {
        name: input.payerName,
        email: input.payerEmail,
      },
      external_reference: input.externalReference,
      metadata: input.metadata,
      back_urls: {
        success: input.backUrls.success,
        pending: input.backUrls.pending,
        failure: input.backUrls.failure,
      },
      ...(shouldAutoReturn(input.backUrls.success) ? { auto_return: "approved" } : {}),
      notification_url: input.notificationUrl,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message || `Falha ao criar preferência de pagamento (${response.status}).`,
    );
  }

  return {
    id: payload.id,
    initPoint: payload.init_point,
  };
}

export async function getPayment(paymentId: string): Promise<MercadoPagoPayment> {
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
