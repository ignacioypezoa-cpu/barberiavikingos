"use client";
import { useEffect, useState } from "react";
import { CalendarClock, CalendarPlus, CheckCircle2, XCircle } from "lucide-react";

export function ManageAppointment({ code }: { code: string }) {
  const [data,setData]=useState<any>(null); const [error,setError]=useState(""); const [editing,setEditing]=useState(false);
  const [date,setDate]=useState(""); const [time,setTime]=useState(""); const [slots,setSlots]=useState<any[]>([]);
  const load=()=>fetch(`/api/public/appointments/${code}`).then(r=>r.json()).then(d=>rGuard(d));
  const rGuard=(d:any)=>{if(d.error)setError(d.error);else setData(d);};
  useEffect(()=>{load()},[code]);
  useEffect(()=>{if(!editing||!date||!data)return;fetch(`/api/availability?barberId=${data.appointment.barberId}&serviceId=${data.appointment.serviceId}&date=${date}`).then(r=>r.json()).then(d=>setSlots(d.slots||[]))},[editing,date,data]);
  async function action(action:"cancel"|"reschedule"){
    if(action==="cancel"&&!confirm("¿Confirmas que deseas cancelar esta reserva?"))return;
    const r=await fetch(`/api/public/appointments/${code}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,date,time})});const d=await r.json();
    if(!r.ok)setError(d.error);else{setEditing(false);setError("");load()}
  }
  if(error&&!data)return <div className="form-card success-box"><h2>No encontramos la reserva.</h2><p>{error}</p></div>;
  if(!data)return <div className="form-card">Cargando reserva...</div>;
  const a=data.appointment; const locked=["COMPLETED","CANCELLED","NO_SHOW"].includes(a.status);
  return <div className="form-card manage-card">
    <div className="manage-head"><div><span className="eyebrow">Código {a.code}</span><h2>{a.service.name}</h2><p>{new Date(a.startAt).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"})} · {new Date(a.startAt).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}</p></div><span className={`booking-status status-${a.status.toLowerCase()}`}>{a.status}</span></div>
    <div className="manage-details">
      <div><span>Sucursal</span><strong>{a.branch.name}</strong><small>{a.branch.address}, {a.branch.commune}</small></div>
      <div><span>Barbero</span><strong>{a.barber.firstName} {a.barber.lastName}</strong><small>{a.barber.specialty}</small></div>
      <div><span>Cliente</span><strong>{a.customer.name}</strong><small>{a.customer.email}</small></div>
    </div>
    {error&&<p className="error">{error}</p>}
    {editing&&<div className="reschedule-box"><div className="field"><label>Nueva fecha</label><input type="date" min={new Date().toISOString().split("T")[0]} value={date} onChange={e=>{setDate(e.target.value);setTime("")}}/></div><div className="times">{slots.map(s=><button disabled={!s.available} className={`time ${time===s.time?"selected":""}`} onClick={()=>setTime(s.time)} key={s.time}>{s.time}</button>)}</div><button className="button" disabled={!date||!time} onClick={()=>action("reschedule")}><CheckCircle2 size={16}/> Confirmar nuevo horario</button></div>}
    <div className="manage-actions">
      {!locked&&data.rules?.rescheduleEnabled&&<button className="button" onClick={()=>setEditing(!editing)}><CalendarClock size={16}/> Reagendar reserva</button>}
      {!locked&&data.rules?.cancelEnabled&&<button className="button button-danger" onClick={()=>action("cancel")}><XCircle size={16}/> Cancelar reserva</button>}
      <a className="button button-outline" href={`/api/public/appointments/${code}/ics`}><CalendarPlus size={16}/> Agregar al calendario</a>
    </div>
  </div>
}
