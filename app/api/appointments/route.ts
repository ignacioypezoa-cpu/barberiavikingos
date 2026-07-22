import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendAppointmentEmails } from "@/lib/emailService";
import { isSlotAvailable } from "@/lib/appointments";
import { chileDateRange, chileDateTimeToUtc, chileDayOfWeek, formatChileTime } from "@/lib/time";

const bookingSchema = z.object({
  branchId: z.string().min(1),
  serviceId: z.string().min(1),
  barberId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(3).max(80),
  phone: z.string().trim().min(8).max(20),
  email: z.string().email().max(120)
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const date = params.get("date"); const q = params.get("q");
  const roleScope = session.role === "ADMIN" || (session.role === "BRANCH_MANAGER" && !session.branchId)
    ? {}
    : session.branchId
      ? { branchId: session.branchId }
      : { barber: { userId: session.userId } };
  const appointments = await prisma.appointment.findMany({
    where: {
      ...roleScope,
      ...(params.get("branchId") ? { branchId: params.get("branchId")! } : {}),
      ...(params.get("barberId") ? { barberId: params.get("barberId")! } : {}),
      ...(params.get("status") ? { status: params.get("status") as any } : {}),
      ...(date ? { startAt: { gte: chileDateRange(date).start, lte: chileDateRange(date).end } } : {}),
      ...(q ? { customer: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } } : {})
    },
    include: { customer: true, barber: true, service: true, branch: true },
    orderBy: { startAt: "asc" },
    take: 500
  });
  return NextResponse.json(appointments);
}

export async function POST(request: NextRequest) {
  const parsed = bookingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos de la reserva." }, { status: 400 });
  const data = parsed.data;

  const [branch, service, barber] = await Promise.all([
    prisma.branch.findUnique({ where: { slug: data.branchId } }),
    prisma.service.findUnique({ where: { slug: data.serviceId } }),
    prisma.barber.findUnique({ where: { slug: data.barberId }, include: { services: true } })
  ]);
  if (!branch?.active || !service?.active || !barber?.active || barber.branchId !== branch.id) {
    return NextResponse.json({ error: "La combinación seleccionada ya no está disponible." }, { status: 400 });
  }
  if (!barber.services.some((item) => item.serviceId === service.id)) {
    return NextResponse.json({ error: "El barbero no realiza este servicio." }, { status: 400 });
  }

  const startAt = chileDateTimeToUtc(data.date, data.time);
  if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) {
    return NextResponse.json({ error: "Selecciona una fecha futura." }, { status: 400 });
  }
  const endAt = new Date(startAt.getTime() + service.duration * 60000);
  const dayOfWeek = chileDayOfWeek(data.date);
  const schedule = await prisma.schedule.findFirst({
    where: { barberId: barber.id, dayOfWeek, active: true, startTime: { lte: data.time }, endTime: { gte: formatChileTime(endAt) } }
  });
  if (!schedule) return NextResponse.json({ error: "El horario está fuera de la jornada del barbero." }, { status: 409 });

  if (!(await isSlotAvailable(barber.id, branch.id, startAt, endAt))) {
    return NextResponse.json({ error: "Ese horario no está disponible.", waitlistAvailable: true }, { status: 409 });
  }

  const customer = await prisma.customer.upsert({
    where: { email_phone: { email: data.email.toLowerCase(), phone: data.phone } },
    update: { name: data.name },
    create: { name: data.name, email: data.email.toLowerCase(), phone: data.phone }
  });
  const code = `VK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const appointment = await prisma.appointment.create({
    data: { code, customerId: customer.id, branchId: branch.id, barberId: barber.id, serviceId: service.id, startAt, endAt, status: "PENDING" },
    include: { customer: true, branch: true, barber: true, service: true }
  });

  after(async () => {
    await sendAppointmentEmails({
      code: appointment.code,
      customerName: appointment.customer.name,
      customerEmail: appointment.customer.email,
      customerPhone: appointment.customer.phone,
      branchName: appointment.branch.name,
      branchAddress: `${appointment.branch.address}, ${appointment.branch.commune}`,
      branchPhone: appointment.branch.phone,
      branchWhatsapp: appointment.branch.whatsapp,
      barberName: `${appointment.barber.firstName} ${appointment.barber.lastName}`,
      serviceName: appointment.service.name,
      startAt: appointment.startAt,
      status: appointment.status,
      createdAt: appointment.createdAt
    }).catch((error) => console.error("[EMAIL] Error inesperado enviando correos de reserva:", error));
  });
  return NextResponse.json({ ok: true, code }, { status: 201 });
}
