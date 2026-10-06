export const LEAGUE_TIME_ZONE = "America/New_York";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

/** True when the value is a real calendar date in `YYYY-MM-DD` form. */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  return toIsoDate(new Date(`${value}T00:00:00Z`)) === value;
}

/** Formats the UTC calendar date of an instant as `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Adds whole days to a `YYYY-MM-DD` date. */
export function addDays(isoDate: string, days: number): string {
  return toIsoDate(new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS));
}

/** Day of week for a `YYYY-MM-DD` date, 0 = Monday through 6 = Sunday. */
export function mondayBasedWeekday(isoDate: string): number {
  return (new Date(`${isoDate}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/** The calendar date an instant falls on in a time zone, as `YYYY-MM-DD`. */
export function dateInZone(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

/** Minutes the zone is offset from UTC at an instant (e.g. -240 for EDT). */
export function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(instant);
  const label = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(label);
  if (!match) {
    return 0;
  }
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/** The UTC epoch milliseconds of a wall-clock time on a date in a time zone. */
export function zonedTimeToEpoch(isoDate: string, hours: number, minutes: number, timeZone: string): number {
  const wallClockAsUtc = Date.parse(`${isoDate}T00:00:00Z`) + (hours * 60 + minutes) * MINUTE_MS;
  // Applying the offset twice settles the edge where the first guess lands on the other side of a DST change.
  const firstGuess = wallClockAsUtc - zoneOffsetMinutes(new Date(wallClockAsUtc), timeZone) * MINUTE_MS;
  return wallClockAsUtc - zoneOffsetMinutes(new Date(firstGuess), timeZone) * MINUTE_MS;
}

/** The upcoming Friday in the league's time zone; today when today is a Friday. */
export function upcomingFriday(now: Date): string {
  const today = dateInZone(now, LEAGUE_TIME_ZONE);
  const fridayIndex = 4;
  return addDays(today, (fridayIndex - mondayBasedWeekday(today) + 7) % 7);
}

/** The Monday that starts the league-time-zone week containing an instant. */
export function weekStart(now: Date): string {
  const today = dateInZone(now, LEAGUE_TIME_ZONE);
  return addDays(today, -mondayBasedWeekday(today));
}
