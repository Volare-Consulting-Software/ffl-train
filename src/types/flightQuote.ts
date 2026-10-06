import type { FlightSegment } from "@/types/flightSegment";

/** The cheapest catchable one-way fare from an airport back to CLT after the train arrives. */
export interface FlightQuote {
  airportCode: string;
  flightDate: string;
  priceUsd: number | null;
  connections: number | null;
  durationMinutes: number | null;
  flightDistanceMiles: number;
  segments: FlightSegment[];
  googleFlightsUrl: string | null;
  /** Earliest allowed departure, local to the destination, as `YYYY-MM-DD HH:MM`. */
  earliestDeparture: string;
  fetchedAt: string;
}
