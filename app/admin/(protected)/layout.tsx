import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return (
    <div className="admin-shell">
      <AdminSidebar role={session.role} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
