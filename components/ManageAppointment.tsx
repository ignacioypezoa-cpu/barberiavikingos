"use client";
import { useEffect, useState } from "react";
import { CalendarClock, CalendarPlus, CheckCircle2, XCircle } from "lucide-react";
import { formatChileDate, formatChileTime } from "@/lib/time";

export function ManageAppointment({ code }: { code: string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<any[]>([]);

  const load = () => fetch(`/api/public/appointments/${code}`).then((response) => response.json()).then((payload) => {
    if (payload.error) setError(payload.error);
    else setData(payload);
  });

  useEffect(() => { load(); }, [code]);
  useEffect(() => {
    if (!editing || !date || !data) return;
    fetch(`/api/availability?barberId=${data.appointment.barberId}&serviceId=${data.appointment.serviceId}&date=${date}`)
      .then((response) => response.json())
      .then((payload) => setSlots(payload.slots || []));
  }, [editing, date, data]);

  async function action(action: "cancel" | "reschedule") {
    if (action === "cancel" && !confirm("Confirmas que deseas cancelar esta reserva?")) return;
    const response = await fetch(`/api/public/appointments/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, date, time })
    });
    const payload = await response.json();
    if (!response.ok) setError(payload.error);
    else {
      setEditing(false);
      setError("");
      load();
    }
  }

  if (error && !data) return <div className="form-card success-box"><h2>No encontramos la reserva.</h2><p>{error}</p></div>;
  if (!data) return <div className="form-card">Cargando reserva...</div>;

  const appointment = data.appointment;
  const startAt = new Date(appointment.startAt);
  const locked = ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status);

  return <div className="form-card manage-card">
    <div className="manage-head">
      <div>
        <span className="eyebrow">Codigo {appointment.code}</span>
        <h2>{appointment.service.name}</h2>
        <p>{formatChileDate(startAt, { weekday: "long", day: "numeric", month: "long" })} - {formatChileTime(startAt)}</p>
      </div>
      <span className={`booking-status status-${appointment.status.toLowerCase()}`}>{appointment.status}</span>
    </div>

    <div className="manage-details">
      <div><span>Sucursal</span><strong>{appointment.branch.name}</strong><small>{appointment.branch.address}, {appointment.branch.commune}</small></div>
      <div><span>Barbero</span><strong>{appointment.barber.firstName} {appointment.barber.lastName}</strong><small>{appointment.barber.specialty}</small></div>
      <div><span>Cliente</span><strong>{appointment.customer.name}</strong><small>{appointment.customer.email}</small></div>
    </div>

    {error && <p className="error">{error}</p>}
    {editing && <div className="reschedule-box">
      <div className="field">
        <label>Nueva fecha</label>
        <input type="date" min={new Date().toISOString().split("T")[0]} value={date} onChange={(event) => { setDate(event.target.value); setTime(""); }} />
      </div>
      <div className="times">
        {slots.map((slot) => <button disabled={!slot.available} className={`time ${time === slot.time ? "selected" : ""}`} onClick={() => setTime(slot.time)} key={slot.time}>{slot.time}</button>)}
      </div>
      <button className="button" disabled={!date || !time} onClick={() => action("reschedule")}><CheckCircle2 size={16} /> Confirmar nuevo horario</button>
    </div>}

    <div className="manage-actions">
      {!locked && data.rules?.rescheduleEnabled && <button className="button" onClick={() => setEditing(!editing)}><CalendarClock size={16} /> Reagendar reserva</button>}
      {!locked && data.rules?.cancelEnabled && <button className="button button-danger" onClick={() => action("cancel")}><XCircle size={16} /> Cancelar reserva</button>}
      <a className="button button-outline" href={`/api/public/appointments/${code}/ics`}><CalendarPlus size={16} /> Agregar al calendario</a>
    </div>
  </div>;
}
