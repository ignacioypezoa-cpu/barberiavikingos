import { notFound } from "next/navigation";
import { AdminCrud } from "@/components/AdminCrud";
import { AdminAppointments } from "@/components/AdminAppointments";
import { AdminConfig } from "@/components/AdminConfig";
import { AdminCustomers } from "@/components/AdminCustomers";
import { AdminCalendar } from "@/components/AdminCalendar";
import { getSession } from "@/lib/auth";

const valid = ["reservas", "calendario", "clientes", "barberos", "servicios", "productos", "sucursales", "configuracion", "fidelizacion", "usuarios"];
const byRole = {
  ADMIN: valid,
  BRANCH_MANAGER: ["reservas", "calendario", "clientes", "barberos", "servicios", "productos", "sucursales"],
  BARBER: ["reservas", "calendario"]
} as const;

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!valid.includes(section)) notFound();
  const session = await getSession();
  if (!session || !(byRole[session.role] as readonly string[]).includes(section)) notFound();
  if (section === "reservas") return <AdminAppointments />;
  if (section === "calendario") return <AdminCalendar />;
  if (section === "clientes") return <AdminCustomers />;
  if (section === "configuracion") return <AdminConfig />;
  return <AdminCrud section={section} />;
}
