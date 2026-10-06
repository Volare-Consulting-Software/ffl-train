/** The cheapest one-way fare found from an airport back to CLT on a date. */
export interface FlightQuote {
  airportCode: string;
  flightDate: string;
  priceUsd: number | null;
  connections: number | null;
  durationMinutes: number | null;
  flightDistanceMiles: number;
  fetchedAt: string;
}
