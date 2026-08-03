"use client";

import { initMercadoPago } from "@mercadopago/sdk-react";

let initialized = false;

const SECURITY_SCRIPT_SRC = "https://www.mercadopago.com/v2/security.js";

// Carrega o script de segurança do Mercado Pago, que coleta a "impressão
// digital" do dispositivo/navegador e a expõe em window.MP_DEVICE_SESSION_ID.
// Sem isso, a análise de risco do Mercado Pago não tem nenhum sinal sobre
// quem está pagando e fica bem mais conservadora — na prática, restringe os
// meios de pagamento oferecidos (só libera Pix) mesmo com a conta e o cartão
// em ordem. Só o Payment Brick sozinho NÃO carrega esse script.
function ensureSecurityScriptLoaded() {
  if (document.querySelector(`script[src="${SECURITY_SCRIPT_SRC}"]`)) return;

  const script = document.createElement("script");
  script.src = SECURITY_SCRIPT_SRC;
  script.setAttribute("view", "checkout");
  document.body.appendChild(script);
}

/** Inicializa o SDK client-side do Mercado Pago uma única vez (idempotente). */
export function ensureMercadoPagoInitialized() {
  if (initialized) return;

  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  if (!publicKey) {
    console.error(
      "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY não configurada — o formulário de pagamento não vai carregar.",
    );
    return;
  }

  initMercadoPago(publicKey, { locale: "pt-BR" });
  ensureSecurityScriptLoaded();
  initialized = true;
}
