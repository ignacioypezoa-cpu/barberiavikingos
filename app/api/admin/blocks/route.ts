import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { chileDateTimeLocalToUtc } from "@/lib/time";

const schema = z.object({
  branchId: z.string(),
  barberId: z.string().optional().nullable(),
  startAt: z.string(),
  endAt: z.string(),
  reason: z.string().min(2),
  type: z.enum(["MANUAL", "BREAK", "VACATION"]).default("MANUAL")
});

export async function GET() {
  const auth = await requireAdmin(true, true);
  if (auth.error) return auth.error;

  const blocks = await prisma.appointmentBlock.findMany({
    include: { branch: true, barber: true },
    orderBy: { startAt: "desc" }
  });

  return NextResponse.json(blocks);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(true);
  if (auth.error) return auth.error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  }

  const data = parsed.data;
  const startAt = chileDateTimeLocalToUtc(data.startAt);
  const endAt = chileDateTimeLocalToUtc(data.endAt);

  if (endAt <= startAt) {
    return NextResponse.json({ error: "El fin debe ser posterior al inicio." }, { status: 400 });
  }

  const block = await prisma.appointmentBlock.create({
    data: {
      branchId: data.branchId,
      barberId: data.barberId || null,
      startAt,
      endAt,
      reason: data.reason,
      type: data.type
    }
  });

  return NextResponse.json(block, { status: 201 });
}
