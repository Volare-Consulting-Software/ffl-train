import type { Airport } from "@/types/airport";
import type { Itinerary } from "@/types/itinerary";
import type { Pick } from "@/types/pick";

/** A pick with its full itinerary, used to draw the route on the map. */
export interface TripDetail {
  pick: Pick;
  itinerary: Itinerary;
  airport: Airport | null;
}
