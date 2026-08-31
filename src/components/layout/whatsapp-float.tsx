import WhatsAppIcon from '@/components/icons/whatsapp';

export default function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/918449008009?text=Hello%20Success%20Point%20Computer,%20I%20have%20an%20enquiry."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-105"
    >
      <WhatsAppIcon className="h-6 w-6 fill-current" />
      <span className="font-semibold text-sm hidden sm:inline">Chat with us</span>
    </a>
  );
}
