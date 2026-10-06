import type { LatLng } from "@/types/latLng";
import type { Station } from "@/types/station";
import type { TransitNetwork } from "@/types/transitNetwork";
import type { TransitTrip } from "@/types/transitTrip";

const EASTERN = "America/New_York";
const DAILY = 0b1111111;
const FRIDAY = 0b0010000;

const station = (code: string, latitude: number, longitude: number): Station => ({
  code,
  name: `${code} Station`,
  timeZone: EASTERN,
  latitude,
  longitude,
});

const hm = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours! * 60 + minutes!) * 60;
};

const trip = (id: string, routeName: string, serviceId: string, calls: [string, string, number][]): TransitTrip => ({
  id,
  routeName,
  trainNumber: id.replace(/\D/g, ""),
  serviceId,
  shapeId: id === "T1" ? "S1" : null,
  stopTimes: calls.map(([stationCode, time, distanceMiles], index) => ({
    stationCode,
    arrivalSeconds: hm(time),
    departureSeconds: hm(time),
    distanceMiles,
    shapeIndex: id === "T1" ? index * 2 : null,
  })),
});

/** Charlotte plus a handful of stations with trips that exercise direct, transfer, overnight and re-boarding cases. */
export function buildTransitNetwork(): TransitNetwork {
  return {
    agencyTimeZone: EASTERN,
    stations: new Map(
      [
        station("CLT", 35.24, -80.82),
        station("BBB", 36.0, -79.9),
        station("CCC", 36.8, -78.5),
        station("DDD", 37.5, -77.4),
        station("EEE", 33.7, -84.4),
        station("GAS", 35.26, -81.18),
        station("WAS", 38.9, -77.0),
        station("ZZZ", 40.0, -75.0),
      ].map((entry) => [entry.code, entry]),
    ),
    trips: [
      trip("T1", "Alpha", "DAILY", [["CLT", "08:00", 0], ["BBB", "10:00", 90], ["CCC", "12:00", 180]]),
      trip("T2", "Beta", "DAILY", [["CCC", "12:20", 0], ["DDD", "14:00", 100]]),
      trip("T4", "Beta", "DAILY", [["CCC", "13:00", 0], ["DDD", "15:00", 100]]),
      trip("T6", "Night", "FRIDAY_ONLY", [["CLT", "23:00", 0], ["EEE", "25:30", 240]]),
      trip("T8", "South", "DAILY", [["CLT", "06:00", 0], ["GAS", "06:30", 20]]),
      trip("T10", "North", "DAILY", [["GAS", "07:15", 0], ["CLT", "07:45", 20], ["WAS", "16:00", 400]]),
    ],
    calendars: new Map([
      ["DAILY", { serviceId: "DAILY", weekdays: DAILY, startDate: "2026-01-01", endDate: "2026-12-31" }],
      ["FRIDAY_ONLY", { serviceId: "FRIDAY_ONLY", weekdays: FRIDAY, startDate: "2026-10-01", endDate: "2026-10-31" }],
    ]),
  };
}

export const FIXTURE_SHAPES: Record<string, LatLng[]> = {
  S1: [
    [35.24, -80.82],
    [35.6, -80.4],
    [36.0, -79.9],
    [36.4, -79.2],
    [36.8, -78.5],
  ],
};
