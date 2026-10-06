import type { TripOddsReport } from "@/types/tripOddsReport";

/** Each team's chance of riding the train: as the ultimate loser or as the companion the wheel picks. */
export interface TripOddsService {
  getOdds(season: number): Promise<TripOddsReport>;
}

export const TripOddsServiceToken = Symbol.for("TripOddsService");
