const EASTERN_STANDARD_OFFSET = -300;
const CENTRAL_STANDARD_OFFSET = -360;

/**
 * True when a time zone observes Eastern or Central time. Judged by the zone's
 * standard (January) offset so variants like America/Indiana/Knox and America/Detroit pass.
 */
export function isEasternOrCentral(timeZone: string): boolean {
  const january = new Date(Date.UTC(2026, 0, 15, 12));
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(january);
  const label = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(label);
  if (!match) {
    return false;
  }
  const offset = (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
  return offset === EASTERN_STANDARD_OFFSET || offset === CENTRAL_STANDARD_OFFSET;
}
