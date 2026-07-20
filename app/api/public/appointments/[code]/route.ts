import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canModifyAppointment, isSlotAvailable } from "@/lib/appointments";
import { sendAppointmentEmails, sendCancellationEmails, sendWaitlistAvailableEmail } from "@/lib/emailService";

const schema = z.object({
  action: z.enum(["cancel", "reschedule"]),
  date: z.string().optional(),
  time: z.string().optional()
});

const include = { customer: true, branch: true, barber: true, service: true, review: true } as const;

export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const appointment = await prisma.appointment.findUnique({ where: { code: (await params).code }, include });
  if (!appointment) return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
  const config = await prisma.advancedConfig.findUnique({ where: { id: "main" } });
  return NextResponse.json({ appointment, rules: config });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  const appointment = await prisma.appointment.findUnique({ where: { code: (await params).code }, include });
  if (!appointment) return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
  const config = await prisma.advancedConfig.findUnique({ where: { id: "main" } });
  const minimumHours = config?.minimumChangeHours ?? 2;
  if (!canModifyAppointment(appointment.startAt, minimumHours)) return NextResponse.json({ error: `Sólo puedes modificar hasta ${minimumHours} horas antes.` }, { status: 409 });
  if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status)) return NextResponse.json({ error: "Esta reserva ya no puede modificarse." }, { status: 409 });

  if (parsed.data.action === "cancel") {
    if (!config?.cancelEnabled) return NextResponse.json({ error: "Las cancelaciones online están desactivadas." }, { status: 403 });
    const updated = await prisma.appointment.update({ where: { id: appointment.id }, data: { status: "CANCELLED" } });
    await sendCancellationEmails({
      code: appointment.code, customerName: appointment.customer.name, customerEmail: appointment.customer.email,
      customerPhone: appointment.customer.phone, branchName: appointment.branch.name,
      branchAddress: `${appointment.branch.address}, ${appointment.branch.commune}`, branchPhone: appointment.branch.phone,
      branchWhatsapp: appointment.branch.whatsapp, barberName: `${appointment.barber.firstName} ${appointment.barber.lastName}`,
      serviceName: appointment.service.name, startAt: appointment.startAt, status: "CANCELLED", createdAt: appointment.createdAt
    }).catch((error) => console.error("[CANCEL] Email error:", error));
    const waiting = await prisma.waitlistEntry.findMany({ where: { status: "WAITING", branchId: appointment.branchId, serviceId: appointment.serviceId, desiredAt: appointment.startAt }, include: { customer: true, service: true } });
    await Promise.allSettled(waiting.map((entry) => sendWaitlistAvailableEmail(entry.customer.email, entry.customer.name, entry.desiredAt, entry.service.name)));
    if (waiting.length) await prisma.waitlistEntry.updateMany({ where: { id: { in: waiting.map((item) => item.id) } }, data: { status: "NOTIFIED", notifiedAt: new Date() } });
    return NextResponse.json(updated);
  }

  if (!config?.rescheduleEnabled) return NextResponse.json({ error: "El reagendamiento online está desactivado." }, { status: 403 });
  if (!parsed.data.date || !parsed.data.time) return NextResponse.json({ error: "Selecciona fecha y hora." }, { status: 400 });
  const startAt = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  const endAt = new Date(startAt.getTime() + appointment.service.duration * 60000);
  if (!(await isSlotAvailable(appointment.barberId, appointment.branchId, startAt, endAt, appointment.id))) {
    return NextResponse.json({ error: "Ese horario ya no está disponible.", waitlistAvailable: true }, { status: 409 });
  }
  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { startAt, endAt, status: "PENDING", reminder24hSentAt: null, reminder2hSentAt: null, reminder30mSentAt: null },
    include
  });
  await sendAppointmentEmails({
    code: updated.code,
    customerName: updated.customer.name,
    customerEmail: updated.customer.email,
    customerPhone: updated.customer.phone,
    branchName: updated.branch.name,
    branchAddress: `${updated.branch.address}, ${updated.branch.commune}`,
    branchPhone: updated.branch.phone,
    branchWhatsapp: updated.branch.whatsapp,
    barberName: `${updated.barber.firstName} ${updated.barber.lastName}`,
    serviceName: updated.service.name,
    startAt: updated.startAt,
    status: updated.status,
    createdAt: updated.createdAt
  }).catch((error) => console.error("[RESCHEDULE] Email error:", error));
  return NextResponse.json(updated);
}
