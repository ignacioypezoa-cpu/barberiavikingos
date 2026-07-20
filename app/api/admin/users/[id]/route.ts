import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin } from "@/lib/admin";
const schema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8).optional(), role: z.enum(["ADMIN", "BRANCH_MANAGER", "BARBER"]), branchId: z.string().optional().nullable(), active: z.boolean() }).partial();
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const auth = await requireAdmin(); if (auth.error) return auth.error; const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 }); try { const { password, ...data } = parsed.data; return NextResponse.json(await prisma.user.update({ where: { id: (await params).id }, data: { ...data, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) }, select: { id: true, name: true, email: true, role: true, active: true } })); } catch (error) { return apiError(error); } }
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) { const auth = await requireAdmin(); if (auth.error) return auth.error; const id = (await params).id; if (id === auth.session?.userId) return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 }); try { return NextResponse.json(await prisma.user.update({ where: { id }, data: { active: false } })); } catch (error) { return apiError(error); } }
