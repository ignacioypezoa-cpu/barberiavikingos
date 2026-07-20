import { MessageCircle } from "lucide-react";

export function WhatsApp({ number }: { number?: string | null }) {
  const clean = (number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  return (
    <a
      className="whatsapp"
      href={`https://wa.me/${clean}?text=Hola,%20quisiera%20hacer%20una%20consulta`}
      target="_blank"
      rel="noreferrer"
      aria-label="Escríbenos por WhatsApp"
    >
      <MessageCircle />
    </a>
  );
}
