import type {
  CheckoutSessionRequest,
  CreatePreferenceRequest,
  CreatePreferenceResponse,
  ProcessPaymentRequest,
  ProcessPaymentResponse,
} from "@/types";

/**
 * Envia os dados que o Payment Brick devolveu (token do cartão, método de
 * pagamento escolhido, etc.) pra nossa própria API route, que guarda o
 * Access Token e efetivamente cria o pagamento no Mercado Pago. A reserva só
 * é criada de fato no SaaS depois que o pagamento é aprovado, pelo webhook —
 * este POST aqui não cria reserva nenhuma.
 */
export async function processPayment(
  formData: Record<string, unknown>,
  booking: CheckoutSessionRequest,
  deviceId?: string,
): Promise<ProcessPaymentResponse> {
  const body: ProcessPaymentRequest = { formData, booking, deviceId };

  const response = await fetch("/api/checkout/process-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Falha ao processar o pagamento. Tente novamente.");
  }

  return data as ProcessPaymentResponse;
}

/**
 * Cria uma preferência do Mercado Pago só pra habilitar a opção de carteira
 * "Mercado Pago" dentro do Payment Brick (o SDK exige um preferenceId pra
 * isso). Cartão e Pix continuam indo direto por processPayment, sem depender
 * dessa preferência.
 */
export async function createCheckoutPreference(
  booking: CheckoutSessionRequest,
): Promise<string> {
  const body: CreatePreferenceRequest = { booking };

  const response = await fetch("/api/checkout/create-preference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Falha ao preparar o pagamento. Tente novamente.");
  }

  return (data as CreatePreferenceResponse).preferenceId;
}

/** Consulta o status atual de um pagamento (usado no polling do Pix). */
export async function getPaymentStatus(paymentId: number): Promise<string> {
  const response = await fetch(`/api/checkout/payment-status/${paymentId}`, {
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Falha ao consultar status do pagamento.");
  }

  return data.status as string;
}
