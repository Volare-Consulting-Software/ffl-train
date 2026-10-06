import type { Station } from "@/types/station";

/** A train calling at a station. Times are ISO-8601 UTC instants; format them in `station.timeZone`. */
export interface StopVisit {
  station: Station;
  arrival: string;
  departure: string;
}
