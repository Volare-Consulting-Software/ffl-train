import type { TripDetail } from "@/types/tripDetail";
import type { TripSummary } from "@/types/tripSummary";

/** Train journeys from Charlotte to each picked destination. */
export interface TripService {
  listSummaries(departureDate: string): Promise<TripSummary[]>;
  getDetail(pickId: number, departureDate: string): Promise<TripDetail | null>;
}

export const TripServiceToken = Symbol.for("TripService");
