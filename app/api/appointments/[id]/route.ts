import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { updateCustomerStats } from "@/lib/appointments";
import { sendAppointmentConfirmedEmails, sendCancellationEmails, sendReviewRequestEmail, sendWaitlistAvailableEmail } from "@/lib/emailService";

const schema = z.object({ status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  const { id } = await params;
  const existing = await prisma.appointment.findUnique({ where: { id }, include: { barber: true } });
  if (!existing) return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
  const permitted =
    session.role === "ADMIN" ||
    (session.role === "BRANCH_MANAGER" && (!session.branchId || existing.branchId === session.branchId)) ||
    existing.barber.userId === session.userId;
  if (!permitted) return NextResponse.json({ error: "Sin permisos." }, { status: 403 });
  const updated = await prisma.appointment.update({
    where: { id }, data: parsed.data,
    include: { customer: true, branch: true, barber: true, service: true }
  });
  const emailData = {
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
  };
  if (existing.status !== updated.status && updated.status === "CONFIRMED") {
    await sendAppointmentConfirmedEmails(emailData);
  }
  if (parsed.data.status === "COMPLETED") {
    const advanced = await prisma.advancedConfig.findUnique({ where: { id: "main" } });
    await prisma.customer.update({
      where: { id: updated.customerId },
      data: { loyaltyPoints: { increment: advanced?.loyaltyEnabled ? advanced.pointsPerVisit : 0 } }
    });
    await updateCustomerStats(updated.customerId);
    if (advanced?.reviewsEnabled && !updated.reviewRequestedAt) {
      await sendReviewRequestEmail({
        code: updated.code, customerName: updated.customer.name, customerEmail: updated.customer.email,
        customerPhone: updated.customer.phone, branchName: updated.branch.name,
        branchAddress: `${updated.branch.address}, ${updated.branch.commune}`, branchPhone: updated.branch.phone,
        branchWhatsapp: updated.branch.whatsapp, barberName: `${updated.barber.firstName} ${updated.barber.lastName}`,
        serviceName: updated.service.name, startAt: updated.startAt, status: updated.status, createdAt: updated.createdAt
      }).catch((error) => console.error("[REVIEW] Error:", error));
      await prisma.appointment.update({ where: { id }, data: { reviewRequestedAt: new Date() } });
    }
  }
  if (existing.status !== updated.status && parsed.data.status === "CANCELLED") {
    await sendCancellationEmails(emailData);
    const waiting = await prisma.waitlistEntry.findMany({
      where: { status: "WAITING", branchId: updated.branchId, serviceId: updated.serviceId, desiredAt: updated.startAt },
      include: { customer: true, service: true }
    });
    await Promise.allSettled(waiting.map((entry) => sendWaitlistAvailableEmail(entry.customer.email, entry.customer.name, entry.desiredAt, entry.service.name)));
    if (waiting.length) await prisma.waitlistEntry.updateMany({ where: { id: { in: waiting.map((item) => item.id) } }, data: { status: "NOTIFIED", notifiedAt: new Date() } });
  }
  return NextResponse.json(updated);
}
