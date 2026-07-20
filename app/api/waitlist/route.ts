import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(3), email: z.string().email(), phone: z.string().min(8),
  branchId: z.string(), serviceId: z.string(), barberId: z.string().optional(), desiredAt: z.string()
});
export async function POST(request: NextRequest) {
  const config = await prisma.advancedConfig.findUnique({ where: { id: "main" } });
  if (!config?.waitlistEnabled) return NextResponse.json({ error: "La lista de espera está desactivada." }, { status: 403 });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const data = parsed.data;
  const customer = await prisma.customer.upsert({ where: { email_phone: { email: data.email.toLowerCase(), phone: data.phone } }, update: { name: data.name }, create: { name: data.name, email: data.email.toLowerCase(), phone: data.phone } });
  const entry = await prisma.waitlistEntry.create({ data: { customerId: customer.id, branchId: data.branchId, serviceId: data.serviceId, barberId: data.barberId || null, desiredAt: new Date(data.desiredAt) } });
  return NextResponse.json({ ok: true, id: entry.id }, { status: 201 });
}
