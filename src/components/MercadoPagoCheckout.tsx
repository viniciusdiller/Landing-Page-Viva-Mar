"use client";

import { ShieldCheck } from "lucide-react";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
// Atualizamos para receber o guest e o total
export default function MercadoPagoCheckout({
  room,
  bookingContext,
  guest,
  total,
  onClose,
}: any) {
  const handleLocalBooking = async (e: any) => {
    e.preventDefault();

    try {
      if (!room || !room.id) {
        throw new Error(
          "Os dados do quarto não chegaram no componente de pagamento.",
        );
      }

      if (!bookingContext?.checkIn || !bookingContext?.checkOut) {
        alert(
          "Por favor, selecione as datas de Check-in e Check-out no calendário antes de prosseguir.",
        );
        return;
      }

      if (!guest?.firstName || !guest?.email || !guest?.phone) {
        alert(
          "Por favor, preencha nome, e-mail e telefone antes de prosseguir.",
        );
        return;
      }

      const response = await fetch(`${API_URL}/api/public/viva-mar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          checkIn: bookingContext.checkIn,
          checkOut: bookingContext.checkOut,
          amount: total,
          guestName: `${guest.firstName} ${guest.lastName}`.trim(),
          guestEmail: guest.email,
          guestPhone: guest.phone,
          guestCpf: guest.cpf,
          notes: guest.specialRequests || "Nenhuma observação.",
        }),
      });

      if (response.ok) {
        alert("Reserva confirmada! Os dados reais foram salvos no SaaS.");
        if (onClose) onClose();
      } else {
        const errorData = await response.json();
        console.error("Erro do servidor:", errorData);
        alert("O servidor respondeu com erro. Veja o console.");
      }
    } catch (error: any) {
      console.error("ERRO NO JAVASCRIPT:", error);
      alert(`Erro no código da Landing Page: ${error.message}`);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface-2)]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="mb-1 text-base font-bold text-vm-teal-800">
            Modo de Teste Local Ativado
          </h4>
          <p className="text-xs text-vm-muted">
            O fluxo do Mercado Pago está desabilitado. A reserva será salva no
            banco de dados.
          </p>
        </div>
        <ShieldCheck className="text-vm-teal-600" size={18} />
      </div>

      <button
        type="button"
        onClick={(e) => handleLocalBooking(e)}
        className="w-full py-3 rounded-md font-bold text-white bg-vm-teal-600 hover:bg-vm-teal-700 transition-colors"
      >
        SIMULAR PAGAMENTO E RESERVAR
      </button>
    </section>
  );
}
