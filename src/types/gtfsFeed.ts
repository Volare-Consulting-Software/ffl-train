import type { LatLng } from "@/types/latLng";
import type { ServiceCalendar } from "@/types/serviceCalendar";
import type { Station } from "@/types/station";
import type { TransitStopTime } from "@/types/transitStopTime";

/** Rail-only rows parsed from an Amtrak GTFS zip, shaped for the database tables. */
export interface GtfsFeed {
  routes: { id: string; name: string }[];
  trips: { id: string; routeId: string; serviceId: string; trainNumber: string; headsign: string; shapeId: string | null }[];
  stations: Station[];
  stopTimes: (TransitStopTime & { tripId: string; sequence: number })[];
  calendars: ServiceCalendar[];
  shapes: { id: string; points: LatLng[] }[];
}
