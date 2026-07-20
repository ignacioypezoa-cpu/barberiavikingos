import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appointmentIcs } from "@/lib/ics";

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const appointment = await prisma.appointment.findUnique({ where: { code: (await params).code }, include: { branch: true, barber: true, service: true } });
  if (!appointment) return new NextResponse("Reserva no encontrada", { status: 404 });
  const content = appointmentIcs({
    code: appointment.code, startAt: appointment.startAt, endAt: appointment.endAt,
    service: appointment.service.name, barber: `${appointment.barber.firstName} ${appointment.barber.lastName}`,
    branch: appointment.branch.name, address: `${appointment.branch.address}, ${appointment.branch.commune}`
  });
  return new NextResponse(content, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${appointment.code}.ics"` } });
}
