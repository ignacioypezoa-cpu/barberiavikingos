import { NextRequest, NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const publicDirectory = () => path.join(process.cwd(), "public");
const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

type ImageSource = "upload" | "public" | "external" | "referenced";

type ImageItem = {
  name: string;
  url: string;
  size: number | null;
  updatedAt: string | null;
  source: ImageSource;
  deletable: boolean;
  deleteName: string | null;
};

async function getUsage(url: string) {
  const [businessLogo, businessHero, branches, barbers, services, products] = await Promise.all([
    prisma.businessConfig.count({ where: { logo: url } }),
    prisma.businessConfig.count({ where: { heroImage: url } }),
    prisma.branch.count({ where: { image: url } }),
    prisma.barber.count({ where: { photo: url } }),
    prisma.service.count({ where: { image: url } }),
    prisma.product.count({ where: { image: url } })
  ]);

  return {
    businessLogo,
    businessHero,
    branches,
    barbers,
    services,
    products,
    total: businessLogo + businessHero + branches + barbers + services + products
  };
}

async function listPublicImages(directory: string, base = ""): Promise<string[]> {
  const entries = await readdir(path.join(directory, base), { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const relative = path.posix.join(base.replaceAll(path.sep, "/"), entry.name);
    if (entry.isDirectory()) return listPublicImages(directory, relative);
    return allowed.has(path.extname(entry.name).toLowerCase()) ? [relative] : [];
  }));
  return nested.flat();
}

async function getReferencedUrls() {
  const [business, branches, barbers, services, products] = await Promise.all([
    prisma.businessConfig.findUnique({ where: { id: "main" }, select: { logo: true, heroImage: true } }),
    prisma.branch.findMany({ select: { image: true } }),
    prisma.barber.findMany({ select: { photo: true } }),
    prisma.service.findMany({ select: { image: true } }),
    prisma.product.findMany({ select: { image: true } })
  ]);

  return [
    business?.logo,
    business?.heroImage,
    ...branches.map((item) => item.image),
    ...barbers.map((item) => item.photo),
    ...services.map((item) => item.image),
    ...products.map((item) => item.image)
  ].filter((url): url is string => Boolean(url?.trim()));
}

function labelFromUrl(url: string) {
  if (url.startsWith("/")) return url.slice(1);
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url;
  }
}

export async function GET() {
  const auth = await requireAdmin(true);
  if (auth.error) return auth.error;

  const images = new Map<string, ImageItem>();

  try {
    const files = await listPublicImages(publicDirectory());
    await Promise.all(files.map(async (name) => {
      const normalized = name.replaceAll(path.sep, "/");
      const file = await stat(path.join(publicDirectory(), name));
      const url = `/${normalized}`;
      images.set(url, {
        name: normalized,
        url,
        size: file.size,
        updatedAt: file.mtime.toISOString(),
        source: url.startsWith("/uploads/") ? "upload" : "public",
        deletable: url.startsWith("/uploads/"),
        deleteName: url.startsWith("/uploads/") ? path.posix.basename(normalized) : null
      });
    }));
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }

  for (const url of await getReferencedUrls()) {
    if (images.has(url)) continue;
    images.set(url, {
      name: labelFromUrl(url),
      url,
      size: null,
      updatedAt: null,
      source: url.startsWith("/") ? "referenced" : "external",
      deletable: false,
      deleteName: null
    });
  }

  const result = await Promise.all([...images.values()].map(async (image) => ({
    ...image,
    usage: await getUsage(image.url)
  })));

  return NextResponse.json(result.sort((a, b) => {
    const dateA = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const dateB = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return dateB - dateA || a.name.localeCompare(b.name);
  }));
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(true);
  if (auth.error) return auth.error;

  const { oldUrl, newUrl } = await request.json();
  if (typeof oldUrl !== "string" || typeof newUrl !== "string" || !oldUrl.trim() || !newUrl.trim()) {
    return NextResponse.json({ error: "URLs invalidas." }, { status: 400 });
  }

  const updates = await Promise.all([
    prisma.businessConfig.updateMany({ where: { logo: oldUrl }, data: { logo: newUrl } }),
    prisma.businessConfig.updateMany({ where: { heroImage: oldUrl }, data: { heroImage: newUrl } }),
    prisma.branch.updateMany({ where: { image: oldUrl }, data: { image: newUrl } }),
    prisma.barber.updateMany({ where: { photo: oldUrl }, data: { photo: newUrl } }),
    prisma.service.updateMany({ where: { image: oldUrl }, data: { image: newUrl } }),
    prisma.product.updateMany({ where: { image: oldUrl }, data: { image: newUrl } })
  ]);

  return NextResponse.json({ ok: true, updated: updates.reduce((total, item) => total + item.count, 0), url: newUrl });
}
