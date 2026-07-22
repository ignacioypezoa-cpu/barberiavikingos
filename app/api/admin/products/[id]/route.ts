import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireAdmin, slugify } from "@/lib/admin";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
  category: z.string().min(2),
  brand: z.string().min(1),
  sku: z.string().min(2),
  price: z.coerce.number().int().min(0),
  stock: z.coerce.number().int().min(0),
  image: z.string().optional().nullable(),
  active: z.boolean()
}).partial();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(true);
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  try {
    const { category, active, ...data } = parsed.data;
    let categoryId: string | undefined;
    if (category) {
      categoryId = (await prisma.productCategory.upsert({
        where: { slug: slugify(category) },
        update: { name: category },
        create: { name: category, slug: slugify(category) }
      })).id;
    }
    return NextResponse.json(await prisma.product.update({
      where: { id: (await params).id },
      data: { ...data, ...(categoryId ? { categoryId } : {}), ...(active === undefined ? {} : { status: active ? "ACTIVE" : "INACTIVE" }) }
    }));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(true);
  if (auth.error) return auth.error;
  try {
    const id = (await params).id;
    const count = await prisma.orderItem.count({ where: { productId: id } });
    if (count) return NextResponse.json(await prisma.product.update({ where: { id }, data: { status: "INACTIVE" } }));
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
