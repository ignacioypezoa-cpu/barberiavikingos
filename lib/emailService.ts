import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { formatChileDate, formatChileDateTime, formatChileTime } from "@/lib/time";

export type AppointmentEmailData = {
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  branchWhatsapp: string;
  barberName: string;
  serviceName: string;
  startAt: Date;
  status: string;
  createdAt: Date;
};

async function getMailer(allowDisabled = false) {
  const config = await prisma.emailConfig.findUnique({ where: { id: "main" } });
  if (!config || (!config.enabled && !allowDisabled)) return null;
  const password = decryptSecret(config.smtpPassword);
  if (!config.smtpHost || !config.smtpUser || !password || !config.fromEmail) {
    throw new Error("Configuracion SMTP incompleta.");
  }
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: { user: config.smtpUser, pass: password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
  return { transporter, config };
}

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);

const appointmentStatusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Anulada",
  COMPLETED: "Atendida",
  NO_SHOW: "No asistio"
};

function appointmentRows(data: AppointmentEmailData, includeAdminDetails = false): [string, string][] {
  return [
    ["Cliente", data.customerName],
    ...(includeAdminDetails ? [["Telefono", data.customerPhone], ["Correo", data.customerEmail]] as [string, string][] : []),
    ["Sucursal", data.branchName],
    ["Direccion", data.branchAddress],
    ["Barbero", data.barberName],
    ["Servicio", data.serviceName],
    ["Fecha", formatChileDate(data.startAt)],
    ["Hora", formatChileTime(data.startAt)],
    ["Estado", appointmentStatusLabel[data.status] || data.status]
  ];
}

