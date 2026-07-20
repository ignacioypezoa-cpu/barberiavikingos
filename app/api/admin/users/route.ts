import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin } from "@/lib/admin";
const schema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(["ADMIN", "BRANCH_MANAGER", "BARBER"]), branchId: z.string().optional().nullable(), active: z.boolean().default(true) });
export async function GET() { const auth = await requireAdmin(); if (auth.error) return auth.error; const rows = await prisma.user.findMany({ include: { branch: true }, orderBy: { createdAt: "desc" } }); return NextResponse.json(rows.map(({ passwordHash: _, ...user }) => user)); }
export async function POST(request: NextRequest) { const auth = await requireAdmin(); if (auth.error) return auth.error; const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Revisa los datos del usuario." }, { status: 400 }); try { const { password, ...data } = parsed.data; return NextResponse.json(await prisma.user.create({ data: { ...data, email: data.email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12) }, select: { id: true, name: true, email: true, role: true, active: true } }), { status: 201 }); } catch (error) { return apiError(error); } }
