import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";
import { getPublicCatalog } from "@/lib/public-data";

export const metadata: Metadata = { title: "Contacto" };

export default async function ContactPage() {
  const { branches } = await getPublicCatalog();
  return (
    <PublicShell>
      <section className="page-hero">
        <span className="eyebrow">Hablemos</span><h1>Estamos para ayudarte.</h1>
        <p>¿Tienes una consulta, necesitas mover tu reserva o quieres trabajar con nosotros? Escríbenos.</p>
      </section>
      <section className="page-content">
        <div className="form-card">
          <div className="field-grid">
            <div className="field"><label>Nombre</label><input placeholder="Tu nombre" /></div>
            <div className="field"><label>Correo</label><input type="email" placeholder="tu@correo.cl" /></div>
            <div className="field field-full"><label>Mensaje</label><textarea rows={6} placeholder="¿En qué podemos ayudarte?" /></div>
          </div>
          <button className="button" style={{ marginTop: 22 }}>Enviar mensaje</button>
          <div className="choice-grid" style={{ marginTop: 40 }}>
            {branches.map((branch) => <div className="choice" key={branch.id}><strong>{branch.name}</strong><span>{branch.address} · {branch.phone}<br />Lun–Sáb · {branch.openingTime}–{branch.closingTime}</span></div>)}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
