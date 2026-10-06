import type { FlightSearchResult } from "@/types/flightSearchResult";

/** A paid, live fare search. Every call costs money, so callers go through the cache first. */
export interface FlightSearchClient {
  searchOneWay(fromAirportCode: string, toAirportCode: string, flightDate: string): Promise<FlightSearchResult>;
}

export const FlightSearchClientToken = Symbol.for("FlightSearchClient");
