import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSlotAvailable } from "@/lib/appointments";
import { chileDateTimeToUtc, chileDayOfWeek } from "@/lib/time";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const barberId = params.get("barberId"); const serviceId = params.get("serviceId"); const date = params.get("date");
  if (!barberId || !serviceId || !date) return NextResponse.json({ error: "Faltan parámetros." }, { status: 400 });
  const [barber, service] = await Promise.all([
    prisma.barber.findUnique({ where: { id: barberId }, include: { branch: true, schedules: true } }),
    prisma.service.findUnique({ where: { id: serviceId } })
  ]);
  if (!barber?.active || !barber.branch.active || !service?.active) return NextResponse.json({ slots: [] });
  const day = chileDayOfWeek(date);
  const schedule = barber.schedules.find((item) => item.dayOfWeek === day && item.active);
  if (!schedule) return NextResponse.json({ slots: [] });
  const slots: { time: string; available: boolean }[] = [];
  const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
  const [endHour, endMinute] = schedule.endTime.split(":").map(Number);
  let cursor = chileDateTimeToUtc(date, schedule.startTime);
  const endDay = chileDateTimeToUtc(date, schedule.endTime);
  while (cursor.getTime() + service.duration * 60000 <= endDay.getTime()) {
    const slotEnd = new Date(cursor.getTime() + service.duration * 60000);
    const time = `${String(startHour + Math.floor((startMinute + slots.length * 15) / 60)).padStart(2, "0")}:${String((startMinute + slots.length * 15) % 60).padStart(2, "0")}`;
    slots.push({ time, available: cursor > new Date() && await isSlotAvailable(barber.id, barber.branchId, cursor, slotEnd) });
    cursor = new Date(cursor.getTime() + 15 * 60000);
  }
  return NextResponse.json({ slots, schedule: { startHour, startMinute, endHour, endMinute } });
}
