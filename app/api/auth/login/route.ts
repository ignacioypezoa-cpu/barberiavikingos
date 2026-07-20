import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
const schema = z.object({ email: z.string().email(), password: z.string().min(8).max(100) });

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  const current = attempts.get(ip);
  if (current && current.resetAt > now && current.count >= 5) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  const valid = user?.active && await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!user || !valid) {
    attempts.set(ip, { count: (current?.resetAt ?? 0) > now ? current!.count + 1 : 1, resetAt: now + 15 * 60 * 1000 });
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  attempts.delete(ip);
  await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role, branchId: user.branchId });
  return NextResponse.json({ ok: true, role: user.role });
}
