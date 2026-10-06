import type { Itinerary } from "@/types/itinerary";

/** Plans train journeys over the Amtrak network. */
export interface TrainRouter {
  /**
   * Earliest-arriving journey leaving `originCode` on or after midnight of `departureDate`
   * in the origin's local time. Returns null when the destination can't be reached within the search window.
   */
  findItinerary(originCode: string, destinationCode: string, departureDate: string): Promise<Itinerary | null>;
}

export const TrainRouterToken = Symbol.for("TrainRouter");