async function emailLayout(title: string, intro: string, rows: [string, string][], closing: string, actions?: { label: string; url: string; danger?: boolean }[]) {
  const business = await prisma.businessConfig.findUnique({ where: { id: "main" } });
  const name = business?.businessName || "Vikingos";
  const logo = `${appUrl()}/images/logo-vikingos.png`;
  const social = [
    business?.instagram ? `<a href="https://instagram.com/${business.instagram.replace("@", "")}" style="color:#d4a638">Instagram</a>` : "",
    business?.facebook ? `<a href="https://facebook.com/${business.facebook}" style="color:#d4a638">Facebook</a>` : ""
  ].filter(Boolean).join(" - ");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#0b0b0b;font-family:Arial,sans-serif;color:#f4efe6">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;padding:24px 10px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#171717;border:1px solid #332918">
  <tr><td align="center" style="padding:28px;background:#050505"><img src="${logo}" alt="${escapeHtml(name)}" width="300" style="width:100%;max-width:300px;height:auto"></td></tr>
  <tr><td style="padding:34px 30px"><div style="color:#d4a638;text-transform:uppercase;letter-spacing:3px;font-size:11px">Vikingos Barber Shop</div>
  <h1 style="font-family:Georgia,serif;font-size:34px;font-weight:normal;margin:14px 0;color:#fff">${escapeHtml(title)}</h1>
  <p style="color:#c7c0b5;line-height:1.7">${escapeHtml(intro)}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:25px 0;border-top:1px solid #3b3328">
  ${rows.map(([label, value]) => `<tr><td style="padding:13px 4px;border-bottom:1px solid #302a22;color:#8f887e;font-size:12px">${escapeHtml(label)}</td><td align="right" style="padding:13px 4px;border-bottom:1px solid #302a22;color:#fff;font-size:13px"><strong>${escapeHtml(value)}</strong></td></tr>`).join("")}
  </table>${actions?.length ? `<div style="text-align:center;margin:28px 0">${actions.map((action) => `<a href="${action.url}" style="display:inline-block;margin:5px;padding:13px 18px;background:${action.danger ? "#6f2924" : "#d4a638"};color:${action.danger ? "#fff" : "#111"};text-decoration:none;font-weight:bold;font-size:12px">${escapeHtml(action.label)}</a>`).join("")}</div>` : ""}
  <p style="color:#c7c0b5;line-height:1.7">${escapeHtml(closing)}</p></td></tr>
  <tr><td align="center" style="padding:24px;background:#0d0d0d;color:#79736b;font-size:11px;line-height:1.8">${escapeHtml(name)}<br>${escapeHtml(business?.phone || "")} ${business?.email ? `- ${escapeHtml(business.email)}` : ""}<br>${social}</td></tr>
  </table></td></tr></table></body></html>`;
}

async function sendAppointmentMail(to: string, subject: string, title: string, intro: string, rows: [string, string][], closing: string, actions?: { label: string; url: string; danger?: boolean }[]) {
  const mailer = await getMailer(); if (!mailer) return;
  await mailer.transporter.sendMail({
    from: { name: mailer.config.fromName, address: mailer.config.fromEmail },
    to,
    subject,
    html: await emailLayout(title, intro, rows, closing, actions)
  });
}

async function sendEventEmails(label: string, tasks: (() => Promise<void>)[]) {
  const config = await prisma.emailConfig.findUnique({ where: { id: "main" } });
  if (!config?.enabled) return;
  const results = await Promise.allSettled(tasks.map((task) => task()));
  results.forEach((result, index) => {
    if (result.status === "rejected") console.error(`[EMAIL] Error enviando ${label} ${index === 0 ? "administrador" : "cliente"}:`, result.reason);
  });
}

export async function verifyEmailConnection() {
  const mailer = await getMailer();
  if (!mailer) throw new Error("El envio automatico esta desactivado.");
  await mailer.transporter.verify();
}

export async function sendTestEmail(recipient?: string) {
  const mailer = await getMailer(true);
  if (!mailer) throw new Error("Guarda la configuracion SMTP antes de probar.");
  await mailer.transporter.verify();
  const to = recipient || mailer.config.adminEmail;
  await mailer.transporter.sendMail({
    from: { name: mailer.config.fromName, address: mailer.config.fromEmail },
    to,
    subject: "Correo de prueba - Vikingos",
    html: await emailLayout("Configuracion exitosa", "La conexion SMTP de Vikingos funciona correctamente.", [["Servidor", mailer.config.smtpHost], ["Puerto", String(mailer.config.smtpPort)], ["Fecha", formatChileDateTime(new Date())]], "Ya puedes recibir notificaciones automaticas de reservas.")
  });
}

export async function sendAppointmentAdminEmail(data: AppointmentEmailData) {
  const rows = [...appointmentRows(data, true), ["Creada", formatChileDateTime(data.createdAt)] as [string, string]];
  await sendAppointmentMail(
    (await prisma.emailConfig.findUnique({ where: { id: "main" } }))?.adminEmail || data.customerEmail,
    "Nueva solicitud de reserva - Vikingos",
    "Nueva solicitud pendiente",
    "Se recibio una nueva solicitud de reserva desde la web. Debe ser confirmada desde el panel administrador.",
    rows,
    `Codigo de reserva: ${data.code}`,
    [{ label: "Revisar en admin", url: `${appUrl()}/admin/reservas` }]
  );
}

export async function sendAppointmentCustomerEmail(data: AppointmentEmailData) {
  await sendAppointmentMail(
    data.customerEmail,
    "Recibimos tu solicitud de reserva - Vikingos",
    `Hola ${data.customerName}`,
    "Recibimos tu solicitud de reserva. Te avisaremos por correo cuando el equipo confirme la hora.",
    appointmentRows(data),
    "Mientras este pendiente, la hora queda solicitada y bloqueada para evitar cruces.",
    [{ label: "Ver mi reserva", url: `${appUrl()}/mi-reserva/${data.code}` }]
  );
}

export async function sendAppointmentConfirmedAdminEmail(data: AppointmentEmailData) {
  await sendAppointmentMail(
    (await prisma.emailConfig.findUnique({ where: { id: "main" } }))?.adminEmail || data.customerEmail,
    "Reserva confirmada - Vikingos",
    "Reserva confirmada",
    "La reserva fue confirmada desde el panel administrador.",
    appointmentRows(data, true),
    `Codigo de reserva: ${data.code}`
  );
}

export async function sendAppointmentConfirmedCustomerEmail(data: AppointmentEmailData) {
  await sendAppointmentMail(
    data.customerEmail,
    "Tu hora fue confirmada - Vikingos",
    `Hola ${data.customerName}`,
    "Tu hora fue confirmada correctamente. Te esperamos en Vikingos.",
    appointmentRows(data),
    "Si necesitas modificar o cancelar tu reserva, puedes gestionarla desde el siguiente enlace.",
    [{ label: "Gestionar reserva", url: `${appUrl()}/mi-reserva/${data.code}` }]
  );
}

export async function sendReminderEmail(data: AppointmentEmailData, label: string) {
  await sendAppointmentMail(
    data.customerEmail,
    `Recordatorio de tu reserva ${label} - Vikingos`,
    "Tu cita se acerca",
    `Hola ${data.customerName}, te recordamos que tienes una cita ${label}.`,
    appointmentRows(data),
    "Te esperamos en Vikingos.",
    [{ label: "Gestionar mi reserva", url: `${appUrl()}/mi-reserva/${data.code}` }]
  );
}

export async function sendCancellationAdminEmail(data: AppointmentEmailData) {
  await sendAppointmentMail(
    (await prisma.emailConfig.findUnique({ where: { id: "main" } }))?.adminEmail || data.customerEmail,
    "Reserva anulada - Vikingos",
    "Reserva anulada",
    "La reserva fue anulada. Revisa el detalle y libera el horario si corresponde.",
    appointmentRows(data, true),
    `Codigo de reserva: ${data.code}`
  );
}

export async function sendCancellationCustomerEmail(data: AppointmentEmailData) {
  await sendAppointmentMail(
    data.customerEmail,
    "Tu reserva fue anulada - Vikingos",
    "Reserva anulada",
    `Hola ${data.customerName}, tu reserva fue anulada correctamente.`,
    appointmentRows(data),
    "Si quieres tomar una nueva hora, puedes reservar nuevamente desde nuestro sitio.",
    [{ label: "Reservar otra hora", url: `${appUrl()}/reservar` }]
  );
}

export async function sendAccessCodeEmail(email: string, name: string, code: string) {
  const mailer = await getMailer(); if (!mailer) return false;
  await mailer.transporter.sendMail({
    from: { name: mailer.config.fromName, address: mailer.config.fromEmail },
    to: email,
    subject: "Codigo de acceso - Vikingos",
    html: await emailLayout("Accede a tus reservas", `Hola ${name}, usa este codigo temporal para ingresar.`, [["Codigo", code], ["Vigencia", "15 minutos"]], "Si no solicitaste este codigo, ignora este mensaje.")
  });
  return true;
}

export async function sendReviewRequestEmail(data: AppointmentEmailData) {
  await sendAppointmentMail(
    data.customerEmail,
    "Como fue tu experiencia? - Vikingos",
    "Cuentanos como nos fue",
    `Hola ${data.customerName}, tu opinion nos ayuda a mejorar.`,
    [["Servicio", data.serviceName], ["Barbero", data.barberName]],
    "Tu evaluacion toma menos de un minuto.",
    [{ label: "Evaluar servicio", url: `${appUrl()}/evaluar/${data.code}` }]
  );
}

export async function sendWaitlistAvailableEmail(email: string, name: string, date: Date, service: string) {
  await sendAppointmentMail(
    email,
    "Se libero una hora - Vikingos",
    "Hay una hora disponible",
    `Hola ${name}, se libero el horario que estabas esperando.`,
    [["Servicio", service], ["Fecha", formatChileDate(date)], ["Hora", formatChileTime(date)]],
    "Reserva cuanto antes; el cupo se ofrece a toda la lista de espera.",
    [{ label: "Reservar ahora", url: `${appUrl()}/reservar` }]
  );
}

export async function sendAppointmentEmails(data: AppointmentEmailData) {
  await sendEventEmails("solicitud de reserva", [() => sendAppointmentAdminEmail(data), () => sendAppointmentCustomerEmail(data)]);
}

export async function sendAppointmentConfirmedEmails(data: AppointmentEmailData) {
  await sendEventEmails("confirmacion", [() => sendAppointmentConfirmedAdminEmail(data), () => sendAppointmentConfirmedCustomerEmail(data)]);
}

export async function sendCancellationEmails(data: AppointmentEmailData) {
  await sendEventEmails("anulacion", [() => sendCancellationAdminEmail(data), () => sendCancellationCustomerEmail(data)]);
}
