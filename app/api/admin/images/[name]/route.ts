import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

async function usageCount(url: string) {
  const counts = await Promise.all([
    prisma.businessConfig.count({ where: { logo: url } }),
    prisma.businessConfig.count({ where: { heroImage: url } }),
    prisma.branch.count({ where: { image: url } }),
    prisma.barber.count({ where: { photo: url } }),
    prisma.service.count({ where: { image: url } }),
    prisma.product.count({ where: { image: url } })
  ]);
  return counts.reduce((total, count) => total + count, 0);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const auth = await requireAdmin(true);
  if (auth.error) return auth.error;

  const { name } = await params;
  const fileName = decodeURIComponent(name);
  if (fileName !== path.basename(fileName) || !allowed.has(path.extname(fileName).toLowerCase())) {
    return NextResponse.json({ error: "Imagen invalida." }, { status: 400 });
  }

  const url = `/uploads/${fileName}`;
  const used = await usageCount(url);
  if (used > 0) {
    return NextResponse.json({ error: "No se puede eliminar porque la imagen esta en uso." }, { status: 409 });
  }

  try {
    await unlink(path.join(process.cwd(), "public", "uploads", fileName));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === "ENOENT") return NextResponse.json({ error: "Imagen no encontrada." }, { status: 404 });
    throw error;
  }
}
