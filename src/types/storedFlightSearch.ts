import type { FlightItinerary } from "@/types/flightItinerary";

/** A saved search for one airport and date, reused by every later lookup. */
export interface StoredFlightSearch {
  airportCode: string;
  flightDate: string;
  flightDistanceMiles: number;
  itineraries: FlightItinerary[];
  googleFlightsUrl: string | null;
  fetchedAt: string;
}
