export const CHILE_TIME_ZONE = "America/Santiago";

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CHILE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second")
  };
}

export function chileDateTimeToUtc(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstGuess = new Date(desired);
  const actual = zonedParts(firstGuess);
  const actualWallTime = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
  return new Date(firstGuess.getTime() + desired - actualWallTime);
}

export function chileDateRange(date: string) {
  return {
    start: chileDateTimeToUtc(date, "00:00"),
    end: chileDateTimeToUtc(date, "23:59")
  };
}

export function chileDayOfWeek(date: string) {
  return chileDateTimeToUtc(date, "12:00").getUTCDay();
}

export function formatChileDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString("es-CL", { timeZone: CHILE_TIME_ZONE, ...options });
}

export function formatChileTime(date: Date, options?: Intl.DateTimeFormatOptions) {
  return date.toLocaleTimeString("es-CL", { timeZone: CHILE_TIME_ZONE, hour: "2-digit", minute: "2-digit", ...options });
}

export function formatChileDateTime(date: Date, options?: Intl.DateTimeFormatOptions) {
  return date.toLocaleString("es-CL", { timeZone: CHILE_TIME_ZONE, ...options });
}
