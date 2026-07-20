import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [config, branches, services, barbers, products, shippingMethods] = await Promise.all([
    prisma.businessConfig.findUnique({ where: { id: "main" } }),
    prisma.branch.findMany({ where: { active: true } }),
    prisma.service.findMany({ where: { active: true } }),
    prisma.barber.findMany({ where: { active: true }, include: { services: true } }),
    prisma.product.findMany({ where: { status: "ACTIVE" }, include: { category: true } }),
    prisma.shippingMethod.findMany({ where: { active: true } })
  ]);
  return NextResponse.json({ config, branches, services, barbers, products, shippingMethods });
}
