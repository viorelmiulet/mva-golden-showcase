import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/40767941512?text=Salut!%20Sunt%20interesat%20de%20apartamentele%20din%20portofoliul%20vostru.%20Imi%20puteti%20oferi%20mai%20multe%20detalii%3F"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 lg:hidden flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BD5C] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 touch-manipulation"
      aria-label="Contactează-ne pe WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
      
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30"></span>
    </a>
  );
};

export default WhatsAppButton;
