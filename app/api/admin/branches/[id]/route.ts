import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin } from "@/lib/admin";

const schema = z.object({
  name: z.string().min(2), address: z.string().min(3), commune: z.string().min(2), city: z.string().min(2),
  phone: z.string().min(6), whatsapp: z.string().min(6), openingTime: z.string(), closingTime: z.string(),
  mapUrl: z.string().optional().nullable(), image: z.string().optional().nullable(), active: z.boolean()
}).partial();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(true); if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  try { return NextResponse.json(await prisma.branch.update({ where: { id: (await params).id }, data: parsed.data })); } catch (error) { return apiError(error); }
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(true); if (auth.error) return auth.error;
  try {
    const id = (await params).id;
    const relations = await prisma.appointment.count({ where: { branchId: id } });
    if (relations) return NextResponse.json(await prisma.branch.update({ where: { id }, data: { active: false } }));
    await prisma.branch.delete({ where: { id } }); return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
