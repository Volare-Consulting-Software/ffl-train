/** The cheapest itinerary from a live fare search, plus the raw payload for auditing. */
export interface FlightSearchResult {
  priceUsd: number | null;
  connections: number | null;
  durationMinutes: number | null;
  raw: unknown;
}
