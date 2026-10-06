import type { LatLng } from "@/types/latLng";
import type { StopVisit } from "@/types/stopVisit";

/** One train ridden from boarding to alighting, with every stop in between. */
export interface ItineraryLeg {
  trainName: string;
  trainNumber: string;
  board: StopVisit;
  alight: StopVisit;
  intermediateStops: StopVisit[];
  distanceMiles: number;
  path: LatLng[];
}
