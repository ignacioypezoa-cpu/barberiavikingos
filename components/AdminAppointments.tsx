"use client";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { formatChileDate, formatChileTime } from "@/lib/time";

const labels: Record<string, string> = { PENDING: "Pendiente", CONFIRMED: "Confirmada", CANCELLED: "Cancelada", COMPLETED: "Atendida", NO_SHOW: "No asistió" };
export function AdminAppointments() {
  const [rows, setRows] = useState<any[]>([]); const [branches, setBranches] = useState<any[]>([]); const [barbers, setBarbers] = useState<any[]>([]);
  const [filters, setFilters] = useState({ date: "", branchId: "", barberId: "", status: "", q: "" }); const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const query = new URLSearchParams(Object.entries(filters).filter(([,v]) => v));
    const response = await fetch(`/api/appointments?${query}`); if (response.ok) setRows(await response.json());
  }, [filters]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { Promise.all([fetch("/api/admin/branches").then((r) => r.json()), fetch("/api/admin/barbers").then((r) => r.json())]).then(([b, ba]) => { setBranches(b); setBarbers(ba); }); }, []);
  async function status(id: string, value: string) { const response = await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: value }) }); if (response.ok) { setMessage("Estado actualizado correctamente."); load(); } }
  return <>
    <header className="admin-top"><div><h1>Reservas</h1><p>Todas las horas creadas desde la web pública.</p></div></header>
    {message && <div className="admin-alert success">{message}<button onClick={() => setMessage("")}>×</button></div>}
    <div className="panel">
      <div className="filter-bar"><div className="admin-search"><Search size={16}/><input placeholder="Cliente, teléfono o correo" value={filters.q} onChange={(e) => setFilters({...filters,q:e.target.value})}/></div>
        <input type="date" value={filters.date} onChange={(e) => setFilters({...filters,date:e.target.value})}/>
        <select value={filters.branchId} onChange={(e) => setFilters({...filters,branchId:e.target.value})}><option value="">Todas las sucursales</option>{branches.map((b)=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <select value={filters.barberId} onChange={(e) => setFilters({...filters,barberId:e.target.value})}><option value="">Todos los barberos</option>{barbers.map((b)=><option key={b.id} value={b.id}>{b.firstName} {b.lastName}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({...filters,status:e.target.value})}><option value="">Todos los estados</option>{Object.entries(labels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
      </div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Fecha / hora</th><th>Cliente</th><th>Sucursal</th><th>Barbero</th><th>Servicio</th><th>Creada</th><th>Estado</th></tr></thead><tbody>
        {rows.map((r)=><tr key={r.id}><td><strong>{formatChileDate(new Date(r.startAt))}</strong><br/>{formatChileTime(new Date(r.startAt))}</td><td><strong>{r.customer.name}</strong><br/><small>{r.customer.phone} · {r.customer.email}</small></td><td>{r.branch.name}</td><td>{r.barber.firstName} {r.barber.lastName}</td><td>{r.service.name}</td><td>{formatChileDate(new Date(r.createdAt))}</td><td><select className="status-select" value={r.status} onChange={(e)=>status(r.id,e.target.value)}>{Object.entries(labels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></td></tr>)}
      </tbody></table></div>
    </div>
  </>;
}
