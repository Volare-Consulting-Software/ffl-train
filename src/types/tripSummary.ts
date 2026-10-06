import type { Airport } from "@/types/airport";
import type { Pick } from "@/types/pick";
import type { Station } from "@/types/station";

/** One row of the trips table: a pick and its train journey for the selected date. */
export interface TripSummary {
  pick: Pick;
  destination: Station | null;
  totalMiles: number | null;
  totalMinutes: number | null;
  arrival: string | null;
  transfers: number | null;
  airport: Airport | null;
  error: string | null;
}
