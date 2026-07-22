import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin, slugify } from "@/lib/admin";

const schema = z.object({ name: z.string().min(2), description: z.string().min(3), category: z.string().min(2), duration: z.coerce.number().int().min(5), price: z.coerce.number().int().min(0), image: z.string().optional().nullable(), active: z.boolean().default(true) });
export async function GET() { const auth = await requireAdmin(true); if (auth.error) return auth.error; return NextResponse.json(await prisma.service.findMany({ orderBy: { createdAt: "desc" } })); }
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(true); if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Revisa los campos." }, { status: 400 });
  try { const data = parsed.data; return NextResponse.json(await prisma.service.create({ data: { ...data, slug: `${slugify(data.name)}-${Date.now().toString().slice(-5)}` } }), { status: 201 }); } catch (error) { return apiError(error); }
}
