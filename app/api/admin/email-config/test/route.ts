import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { sendTestEmail } from "@/lib/emailService";

const schema = z.object({ recipient: z.string().email().optional() });

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(); if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Correo de prueba inválido." }, { status: 400 });
  try {
    await sendTestEmail(parsed.data.recipient);
    return NextResponse.json({ ok: true, message: "Correo de prueba enviado correctamente." });
  } catch (error) {
    console.error("[EMAIL] Falló la prueba SMTP:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo conectar al servidor SMTP." }, { status: 400 });
  }
}
