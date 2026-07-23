import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5522992027273"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle size={28} fill="white" strokeWidth={0} />
    </a>
  );
}
