import { MessageCircle } from 'lucide-react';

export const FloatingWhatsApp = () => {
  const whatsappUrl =
    'https://wa.me/5531999471983?text=Olá,%20gostaria%20de%20agendar%20uma%20consultoria.';

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl animate-whatsapp transition-transform hover:scale-110 flex items-center justify-center"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle size={32} fill="currentColor" />
    </a>
  );
};
