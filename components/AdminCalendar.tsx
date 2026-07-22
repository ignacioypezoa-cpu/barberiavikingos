"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { formatChileTime } from "@/lib/time";

const colors: Record<string, string> = {
  CONFIRMED: "#3b9b61",
  PENDING: "#d7a62a",
  CANCELLED: "#c64c42",
  COMPLETED: "#3987cf",
  NO_SHOW: "#333"
};

const viewLabels: Record<string, string> = { day: "Dia", week: "Semana", month: "Mes" };

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function overlapsDay(startAt: string, endAt: string, day: Date) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  return new Date(startAt) <= dayEnd && new Date(endAt) >= dayStart;
}

function monthTitle(date: Date, view: string) {
  if (view === "day") return date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (view === "week") return `Semana del ${date.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}`;
  return date.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

export function AdminCalendar() {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [barberFilter, setBarberFilter] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({ branchId: "", barberId: "", startAt: "", endAt: "", reason: "", type: "MANUAL" });

  const load = () => Promise.all([
    fetch("/api/appointments").then((response) => response.json()),
    fetch("/api/admin/blocks").then((response) => response.json()),
    fetch("/api/admin/branches").then((response) => response.json()),
    fetch("/api/admin/barbers").then((response) => response.json())
  ]).then(([appointmentsData, blocksData, branchesData, barbersData]) => {
    setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
    setBlocks(Array.isArray(blocksData) ? blocksData : []);
    setBranches(Array.isArray(branchesData) ? branchesData : []);
    setBarbers(Array.isArray(barbersData) ? barbersData : []);
  });

  useEffect(() => { load(); }, []);

  const days = useMemo(() => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    const count = view === "day" ? 1 : view === "week" ? 7 : 42;
    const base = view === "day" ? new Date(date) : view === "week" ? new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay()) : start;
    return Array.from({ length: count }, (_, index) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + index));
  }, [date, view]);

  const visibleAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => !barberFilter || appointment.barberId === barberFilter)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [appointments, barberFilter]);

  const visibleBlocks = useMemo(() => {
    return blocks.filter((block) => !barberFilter || !block.barberId || block.barberId === barberFilter);
  }, [blocks, barberFilter]);

  function move(direction: -1 | 1) {
    setDate((current) => {
      if (view === "day") return new Date(current.getFullYear(), current.getMonth(), current.getDate() + direction);
      if (view === "week") return new Date(current.getFullYear(), current.getMonth(), current.getDate() + direction * 7);
      return new Date(current.getFullYear(), current.getMonth() + direction, 1);
    });
  }

  async function drop(event: React.DragEvent, day: Date) {
    const id = event.dataTransfer.getData("id");
    const item = appointments.find((appointment) => appointment.id === id);
    if (!item) return;
    const old = new Date(item.startAt);
    const start = new Date(day);
    start.setHours(old.getHours(), old.getMinutes());
    const response = await fetch(`/api/admin/appointments/${id}/reschedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt: start.toISOString() })
    });
    if (!response.ok) alert((await response.json()).error);
    load();
  }

  async function block() {
    const response = await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (response.ok) {
      setShow(false);
      load();
    } else alert((await response.json()).error);
  }

  async function del(id: string) {
    if (!confirm("Eliminar este bloqueo?")) return;
    await fetch(`/api/admin/blocks/${id}`, { method: "DELETE" });
    load();
  }

  return <>
    <header className="admin-top">
      <div>
        <h1>Calendario</h1>
        <p>Agenda total de reservas. Filtra por barbero para revisar su disponibilidad.</p>
      </div>
      <button className="button button-small" onClick={() => setShow(true)}><Plus size={15} /> Bloquear horario</button>
    </header>

    <div className="calendar-toolbar">
      <div className="calendar-nav">
        <button onClick={() => move(-1)}><ChevronLeft size={18} /></button>
        <strong>{monthTitle(date, view)}</strong>
        <button onClick={() => move(1)}><ChevronRight size={18} /></button>
      </div>
      <div className="calendar-controls">
        <select value={barberFilter} onChange={(event) => setBarberFilter(event.target.value)}>
          <option value="">Agenda total</option>
          {barbers.map((barber) => <option value={barber.id} key={barber.id}>{barber.firstName} {barber.lastName}</option>)}
        </select>
        <div className="calendar-view-tabs">
          {["day", "week", "month"].map((item) => <button className={view === item ? "active" : ""} onClick={() => setView(item)} key={item}>{viewLabels[item]}</button>)}
        </div>
      </div>
    </div>

    <div className={`calendar-grid view-${view}`}>
      {days.map((day) => {
        const dayAppointments = visibleAppointments.filter((appointment) => sameDay(new Date(appointment.startAt), day));
        const dayBlocks = visibleBlocks.filter((block) => overlapsDay(block.startAt, block.endAt, day));
        return <div className={`calendar-day ${day.getMonth() !== date.getMonth() && view === "month" ? "muted" : ""}`} key={day.toISOString()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, day)}>
          <span className="day-number">{day.getDate()}</span>
          <div className="calendar-day-items">
            {dayAppointments.map((appointment) => <div draggable onDragStart={(event) => event.dataTransfer.setData("id", appointment.id)} className="calendar-event" style={{ borderLeftColor: colors[appointment.status] }} key={appointment.id}>
              <strong>{formatChileTime(new Date(appointment.startAt))} {appointment.customer.name}</strong>
              <span>{appointment.service.name} - {appointment.barber.firstName}</span>
            </div>)}
            {dayBlocks.map((block) => <div className="calendar-block" key={`${block.id}-${day.toISOString()}`}>
              <span>{block.reason}{block.barber ? ` - ${block.barber.firstName}` : ""}</span>
              <button onClick={() => del(block.id)}><Trash2 size={12} /></button>
            </div>)}
          </div>
        </div>;
      })}
    </div>

    {show && <div className="modal-backdrop"><div className="admin-modal">
      <div className="modal-head"><div><h2>Bloquear horario</h2><p>Colacion, vacaciones o bloqueo manual.</p></div><button onClick={() => setShow(false)}>x</button></div>
      <div className="field-grid">
        <div className="field"><label>Sucursal</label><select value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })}><option value="">Selecciona</option>{branches.map((branch) => <option value={branch.id} key={branch.id}>{branch.name}</option>)}</select></div>
        <div className="field"><label>Barbero (vacio = toda la sucursal)</label><select value={form.barberId} onChange={(event) => setForm({ ...form, barberId: event.target.value })}><option value="">Todos</option>{barbers.filter((barber) => !form.branchId || barber.branchId === form.branchId).map((barber) => <option value={barber.id} key={barber.id}>{barber.firstName} {barber.lastName}</option>)}</select></div>
        <div className="field"><label>Inicio</label><input type="datetime-local" value={form.startAt} onChange={(event) => setForm({ ...form, startAt: event.target.value })} /></div>
        <div className="field"><label>Fin</label><input type="datetime-local" value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} /></div>
        <div className="field"><label>Tipo</label><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="MANUAL">Manual</option><option value="BREAK">Colacion</option><option value="VACATION">Vacaciones</option></select></div>
        <div className="field"><label>Motivo</label><input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></div>
      </div>
      <div className="modal-actions"><button className="button button-outline" onClick={() => setShow(false)}>Cancelar</button><button className="button" onClick={block}>Guardar bloqueo</button></div>
    </div></div>}
  </>;
}
