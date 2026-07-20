import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getBusinessConfig() {
  noStore();
  return prisma.businessConfig.findUnique({ where: { id: "main" } });
}
export async function getPublicCatalog() {
  noStore();
  const [config, services, barbers, branches, products] = await Promise.all([
    getBusinessConfig(),
    prisma.service.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } }),
    prisma.barber.findMany({ where: { active: true }, include: { branch: true, services: true }, orderBy: { createdAt: "asc" } }),
    prisma.branch.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE" }, include: { category: true }, orderBy: { createdAt: "asc" } })
  ]);
  return { config, services, barbers, branches, products };
}
