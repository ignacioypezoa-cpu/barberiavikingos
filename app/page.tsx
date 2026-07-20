import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { clp } from "@/lib/data";
import { getPublicCatalog } from "@/lib/public-data";

export default async function Home() {
  const { config, services, barbers, branches } = await getPublicCatalog();
  if (!config) throw new Error("Configuración no encontrada.");
  return (
    <PublicShell>
      <section className="hero" style={{ ["--hero-image" as string]: `url("${config.heroImage || ""}")` }}>
        <div className="hero-content">
          <span className="eyebrow">Barbería contemporánea · Santiago</span>
          <h1>{config.heroTitle.split(". ")[0]}.<br /><em>{config.heroTitle.split(". ").slice(1).join(". ")}</em></h1>
          <p>{config.heroSubtitle}</p>
          <div className="hero-actions">
            <Link href="/reservar" className="button"><CalendarDays size={17} /> Reservar hora</Link>
            <Link href="#servicios" className="button button-outline">Ver servicios <ArrowRight size={16} /></Link>
          </div>
        </div>
        <span className="hero-note">SCROLL PARA DESCUBRIR · 01</span>
      </section>

      <section className="section" id="servicios">
        <div className="section-head">
          <div>
            <span className="eyebrow">Lo que hacemos</span>
            <h2 className="section-title">El ritual, a tu medida.</h2>
          </div>
          <p className="section-intro">Servicios pensados sin apuro y ejecutados con precisión. Cada visita comienza escuchándote y termina con un estilo que se siente propio.</p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <article className="service-card" key={service.id}>
              {service.image && <Image src={service.image} alt={service.name} fill sizes="(max-width: 720px) 100vw, 25vw" />}
              <div className="service-content">
                <span className="service-number">0{index + 1}</span>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="service-meta"><span>{service.duration} min</span><strong>{clp(service.price)}</strong></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="experience">
        <div className="experience-image" />
        <div className="experience-copy">
          <span className="eyebrow">Más que un corte</span>
          <h2>Una pausa bien merecida.</h2>
          <p>En Vikingos creemos que la barbería sigue siendo uno de esos pocos lugares donde el tiempo baja la velocidad. Café de especialidad, buena música y profesionales que conocen tu nombre —y tu corte.</p>
          <div className="stats">
            <div><strong>12+</strong><span>Años de oficio</span></div>
            <div><strong>8k</strong><span>Clientes felices</span></div>
            <div><strong>4.9</strong><span>Nota promedio</span></div>
          </div>
        </div>
      </section>

      <section className="section section-dark" id="barberos">
        <div className="section-head">
          <div>
            <span className="eyebrow">El equipo</span>
            <h2 className="section-title">Manos expertas.</h2>
          </div>
          <Link href="/reservar" className="text-link">Agenda con tu barbero</Link>
        </div>
        <div className="barber-grid">
          {barbers.map((barber) => (
            <article className="barber-card" key={barber.id}>
              {barber.photo && <Image src={barber.photo} alt={`${barber.firstName} ${barber.lastName}`} width={800} height={1000} />}
              <div className="barber-info">
                <h3>{barber.firstName} {barber.lastName}</h3>
                <span>{barber.specialty}</span>
                <p>{barber.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="sucursales">
        <div className="section-head">
          <div>
            <span className="eyebrow">Dónde estamos</span>
            <h2 className="section-title">Tu Vikingos más cercano.</h2>
          </div>
        </div>
        <div className="branch-grid">
          {branches.map((branch) => (
            <article className="branch-card" key={branch.id}>
              {branch.image && <Image src={branch.image} alt={branch.name} fill sizes="(max-width: 720px) 100vw, 50vw" />}
              <div className="branch-info">
                <h3>{branch.name}</h3>
                <p>{branch.address}, {branch.commune}</p>
                <p>Lun–Sáb · {branch.openingTime}–{branch.closingTime}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta">
        <span className="eyebrow">Tu momento</span>
        <h2>¿Listo para verte como quieres sentirte?</h2>
        <Link href="/reservar" className="button">Reservar mi hora <ArrowRight size={17} /></Link>
      </section>
    </PublicShell>
  );
}
