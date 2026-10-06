import type { ItineraryLeg } from "@/types/itineraryLeg";
import type { Layover } from "@/types/layover";

/** The earliest-arriving train journey between two stations for a departure date. */
export interface Itinerary {
  legs: ItineraryLeg[];
  layovers: Layover[];
  departure: string;
  arrival: string;
  totalMinutes: number;
  totalMiles: number;
}
