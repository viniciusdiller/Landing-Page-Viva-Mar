"use client";

import { ShieldCheck } from "lucide-react";

// Adicionei props para recebermos os dados da reserva que vem do CheckoutModal
export default function MercadoPagoCheckout({
  room,
  bookingContext,
  guest,
  onClose,
}: any) {
  const handleLocalBooking = async (e: any) => {
    e.preventDefault(); // Impede o botão de recarregar a página sem querer

    try {
      // 1. Vamos debugar pra ver se os dados estão chegando!
      console.log("DADOS QUE CHEGARAM NO BOTAO:", { room, bookingContext });

      // 2. Trava de segurança
      if (!room || !room.id) {
        throw new Error(
          "Os dados do quarto não chegaram no componente de pagamento.",
        );
      }

      // 3. O Fetch Real
      const response = await fetch(
        "http://127.0.0.1:3001/api/public/viva-mar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: room.id,
            checkIn: bookingContext?.checkIn || "2026-05-01",
            checkOut: bookingContext?.checkOut || "2026-05-05",
            amount: (room.pricePerNight || 0) * (bookingContext?.nights || 1),
            guestName: guest?.firstName
              ? `${guest.firstName} ${guest.lastName}`
              : "Vineco (Teste Local)",
          }),
        },
      );

      if (response.ok) {
        alert("Sucesso! Reserva injetada no SaaS Sancho.");
        if (onClose) onClose();
      } else {
        const errorData = await response.json();
        console.error("Erro do servidor:", errorData);
        alert("O servidor respondeu com erro. Veja o console.");
      }
    } catch (error: any) {
      // 4. Agora sim veremos o erro real!
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
            O fluxo do Mercado Pago foi temporariamente desabilitado para testes
            locais com o SaaS Sancho.
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
