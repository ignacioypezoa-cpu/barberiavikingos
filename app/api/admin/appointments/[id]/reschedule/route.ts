import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { isSlotAvailable } from "@/lib/appointments";

const schema = z.object({ startAt: z.string() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(true, true);
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Fecha invalida." }, { status: 400 });

  const appointment = await prisma.appointment.findUnique({ where: { id: (await params).id }, include: { service: true, barber: true } });
  if (!appointment) return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });

  const session = auth.session;
  const permitted =
    session.role === "ADMIN" ||
    (session.role === "BRANCH_MANAGER" && (!session.branchId || session.branchId === appointment.branchId)) ||
    (session.role === "BARBER" && appointment.barber.userId === session.userId);
  if (!permitted) return NextResponse.json({ error: "Sin permisos." }, { status: 403 });

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(startAt.getTime() + appointment.service.duration * 60000);
  if (!await isSlotAvailable(appointment.barberId, appointment.branchId, startAt, endAt, appointment.id)) {
    return NextResponse.json({ error: "Horario no disponible." }, { status: 409 });
  }
  return NextResponse.json(await prisma.appointment.update({
    where: { id: appointment.id },
    data: { startAt, endAt, reminder24hSentAt: null, reminder2hSentAt: null, reminder30mSentAt: null }
  }));
}
