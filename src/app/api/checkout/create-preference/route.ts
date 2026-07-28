import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createCheckoutPreference } from "@/lib/mercadopago";
import type { CheckoutSessionRequest } from "@/types";

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error(
      "Defina NEXT_PUBLIC_SITE_URL para gerar as URLs de retorno do Mercado Pago.",
    );
  }

  return siteUrl.replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutSessionRequest;

    if (!body.roomId || !body.checkIn || !body.checkOut || !body.guest?.email) {
      return NextResponse.json(
        { error: "Dados de reserva incompletos." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(body.total) || body.total <= 0) {
      return NextResponse.json(
        { error: "Valor da reserva inválido." },
        { status: 400 },
      );
    }

    const siteUrl = getSiteUrl();
    const externalReference = randomUUID();

    const roomAmount = Math.max(0, body.subtotal - body.discountAmount);

    const items = [
      {
        title: `${body.roomName} — ${body.nights} noite(s)`,
        quantity: 1,
        unitPrice: Number(roomAmount.toFixed(2)),
      },
      ...body.packages
        .filter((pkg) => pkg.quantity > 0)
        .map((pkg) => ({
          title: pkg.name,
          quantity: pkg.quantity,
          unitPrice: Number(pkg.price.toFixed(2)),
        })),
    ];

    const preference = await createCheckoutPreference({
      items,
      externalReference,
      payerName: body.guest.firstName,
      payerEmail: body.guest.email,
      backUrls: {
        success: `${siteUrl}/reserva/sucesso`,
        pending: `${siteUrl}/reserva/pendente`,
        failure: `${siteUrl}/reserva/erro`,
      },
      notificationUrl: `${siteUrl}/api/webhooks/mercadopago`,
      metadata: {
        room_id: body.roomId,
        room_name: body.roomName,
        check_in: body.checkIn,
        check_out: body.checkOut,
        guests: body.guests,
        guest_first_name: body.guest.firstName,
        guest_last_name: body.guest.lastName,
        guest_email: body.guest.email,
        guest_phone: body.guest.phone,
        guest_cpf: body.guest.cpf || "",
        special_requests: body.guest.specialRequests || "",
        coupon_code: body.discountCode || "",
        packages_json: JSON.stringify(
          body.packages
            .filter((pkg) => pkg.quantity > 0)
            .map((pkg) => ({ name: pkg.name, quantity: pkg.quantity, price: pkg.price })),
        ),
        total: body.total,
      },
    });

    return NextResponse.json(
      { initPoint: preference.initPoint },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar preferência de pagamento:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao criar preferência de pagamento",
      },
      { status: 500 },
    );
  }
}
