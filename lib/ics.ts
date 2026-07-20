const format = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const clean = (value: string) => value.replace(/[\\,;]/g, "\\$&").replace(/\n/g, "\\n");

export function appointmentIcs(data: { code: string; startAt: Date; endAt: Date; service: string; barber: string; branch: string; address: string }) {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Vikingos//Reservas//ES", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${data.code}@vikingos.cl`, `DTSTAMP:${format(new Date())}`,
    `DTSTART:${format(data.startAt)}`, `DTEND:${format(data.endAt)}`,
    `SUMMARY:${clean(`${data.service} - Vikingos`)}`,
    `DESCRIPTION:${clean(`Atención con ${data.barber} en ${data.branch}`)}`,
    `LOCATION:${clean(data.address)}`, "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
}
