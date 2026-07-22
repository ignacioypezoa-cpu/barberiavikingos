"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, BarChart3, Boxes, CalendarDays, CalendarRange, LogOut, MapPin, Scissors, Settings, UserCog, Users } from "lucide-react";
import type { Role } from "@/generated/prisma";

const links = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, roles: ["ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarDays, roles: ["ADMIN", "BRANCH_MANAGER", "BARBER"] },
  { href: "/admin/calendario", label: "Calendario", icon: CalendarRange, roles: ["ADMIN", "BRANCH_MANAGER", "BARBER"] },
  { href: "/admin/clientes", label: "Clientes", icon: Users, roles: ["ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/barberos", label: "Barberos", icon: Users, roles: ["ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/servicios", label: "Servicios", icon: Scissors, roles: ["ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/productos", label: "Productos", icon: Boxes, roles: ["ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/sucursales", label: "Sucursales", icon: MapPin, roles: ["ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/configuracion", label: "Configuracion", icon: Settings, roles: ["ADMIN"] },
  { href: "/admin/fidelizacion", label: "Fidelizacion", icon: Award, roles: ["ADMIN"] },
  { href: "/admin/usuarios", label: "Usuarios", icon: UserCog, roles: ["ADMIN"] }
] as const;

export function AdminSidebar({ role }: { role: Role }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <aside className="admin-sidebar">
      <Link href={role === "BARBER" ? "/admin/reservas" : "/admin"} className="admin-logo" aria-label="Vikingos Barber Shop">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-vikingos.png" alt="Vikingos Barber Shop" />
      </Link>
      <nav className="admin-nav">
        {links.filter((link) => (link.roles as readonly Role[]).includes(role)).map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon size={18} /><span>{label}</span></Link>)}
        <button onClick={logout}><LogOut size={18} /><span>Cerrar sesion</span></button>
      </nav>
    </aside>
  );
}
