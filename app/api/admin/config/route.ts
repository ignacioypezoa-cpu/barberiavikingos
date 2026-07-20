import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin } from "@/lib/admin";
const schema = z.object({
  businessName: z.string().min(2), logo: z.string().optional().nullable(), primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  phone: z.string().optional().nullable(), whatsapp: z.string().optional().nullable(), email: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  instagram: z.string().optional().nullable(), facebook: z.string().optional().nullable(), address: z.string().optional().nullable(),
  heroTitle: z.string().min(3), heroSubtitle: z.string().min(3), heroImage: z.string().optional().nullable(),
  generalHours: z.string().optional().nullable(), taxRate: z.coerce.number().int().min(0).max(100)
});
export async function GET() { const auth = await requireAdmin(); if (auth.error) return auth.error; return NextResponse.json(await prisma.businessConfig.findUnique({ where: { id: "main" } })); }
export async function PATCH(request: NextRequest) { const auth = await requireAdmin(); if (auth.error) return auth.error; const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Revisa la configuración." }, { status: 400 }); try { return NextResponse.json(await prisma.businessConfig.upsert({ where: { id: "main" }, update: parsed.data, create: { id: "main", ...parsed.data } })); } catch (error) { return apiError(error); } }
