import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createPayment } from "@/lib/mercadopago";
import type { ProcessPaymentRequest } from "@/types";

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error(
      "Defina NEXT_PUBLIC_SITE_URL para gerar a URL de notificação do Mercado Pago.",
    );
  }

  return siteUrl.replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const { formData, booking, deviceId } = (await request.json()) as ProcessPaymentRequest;

    if (!booking?.roomId || !booking.checkIn || !booking.checkOut || !booking.guest?.email) {
      return NextResponse.json({ error: "Dados de reserva incompletos." }, { status: 400 });
    }

    if (!Number.isFinite(booking.total) || booking.total <= 0) {
      return NextResponse.json({ error: "Valor da reserva inválido." }, { status: 400 });
    }

    if (!formData || typeof formData !== "object") {
      return NextResponse.json({ error: "Dados de pagamento ausentes." }, { status: 400 });
    }

    const siteUrl = getSiteUrl();
    const externalReference = randomUUID();

    const payment = await createPayment({
      formData,
      transactionAmount: Number(booking.total.toFixed(2)),
      description: `${booking.roomName} — ${booking.nights} noite(s)`,
      externalReference,
      notificationUrl: `${siteUrl}/api/webhooks/mercadopago`,
      deviceId,
      metadata: {
        room_id: booking.roomId,
        room_name: booking.roomName,
        check_in: booking.checkIn,
        check_out: booking.checkOut,
        guests: booking.guests,
        guest_first_name: booking.guest.firstName,
        guest_last_name: booking.guest.lastName,
        guest_email: booking.guest.email,
        guest_phone: booking.guest.phone,
        guest_cpf: booking.guest.cpf || "",
        guest_cep: booking.guest.cep || "",
        guest_address: booking.guest.address || "",
        guest_address_number: booking.guest.addressNumber || "",
        guest_address_complement: booking.guest.addressComplement || "",
        guest_neighborhood: booking.guest.neighborhood || "",
        guest_city: booking.guest.city || "",
        guest_state: booking.guest.state || "",
        special_requests: booking.guest.specialRequests || "",
        coupon_code: booking.discountCode || "",
        packages_json: JSON.stringify(
          booking.packages
            .filter((pkg) => pkg.quantity > 0)
            .map((pkg) => ({ name: pkg.name, quantity: pkg.quantity, price: pkg.price })),
        ),
        total: booking.total,
      },
    });

    return NextResponse.json(
      {
        status: payment.status,
        statusDetail: payment.statusDetail,
        paymentId: payment.id,
        qrCode: payment.qrCode,
        qrCodeBase64: payment.qrCodeBase64,
        ticketUrl: payment.ticketUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao processar pagamento",
      },
      { status: 500 },
    );
  }
}
