const processedPaymentIds = new Set<number>();
const MAX_TRACKED_PAYMENT_IDS = 5000;

export function hasProcessedPayment(paymentId: number): boolean {
  return processedPaymentIds.has(paymentId);
}

export function markPaymentProcessed(paymentId: number) {
  if (processedPaymentIds.size >= MAX_TRACKED_PAYMENT_IDS) {
    processedPaymentIds.clear();
  }
  processedPaymentIds.add(paymentId);
}

function getApiBaseUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_VIVAMAR_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error(
      "Defina NEXT_PUBLIC_API_URL para confirmar reservas no SaaS.",
    );
  }

  return baseUrl.replace(/\/$/, "");
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

export function buildReservationNotes(
  metadata: Record<string, unknown>,
  paymentId: number,
) {
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

export async function confirmReservationFromMetadata(
  metadata: Record<string, unknown>,
  paymentId: number,
) {
  if (hasProcessedPayment(paymentId)) {
    return { alreadyProcessed: true };
  }

  const baseUrl = getApiBaseUrl();
  const guestName =
    `${metadata.guest_first_name || ""} ${metadata.guest_last_name || ""}`.trim();
  const internalSecret = process.env.INTERNAL_API_SECRET;

  const response = await fetch(`${baseUrl}/api/public/viva-mar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(internalSecret
        ? {
            Authorization: `Bearer ${internalSecret}`,
            "X-Internal-Secret": internalSecret,
          }
        : {}),
    },
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
      errorBody?.error ||
        `Falha ao confirmar reserva no SaaS (${response.status}).`,
    );
  }

  markPaymentProcessed(paymentId);
  return response.json();
}
