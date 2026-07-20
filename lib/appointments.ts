import { prisma } from "@/lib/prisma";

export async function isSlotAvailable(barberId: string, branchId: string, startAt: Date, endAt: Date, excludeAppointmentId?: string) {
  const [appointment, block] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        barberId,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        startAt: { lt: endAt },
        endAt: { gt: startAt }
      }
    }),
    prisma.appointmentBlock.findFirst({
      where: {
        active: true,
        branchId,
        OR: [{ barberId }, { barberId: null }],
        startAt: { lt: endAt },
        endAt: { gt: startAt }
      }
    })
  ]);
  return !appointment && !block;
}

export function canModifyAppointment(startAt: Date, minimumHours: number) {
  return startAt.getTime() - Date.now() >= minimumHours * 60 * 60 * 1000;
}

export async function updateCustomerStats(customerId: string) {
  const completed = await prisma.appointment.findMany({
    where: { customerId, status: "COMPLETED" },
    include: { service: true, barber: true },
    orderBy: { startAt: "asc" }
  });
  const orders = await prisma.order.aggregate({
    where: { customerId, status: "PAID" },
    _sum: { total: true }
  });
  const latest = completed.at(-1);
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      firstVisitAt: completed[0]?.startAt || null,
      lastVisitAt: latest?.startAt || null,
      visitCount: completed.length,
      totalSpent: completed.reduce((sum, item) => sum + item.service.price, 0) + (orders._sum.total || 0),
      favoriteCut: latest?.service.name,
      favoriteBarber: latest ? `${latest.barber.firstName} ${latest.barber.lastName}` : null
    }
  });
}
