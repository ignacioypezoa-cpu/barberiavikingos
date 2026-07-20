import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  customer: z.object({ name: z.string().min(3), email: z.string().email(), phone: z.string().min(8), address: z.string().optional() }),
  shippingMethodId: z.string(),
  branchId: z.string().optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(20) })).min(1)
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  const data = parsed.data;
  const productIds = data.items.map((item) => item.productId);
  const [products, shippingMethod, config, advanced] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds }, status: "ACTIVE" } }),
    prisma.shippingMethod.findUnique({ where: { id: data.shippingMethodId } }),
    prisma.businessConfig.findUnique({ where: { id: "main" } }),
    prisma.advancedConfig.findUnique({ where: { id: "main" } })
  ]);
  if (products.length !== productIds.length || !shippingMethod?.active) return NextResponse.json({ error: "Producto o despacho no disponible." }, { status: 409 });

  const lines = data.items.map((item) => {
    const product = products.find((current) => current.id === item.productId)!;
    if (product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}`);
    return { product, quantity: item.quantity, total: product.price * item.quantity };
  });
  const subtotalWithTax = lines.reduce((sum, line) => sum + line.total, 0);
  const subtotal = Math.round(subtotalWithTax / (1 + (config?.taxRate ?? 19) / 100));
  const tax = subtotalWithTax - subtotal;
  const total = subtotalWithTax + shippingMethod.price;

  const order = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { email_phone: { email: data.customer.email.toLowerCase(), phone: data.customer.phone } },
      update: { name: data.customer.name, address: data.customer.address },
      create: { ...data.customer, email: data.customer.email.toLowerCase() }
    });
    const created = await tx.order.create({
      data: {
        code: `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        customerId: customer.id,
        branchId: data.branchId,
        shippingMethodId: shippingMethod.id,
        subtotal, tax, shipping: shippingMethod.price, total,
        shippingAddress: data.customer.address,
        items: { create: lines.map(({ product, quantity, total: lineTotal }) => ({ productId: product.id, name: product.name, unitPrice: product.price, quantity, total: lineTotal })) },
        payment: { create: { provider: process.env.PAYMENT_PROVIDER || "mock", amount: total } }
      }
    });
    if (advanced?.loyaltyEnabled) {
      await tx.customer.update({ where: { id: customer.id }, data: { loyaltyPoints: { increment: Math.floor(total / advanced.pointsPerPurchaseRate) }, totalSpent: { increment: total } } });
    }
    for (const line of lines) await tx.product.update({ where: { id: line.product.id }, data: { stock: { decrement: line.quantity } } });
    return created;
  });
  return NextResponse.json({ orderId: order.id, code: order.code, paymentStatus: "PENDING" }, { status: 201 });
}
