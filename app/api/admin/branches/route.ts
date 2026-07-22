import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin, slugify } from "@/lib/admin";

const schema = z.object({
  name: z.string().min(2), address: z.string().min(3), commune: z.string().min(2),
  city: z.string().min(2), phone: z.string().min(6), whatsapp: z.string().min(6),
  openingTime: z.string(), closingTime: z.string(), mapUrl: z.string().optional().nullable(),
  image: z.string().optional().nullable(), active: z.boolean().default(true)
});

export async function GET() {
  const auth = await requireAdmin(true, true); if (auth.error) return auth.error;
  return NextResponse.json(await prisma.branch.findMany({ orderBy: { createdAt: "desc" } }));
}
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(true); if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa los campos requeridos." }, { status: 400 });
  try {
    const data = parsed.data;
    return NextResponse.json(await prisma.branch.create({ data: { ...data, slug: `${slugify(data.name)}-${Date.now().toString().slice(-5)}` } }), { status: 201 });
  } catch (error) { return apiError(error); }
}
