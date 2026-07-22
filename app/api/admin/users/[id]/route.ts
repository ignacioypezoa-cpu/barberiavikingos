import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin } from "@/lib/admin";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "BRANCH_MANAGER", "BARBER"]),
  branchId: z.string().optional().nullable(),
  barberId: z.string().optional().nullable(),
  active: z.boolean()
}).partial();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  try {
    const id = (await params).id;
    const { password, barberId, role, branchId, ...data } = parsed.data;
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(role ? { role } : {}),
        ...(branchId !== undefined || role ? { branchId: role === "BRANCH_MANAGER" ? branchId || null : null } : {}),
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {})
      },
      select: { id: true, name: true, email: true, role: true, active: true }
    });
    if (barberId !== undefined || role) {
      await prisma.barber.updateMany({ where: { userId: id }, data: { userId: null } });
      if ((role || user.role) === "BARBER" && barberId) {
        await prisma.barber.update({ where: { id: barberId }, data: { userId: id } });
      }
    }
    return NextResponse.json(user);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const id = (await params).id;
  if (id === auth.session?.userId) return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  try {
    await prisma.barber.updateMany({ where: { userId: id }, data: { userId: null } });
    return NextResponse.json(await prisma.user.update({ where: { id }, data: { active: false } }));
  } catch (error) {
    return apiError(error);
  }
}
