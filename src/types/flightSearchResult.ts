import type { FlightItinerary } from "@/types/flightItinerary";

/** Every priced fare from a live search, plus the raw payload for auditing. */
export interface FlightSearchResult {
  itineraries: FlightItinerary[];
  googleFlightsUrl: string | null;
  raw: unknown;
}
