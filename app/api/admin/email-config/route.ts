import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin } from "@/lib/admin";
import { encryptSecret } from "@/lib/crypto";

const schema = z.object({
  smtpHost: z.string().max(255),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpUser: z.string().max(255),
  smtpPassword: z.string().max(500).optional(),
  smtpSecure: z.boolean(),
  fromEmail: z.union([z.string().email(), z.literal("")]),
  fromName: z.string().min(2).max(120),
  adminEmail: z.union([z.string().email(), z.literal("")]),
  enabled: z.boolean()
});

export async function GET() {
  const auth = await requireAdmin(); if (auth.error) return auth.error;
  const config = await prisma.emailConfig.findUnique({ where: { id: "main" } });
  if (!config) return NextResponse.json(null);
  const { smtpPassword, ...safe } = config;
  return NextResponse.json({ ...safe, hasPassword: Boolean(smtpPassword) });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(); if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos de correo electrónico." }, { status: 400 });
  if (parsed.data.enabled && (!parsed.data.smtpHost || !parsed.data.smtpUser || !parsed.data.fromEmail || !parsed.data.adminEmail)) {
    return NextResponse.json({ error: "Completa todos los campos SMTP antes de activar los correos." }, { status: 400 });
  }
  try {
    const existing = await prisma.emailConfig.findUnique({ where: { id: "main" } });
    const { smtpPassword, ...data } = parsed.data;
    if (parsed.data.enabled && !smtpPassword && !existing?.smtpPassword) {
      return NextResponse.json({ error: "Ingresa la contraseña SMTP." }, { status: 400 });
    }
    const passwordData = smtpPassword ? { smtpPassword: encryptSecret(smtpPassword) } : {};
    const saved = await prisma.emailConfig.upsert({
      where: { id: "main" },
      update: { ...data, ...passwordData },
      create: { id: "main", ...data, smtpPassword: smtpPassword ? encryptSecret(smtpPassword) : "" }
    });
    return NextResponse.json({ ok: true, hasPassword: Boolean(saved.smtpPassword) });
  } catch (error) { return apiError(error); }
}
