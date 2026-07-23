"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5522992027273";
const BUBBLE_DELAY_MS = 2000;

export default function WhatsAppButton() {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), BUBBLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {showBubble && (
        <div className="relative max-w-[240px] animate-chat-pop rounded-2xl rounded-br-sm bg-white px-4 py-3 shadow-modal">
          <button
            type="button"
            onClick={() => setShowBubble(false)}
            aria-label="Fechar mensagem"
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-400 text-white transition-colors hover:bg-gray-500"
          >
            <X size={12} />
          </button>
          <p className="text-sm leading-snug text-[var(--color-text)]">
            Quer falar diretamente conosco?{" "}
            <span className="font-semibold">
              Clique no botão abaixo
            </span>
          </p>
          <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-white" />
        </div>
      )}

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fale conosco pelo WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle size={28} fill="white" strokeWidth={0} />
      </a>
    </div>
  );
}
