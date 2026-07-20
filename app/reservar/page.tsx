import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";
import { BookingFlow } from "@/components/BookingFlow";
import { getPublicCatalog } from "@/lib/public-data";

export const metadata: Metadata = { title: "Reservar hora", description: "Agenda tu servicio de barbería en pocos pasos." };

export default async function BookingPage() {
  const { branches, services, barbers } = await getPublicCatalog();
  return (
    <PublicShell>
      <section className="page-hero">
        <span className="eyebrow">Reserva online</span>
        <h1>Tu próxima visita.</h1>
        <p>Elige el servicio, tu barbero y el horario que mejor te acomode. Sin llamadas, sin esperas.</p>
      </section>
      <section className="page-content"><BookingFlow branches={branches} services={services} barbers={barbers} /></section>
    </PublicShell>
  );
}
