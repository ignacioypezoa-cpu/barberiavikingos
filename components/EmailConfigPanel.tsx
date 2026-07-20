"use client";

import { useEffect, useState } from "react";
import { Mail, Send, ShieldCheck } from "lucide-react";

const empty = {
  smtpHost: "", smtpPort: 587, smtpUser: "", smtpPassword: "", smtpSecure: false,
  fromEmail: "", fromName: "Vikingos", adminEmail: "", enabled: false, hasPassword: false
};

export function EmailConfigPanel() {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/email-config").then((response) => response.json()).then((data) => data && setForm({ ...empty, ...data, smtpPassword: "" }));
  }, []);
  const update = (key: string, value: string | number | boolean) => setForm((current) => ({ ...current, [key]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage(null);
    const response = await fetch("/api/admin/email-config", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
    });
    const data = await response.json(); setSaving(false);
    if (response.ok) {
      setForm((current) => ({ ...current, smtpPassword: "", hasPassword: data.hasPassword }));
      setMessage({ type: "success", text: "Configuración de correo guardada de forma segura." });
    } else setMessage({ type: "error", text: data.error });
  }

  async function testEmail() {
    setTesting(true); setMessage(null);
    const response = await fetch("/api/admin/email-config/test", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient: form.adminEmail })
    });
    const data = await response.json(); setTesting(false);
    setMessage({ type: response.ok ? "success" : "error", text: response.ok ? data.message : data.error });
  }

  return (
    <section className="panel email-config-panel">
      <div className="settings-section-head">
        <span className="settings-icon"><Mail size={20} /></span>
        <div><h2>Correo electrónico</h2><p>Configura el servidor SMTP para notificaciones de reservas.</p></div>
      </div>
      {message && <div className={`admin-alert ${message.type}`}>{message.text}<button onClick={() => setMessage(null)}>×</button></div>}
      <form onSubmit={save}>
        <div className="field-grid">
          <div className="field"><label>Host SMTP</label><input value={form.smtpHost} onChange={(e) => update("smtpHost", e.target.value)} placeholder="smtp.gmail.com" /></div>
          <div className="field"><label>Puerto SMTP</label><input type="number" min="1" max="65535" value={form.smtpPort} onChange={(e) => update("smtpPort", Number(e.target.value))} /></div>
          <div className="field"><label>Usuario SMTP</label><input value={form.smtpUser} onChange={(e) => update("smtpUser", e.target.value)} autoComplete="off" /></div>
          <div className="field"><label>Contraseña SMTP</label><input type="password" value={form.smtpPassword} onChange={(e) => update("smtpPassword", e.target.value)} autoComplete="new-password" placeholder={form.hasPassword ? "•••••••• (guardada)" : "Ingresa la contraseña"} /></div>
          <div className="field"><label>Correo remitente</label><input type="email" value={form.fromEmail} onChange={(e) => update("fromEmail", e.target.value)} placeholder="reservas@vikingos.cl" /></div>
          <div className="field"><label>Nombre del remitente</label><input value={form.fromName} onChange={(e) => update("fromName", e.target.value)} /></div>
          <div className="field field-full"><label>Correo del administrador</label><input type="email" value={form.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} placeholder="administracion@vikingos.cl" /></div>
        </div>
        <div className="toggle-grid">
          <label className="toggle-card"><div><strong>SSL / TLS</strong><span>Usar conexión SMTP segura</span></div><input type="checkbox" checked={form.smtpSecure} onChange={(e) => update("smtpSecure", e.target.checked)} /></label>
          <label className="toggle-card"><div><strong>Envío automático</strong><span>Notificar al cliente y administrador</span></div><input type="checkbox" checked={form.enabled} onChange={(e) => update("enabled", e.target.checked)} /></label>
        </div>
        <div className="email-security-note"><ShieldCheck size={17} /><span>La contraseña se cifra antes de guardarse y nunca se expone nuevamente.</span></div>
        <div className="settings-actions">
          <button type="button" className="button button-outline" onClick={testEmail} disabled={testing || saving}><Send size={15} /> {testing ? "Validando conexión..." : "Enviar correo de prueba"}</button>
          <button className="button" disabled={saving || testing}>{saving ? "Guardando..." : "Guardar configuración"}</button>
        </div>
      </form>
    </section>
  );
}
