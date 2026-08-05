// Recalcula o preço de uma reserva inteiramente a partir de dados
// confiáveis do servidor (preço do quarto, pacotes e cupom vindos do
// Saas-Sancho) — nunca a partir do `booking.total` que o cliente manda.
// Server-only: usado pelas rotas de pagamento pra nunca cobrar um valor
// diferente do que a pousada realmente definiu pro período/pacotes pedidos.

import { calcNights } from "@/lib/booking";
import { fetchPublicRooms } from "@/lib/api/rooms";
import { fetchPackages } from "@/lib/api/packages";
import type { CheckoutSessionRequest } from "@/types";

export interface AuthoritativePrice {
  subtotal: number;
  packagesTotal: number;
  discountAmount: number;
  total: number;
}

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

function getViaMarApiBaseUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_VIVAMAR_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("Defina NEXT_PUBLIC_API_URL para validar o preço da reserva.");
  }

  return baseUrl.replace(/\/$/, "");
}

async function fetchDiscountPercentage(code: string): Promise<number> {
  const baseUrl = getViaMarApiBaseUrl();

  const response = await fetch(`${baseUrl}/api/public/viva-mar/validate-coupon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.valid) {
    // Cupom inválido/expirado no momento da cobrança: ignora o desconto em
    // vez de travar o pagamento — o valor autoritativo sem desconto ainda
    // assim nunca deixa o cliente pagar menos do que devido.
    return 0;
  }

  return Number(data.discountPercentage) || 0;
}

/**
 * Recalcula subtotal/pacotes/desconto/total a partir de dados vindos do
 * Saas-Sancho, ignorando qualquer valor de preço que o cliente tenha
 * mandado. Lança PricingError com uma mensagem segura pra devolver ao
 * cliente quando a reserva pedida não é válida (quarto indisponível,
 * capacidade excedida, estadia mínima não atingida, etc.).
 */
export async function computeAuthoritativePrice(
  booking: CheckoutSessionRequest,
): Promise<AuthoritativePrice> {
  const nights = calcNights(booking.checkIn, booking.checkOut);
  if (nights <= 0) {
    throw new PricingError("Datas de check-in/check-out inválidas.");
  }

  const rooms = await fetchPublicRooms({
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
  });
  const room = rooms.find((item) => item.id === booking.roomId);

  if (!room) {
    throw new PricingError("Quarto não encontrado.");
  }

  if (!room.available) {
    throw new PricingError("Quarto sem disponibilidade para as datas selecionadas.");
  }

  if (booking.guests > room.capacity) {
    throw new PricingError(
      `Este quarto acomoda até ${room.capacity} hóspedes.`,
    );
  }

  const minimumStayNights = Math.max(room.minStayNights ?? 0, room.minStayDays ?? 0);
  if (minimumStayNights > 0 && nights < minimumStayNights) {
    throw new PricingError(
      `Este quarto exige estadia mínima de ${minimumStayNights} noites.`,
    );
  }

  const subtotal = room.pricePerNight * nights;

  const availablePackages = await fetchPackages();
  const packagesTotal = booking.packages
    .filter((selected) => selected.quantity > 0)
    .reduce((total, selected) => {
      const canonical = availablePackages.find((pkg) => pkg.id === selected.id);
      // Pacote desconhecido/removido é ignorado — nunca soma o preço que o
      // cliente mandou pra ele.
      return canonical ? total + canonical.price * selected.quantity : total;
    }, 0);

  const discountPercentage = booking.discountCode
    ? await fetchDiscountPercentage(booking.discountCode)
    : 0;
  const discountAmount = (subtotal * discountPercentage) / 100;

  const total = Math.max(0, subtotal + packagesTotal - discountAmount);

  return { subtotal, packagesTotal, discountAmount, total };
}
