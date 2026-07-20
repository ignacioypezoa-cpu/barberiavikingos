import Link from "next/link";
import { Instagram, Scissors } from "lucide-react";

export function Footer({ config }: { config: any }) {
  return (
    <footer className="footer">
      <div>
        <div className="brand footer-brand">
          <span className="brand-mark"><Scissors size={18} /></span>
          <span>{config.businessName}<small>BARBER CLUB</small></span>
        </div>
        <p>El oficio de siempre, elevado a una experiencia contemporánea.</p>
      </div>
      <div>
        <h4>Explora</h4>
        <Link href="/#servicios">Servicios</Link>
        <Link href="/reservar">Reservar hora</Link>
        <Link href="/productos">Tienda</Link>
        <Link href="/mis-reservas">Mis reservas</Link>
      </div>
      <div>
        <h4>Visítanos</h4>
        <p>{config.address}</p>
        <p>{config.generalHours}</p>
        {config.instagram && <a href={`https://instagram.com/${config.instagram.replace("@","")}`} target="_blank" rel="noreferrer"><Instagram size={16} /> @{config.instagram.replace("@","")}</a>}
      </div>
      <div className="footer-bottom">
        <span>© 2026 {config.businessName}</span>
        <Link href="/admin/login">Acceso equipo</Link>
      </div>
    </footer>
  );
}
