import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Acceso administrativo", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-visual">
        <Link href="/" className="login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-vikingos.png" alt="Vikingos Barber Shop" />
        </Link>
        <div className="login-copy">
          <h1>El negocio, bajo control.</h1>
          <p>Reservas, equipo, inventario y ventas en un solo lugar.</p>
        </div>
      </section>
      <section className="login-panel"><LoginForm /></section>
    </main>
  );
}
