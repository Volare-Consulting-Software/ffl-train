import type { FlightSegment } from "@/types/flightSegment";

/** One bookable fare: its price and the flights that make it up, in order. */
export interface FlightItinerary {
  priceUsd: number;
  durationMinutes: number | null;
  segments: FlightSegment[];
}
