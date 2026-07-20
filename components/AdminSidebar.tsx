"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, BarChart3, Boxes, CalendarDays, CalendarRange, LogOut, MapPin, Scissors, Settings, UserCog, Users } from "lucide-react";

const links = [
  ["/admin", "Dashboard", BarChart3],
  ["/admin/reservas", "Reservas", CalendarDays],
  ["/admin/calendario", "Calendario", CalendarRange],
  ["/admin/clientes", "Clientes", Users],
  ["/admin/barberos", "Barberos", Users],
  ["/admin/servicios", "Servicios", Scissors],
  ["/admin/productos", "Productos", Boxes],
  ["/admin/sucursales", "Sucursales", MapPin],
  ["/admin/configuracion", "Configuración", Settings],
  ["/admin/fidelizacion", "Fidelización", Award],
  ["/admin/usuarios", "Usuarios", UserCog]
] as const;

export function AdminSidebar() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-logo" aria-label="Vikingos Barber Shop">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-vikingos.png" alt="Vikingos Barber Shop" />
      </Link>
      <nav className="admin-nav">
        {links.map(([href, label, Icon]) => <Link href={href} key={href}><Icon size={18} /><span>{label}</span></Link>)}
        <button onClick={logout}><LogOut size={18} /><span>Cerrar sesión</span></button>
      </nav>
    </aside>
  );
}
