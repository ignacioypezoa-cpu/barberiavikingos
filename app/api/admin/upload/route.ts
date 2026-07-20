import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/admin";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(true); if (auth.error) return auth.error;
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Imagen inválida. Usa JPG, PNG, WEBP o GIF de máximo 5 MB." }, { status: 400 });
  const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
  const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true }); await writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 });
}
