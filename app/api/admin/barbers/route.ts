import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin, slugify } from "@/lib/admin";

const schema = z.object({
  firstName: z.string().min(2), lastName: z.string().min(2), specialty: z.string().min(2), bio: z.string().min(3),
  phone: z.string().optional().nullable(), email: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  branchId: z.string().min(1), photo: z.string().optional().nullable(), serviceIds: z.array(z.string()).default([]),
  startTime: z.string().default("09:00"), endTime: z.string().default("20:00"), active: z.boolean().default(true)
});

export async function GET() {
  const auth = await requireAdmin(true, true); if (auth.error) return auth.error;
  const rows = await prisma.barber.findMany({ include: { branch: true, services: { include: { service: true } }, schedules: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(rows.map((b) => ({ ...b, serviceIds: b.services.map((s) => s.serviceId), serviceNames: b.services.map((s) => s.service.name).join(", "), startTime: b.schedules[0]?.startTime || "09:00", endTime: b.schedules[0]?.endTime || "20:00" })));
}
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(true); if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Revisa los campos." }, { status: 400 });
  try {
    const { serviceIds, startTime, endTime, ...data } = parsed.data;
    const barber = await prisma.barber.create({ data: { ...data, slug: `${slugify(`${data.firstName}-${data.lastName}`)}-${Date.now().toString().slice(-5)}`, services: { create: serviceIds.map((serviceId) => ({ serviceId })) } } });
    await prisma.schedule.createMany({ data: [1,2,3,4,5,6].map((dayOfWeek) => ({ barberId: barber.id, branchId: data.branchId, dayOfWeek, startTime, endTime })) });
    return NextResponse.json(barber, { status: 201 });
  } catch (error) { return apiError(error); }
}
