/**
 * lib/date-helpers.ts
 * P2-005: Centralized timezone-aware date utilities.
 *
 * All appointment-related date/time operations MUST use these helpers
 * to ensure consistent timezone handling based on the Business.timezone field.
 *
 * Default timezone: 'America/Mexico_City' (for legacy data only).
 * All new Business records should store an explicit timezone.
 */

export const DEFAULT_BUSINESS_TIMEZONE = "America/Mexico_City";

/**
 * Returns the current time in the business's local timezone as a Date object.
 */
export function getBusinessNow(timezone: string): Date {
  // Date.now() is always UTC; we format and re-parse in local tz for calculations
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: timezone })
  );
}

/**
 * Converts a business-local date+time string to a UTC Date for storage.
 * @param dateStr  YYYY-MM-DD in business local timezone
 * @param timeStr  HH:MM in business local timezone
 * @param timezone  IANA timezone string (e.g. 'America/Argentina/Buenos_Aires')
 */
export function businessDateToUTC(
  dateStr: string,
  timeStr: string,
  timezone: string
): Date {
  // Build ISO-like string and interpret it as if it's in the business's timezone
  const localISOString = `${dateStr}T${timeStr}:00`;

  // Use Intl to find the UTC offset for this timezone at this moment
  const tentativeDate = new Date(localISOString);

  // Get the UTC offset difference by comparing timezone-formatted time to UTC
  const utcStr = tentativeDate.toLocaleString("en-US", { timeZone: "UTC" });
  const localStr = tentativeDate.toLocaleString("en-US", { timeZone: timezone });

  const utcMs = new Date(utcStr).getTime();
  const localMs = new Date(localStr).getTime();
  const offsetMs = localMs - utcMs;

  return new Date(tentativeDate.getTime() - offsetMs);
}

/**
 * Converts a UTC Date to a business-local Date representation.
 */
export function utcToBusinessDate(utcDate: Date, timezone: string): Date {
  return new Date(utcDate.toLocaleString("en-US", { timeZone: timezone }));
}

/**
 * Extracts the HH:MM string from a UTC Date in the business's local timezone.
 */
export function getBusinessTimeStr(utcDate: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(utcDate);
}

/**
 * Extracts the YYYY-MM-DD string from a UTC Date in the business's local timezone.
 */
export function getBusinessDateStr(utcDate: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(utcDate);
}

/**
 * Returns the name of the day of the week in Spanish for a given UTC date
 * interpreted in the business's local timezone.
 */
export function getBusinessDayName(
  utcDate: Date,
  timezone: string
): "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo" {
  const dayNames = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ] as const;

  const localDate = new Date(utcDate.toLocaleString("en-US", { timeZone: timezone }));
  return dayNames[localDate.getDay()] as ReturnType<typeof getBusinessDayName>;
}

/**
 * Returns the local time in minutes-since-midnight for a UTC date
 * interpreted in the business's local timezone.
 */
export function getBusinessMinutesSinceMidnight(utcDate: Date, timezone: string): number {
  const localDate = new Date(utcDate.toLocaleString("en-US", { timeZone: timezone }));
  return localDate.getHours() * 60 + localDate.getMinutes();
}

/**
 * Checks if a UTC Date falls on a given business-local date string (YYYY-MM-DD).
 */
export function isBusinessDateMatch(
  utcDate: Date,
  businessDateStr: string,
  timezone: string
): boolean {
  return getBusinessDateStr(utcDate, timezone) === businessDateStr;
}

/**
 * Parse a HH:MM string into minutes since midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(":")) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
