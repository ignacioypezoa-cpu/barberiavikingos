import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin } from "@/lib/admin";
const schema = z.object({ firstName: z.string().min(2), lastName: z.string().min(2), specialty: z.string().min(2), bio: z.string().min(3), phone: z.string().optional().nullable(), email: z.union([z.string().email(), z.literal("")]).optional().nullable(), branchId: z.string().min(1), photo: z.string().optional().nullable(), serviceIds: z.array(z.string()), startTime: z.string(), endTime: z.string(), active: z.boolean() }).partial();
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(true); if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  try {
    const id = (await params).id; const { serviceIds, startTime, endTime, ...data } = parsed.data;
    const barber = await prisma.barber.update({ where: { id }, data: { ...data, ...(serviceIds ? { services: { deleteMany: {}, create: serviceIds.map((serviceId) => ({ serviceId })) } } : {}) } });
    if (startTime || endTime || data.branchId) await prisma.schedule.updateMany({ where: { barberId: id }, data: { ...(startTime ? { startTime } : {}), ...(endTime ? { endTime } : {}), ...(data.branchId ? { branchId: data.branchId } : {}) } });
    return NextResponse.json(barber);
  } catch (error) { return apiError(error); }
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) { const auth = await requireAdmin(true); if (auth.error) return auth.error; try { const id = (await params).id; const count = await prisma.appointment.count({ where: { barberId: id } }); if (count) return NextResponse.json(await prisma.barber.update({ where: { id }, data: { active: false } })); await prisma.barber.delete({ where: { id } }); return NextResponse.json({ ok: true }); } catch (error) { return apiError(error); } }
