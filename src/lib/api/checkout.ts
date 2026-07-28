import type { CheckoutSessionRequest, CheckoutSessionResponse } from "@/types";

/**
 * Cria a preferência de pagamento no Mercado Pago (via nossa própria API
 * route, que guarda o Access Token) e devolve a URL do Checkout Pro para
 * onde o navegador deve ser redirecionado. A reserva só é criada de fato no
 * SaaS depois que o Mercado Pago confirma o pagamento pelo webhook — este
 * POST aqui não cria reserva nenhuma.
 */
export async function createCheckoutSession(
  input: CheckoutSessionRequest,
): Promise<CheckoutSessionResponse> {
  const response = await fetch("/api/checkout/create-preference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || "Falha ao iniciar o pagamento. Tente novamente.",
    );
  }

  return data as CheckoutSessionResponse;
}
