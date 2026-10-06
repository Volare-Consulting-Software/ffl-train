import type { TransitStopTime } from "@/types/transitStopTime";

/** A scheduled train run with its calls in order. */
export interface TransitTrip {
  id: string;
  routeName: string;
  trainNumber: string;
  serviceId: string;
  shapeId: string | null;
  stopTimes: TransitStopTime[];
}
