import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin } from "@/lib/admin";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "BRANCH_MANAGER", "BARBER"]),
  branchId: z.string().optional().nullable(),
  barberId: z.string().optional().nullable(),
  active: z.boolean().default(true)
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const rows = await prisma.user.findMany({ include: { branch: true, barber: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(rows.map(({ passwordHash: _, barber, ...user }) => ({ ...user, barber, barberId: barber?.id || "" })));
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos del usuario." }, { status: 400 });
  try {
    const { password, barberId, ...data } = parsed.data;
    const user = await prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        branchId: data.role === "BRANCH_MANAGER" ? data.branchId || null : null,
        passwordHash: await bcrypt.hash(password, 12)
      },
      select: { id: true, name: true, email: true, role: true, active: true }
    });
    if (data.role === "BARBER" && barberId) {
      await prisma.barber.update({ where: { id: barberId }, data: { userId: user.id } });
    }
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
