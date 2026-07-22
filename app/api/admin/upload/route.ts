import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/admin";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function uploadToCloudinary(file: File) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "barberiavikingos";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "No se pudo subir la imagen a Cloudinary.");
  return data.secure_url as string;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(true);
  if (auth.error) return auth.error;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagen invalida. Usa JPG, PNG, WEBP o GIF de maximo 5 MB." }, { status: 400 });
  }

  try {
    const cloudinaryUrl = await uploadToCloudinary(file);
    if (cloudinaryUrl) return NextResponse.json({ url: cloudinaryUrl }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo subir la imagen." }, { status: 500 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
  const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 });
}
