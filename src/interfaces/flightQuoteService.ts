import type { FlightLookupResult } from "@/types/flightLookupResult";

/** Fares from a picked destination's nearest airport back to CLT. */
export interface FlightQuoteService {
  /**
   * The fare for the day the train arrives. Served from the database when stored; otherwise runs a
   * paid search, provided the client's weekly date allowance permits it.
   */
  quoteForTrip(pickId: number, departureDate: string, clientId: string): Promise<FlightLookupResult>;
}

export const FlightQuoteServiceToken = Symbol.for("FlightQuoteService");
