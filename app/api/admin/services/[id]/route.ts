import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin } from "@/lib/admin";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
  category: z.string().min(2),
  duration: z.coerce.number().int().min(5),
  price: z.coerce.number().int().min(0),
  image: z.string().optional().nullable(),
  active: z.boolean()
}).partial();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(true);
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  try {
    return NextResponse.json(await prisma.service.update({ where: { id: (await params).id }, data: parsed.data }));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(true);
  if (auth.error) return auth.error;
  try {
    const id = (await params).id;
    const count = await prisma.appointment.count({ where: { serviceId: id } });
    if (count) return NextResponse.json(await prisma.service.update({ where: { id }, data: { active: false } }));
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
