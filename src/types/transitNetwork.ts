import type { ServiceCalendar } from "@/types/serviceCalendar";
import type { Station } from "@/types/station";
import type { TransitTrip } from "@/types/transitTrip";

/** The full Amtrak train schedule held in memory for routing. */
export interface TransitNetwork {
  agencyTimeZone: string;
  stations: Map<string, Station>;
  trips: TransitTrip[];
  calendars: Map<string, ServiceCalendar>;
}
