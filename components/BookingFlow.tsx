"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { clp } from "@/lib/data";

type Booking = {
  branchId: string;
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
};

const initial: Booking = { branchId: "", serviceId: "", barberId: "", date: "", time: "", name: "", phone: "", email: "" };

type BranchItem={id:string;slug:string;name:string;commune:string};
type ServiceItem={id:string;slug:string;name:string;duration:number;price:number};
type BarberItem={id:string;slug:string;firstName:string;lastName:string;specialty:string;branchId:string;services:{serviceId:string}[]};
export function BookingFlow({ branches, services, barbers }: { branches:BranchItem[];services:ServiceItem[];barbers:BarberItem[] }) {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [slots, setSlots] = useState<{time:string;available:boolean}[]>([]);
  const [waitlist, setWaitlist] = useState(false);
  const selectedBranch=branches.find((b)=>b.slug===booking.branchId);
  const selectedService=services.find((s)=>s.slug===booking.serviceId);
  const availableBarbers = useMemo(() => barbers.filter((b) => b.branchId === selectedBranch?.id && (!selectedService || b.services.some((s)=>s.serviceId===selectedService.id))), [barbers,selectedBranch?.id,selectedService]);
  const selectedBarber = barbers.find((b) => b.slug === booking.barberId);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const update = (key: keyof Booking, value: string) => setBooking((current) => ({ ...current, [key]: value }));
  const canContinue =
    (step === 1 && booking.branchId && booking.serviceId) ||
    (step === 2 && booking.barberId) ||
    (step === 3 && booking.date && booking.time);

  useEffect(() => {
    if (step !== 3 || !booking.date || !selectedBarber || !selectedService) return;
    setBooking((current) => ({ ...current, time: "" }));
    fetch(`/api/availability?barberId=${selectedBarber.id}&serviceId=${selectedService.id}&date=${booking.date}`)
      .then((response) => response.json()).then((data) => setSlots(data.slots || []));
  }, [step, booking.date, selectedBarber?.id, selectedService?.id]);

  async function confirm() {
    if (!booking.name || !booking.phone || !booking.email) {
      setError("Completa tus datos para solicitar la reserva.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking)
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.waitlistAvailable) setWaitlist(true);
        throw new Error(data.error || "No pudimos solicitar la reserva.");
      }
      setCode(data.code);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function joinWaitlist() {
    if (!selectedBranch || !selectedService || !selectedBarber) return;
    const response = await fetch("/api/waitlist", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: booking.name, email: booking.email, phone: booking.phone,
        branchId: selectedBranch.id, serviceId: selectedService.id, barberId: selectedBarber.id,
        desiredAt: `${booking.date}T${booking.time}:00`
      })
    });
    const data = await response.json();
    if (response.ok) { setError("Listo. Te avisaremos si se libera este horario."); setWaitlist(false); }
    else setError(data.error);
  }

  if (step === 5) {
    return (
      <div className="form-card success-box">
        <div className="success-icon"><Check size={32} /></div>
        <h2>Solicitud enviada.</h2>
        <p>La hora quedo pendiente de confirmacion. Te avisaremos a <strong>{booking.email}</strong> cuando el equipo la confirme.</p>
        <p>Código de reserva: <strong>{code}</strong></p>
        <button className="button" onClick={() => { setBooking(initial); setStep(1); }}>Nueva reserva</button>
      </div>
    );
  }

  return (
    <div className="form-card">
      <div className="booking-progress">
        {["Servicio", "Barbero", "Horario", "Tus datos"].map((label, i) => (
          <div key={label} className={`progress-step ${step >= i + 1 ? "active" : ""}`}>0{i + 1} · {label}</div>
        ))}
      </div>

      {step === 1 && (
        <>
          <h2>Elige sucursal y servicio</h2>
          <div className="field" style={{ marginBottom: 24 }}>
            <label>Sucursal</label>
            <select value={booking.branchId} onChange={(e) => { update("branchId", e.target.value); update("barberId", ""); }}>
              <option value="">Selecciona una sucursal</option>
              {branches.map((branch) => <option value={branch.slug} key={branch.id}>{branch.name} · {branch.commune}</option>)}
            </select>
          </div>
          <div className="choice-grid">
            {services.map((service) => (
              <button key={service.id} className={`choice ${booking.serviceId === service.slug ? "selected" : ""}`} onClick={() => update("serviceId", service.slug)}>
                <strong>{service.name}</strong>
                <span>{service.duration} min · {clp(service.price)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2>¿Con quién te quieres atender?</h2>
          <div className="choice-grid">
            {availableBarbers.map((barber) => (
              <button key={barber.id} className={`choice ${booking.barberId === barber.slug ? "selected" : ""}`} onClick={() => update("barberId", barber.slug)}>
                <strong>{barber.firstName} {barber.lastName}</strong>
                <span>{barber.specialty}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2>Elige fecha y hora</h2>
          <div className="field">
            <label>Fecha</label>
            <input type="date" min={tomorrow} value={booking.date} onChange={(e) => update("date", e.target.value)} />
          </div>
          <div className="times">
            {slots.map(({time,available}) => (
              <button disabled={!available} key={time} className={`time ${booking.time === time ? "selected" : ""}`} onClick={() => update("time", time)}>{time}{!available ? " · Ocupado" : ""}</button>
            ))}
          </div>
          {booking.date && slots.length === 0 && <p className="error">No hay horarios disponibles para ese día.</p>}
        </>
      )}

      {step === 4 && (
        <>
          <h2>Ya casi estamos</h2>
          <p style={{ color: "#9b978f" }}>Ingresa tus datos y te avisaremos por correo cuando el equipo confirme la hora.</p>
          <div className="field-grid">
            <div className="field field-full">
              <label>Nombre completo</label>
              <input value={booking.name} onChange={(e) => update("name", e.target.value)} placeholder="Ej: Nicolás González" />
            </div>
            <div className="field">
              <label>Teléfono</label>
              <input value={booking.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+56 9..." />
            </div>
            <div className="field">
              <label>Correo</label>
              <input type="email" value={booking.email} onChange={(e) => update("email", e.target.value)} placeholder="tu@correo.cl" />
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          {waitlist && <button type="button" className="button button-outline" onClick={joinWaitlist}>Ingresar a lista de espera</button>}
        </>
      )}

      <div className="form-actions">
        <button className="button button-outline" style={{ visibility: step === 1 ? "hidden" : "visible" }} onClick={() => setStep(step - 1)}>
          <ChevronLeft size={16} /> Atrás
        </button>
        {step < 4 ? (
          <button className="button" disabled={!canContinue} onClick={() => setStep(step + 1)}>Continuar <ChevronRight size={16} /></button>
        ) : (
          <button className="button" disabled={loading} onClick={confirm}>{loading ? "Enviando..." : "Solicitar reserva"} <Check size={16} /></button>
        )}
      </div>
    </div>
  );
}
