import type { FlightQuote } from "@/types/flightQuote";
import type { FlightSearchResult } from "@/types/flightSearchResult";

/** Stored fare search results, so each airport and date is only paid for once. */
export interface FlightQuoteRepository {
  find(airportCode: string, flightDate: string): Promise<FlightQuote | null>;
  save(airportCode: string, flightDate: string, flightDistanceMiles: number, result: FlightSearchResult): Promise<FlightQuote>;
}

export const FlightQuoteRepositoryToken = Symbol.for("FlightQuoteRepository");
