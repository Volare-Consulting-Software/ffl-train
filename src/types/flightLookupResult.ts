import type { FlightQuote } from "@/types/flightQuote";

/** Outcome of a flight lookup: a quote, the weekly date limit, or a trip with no airport or route. */
export type FlightLookupResult =
  | { status: "ok"; quote: FlightQuote }
  | { status: "rate-limited" }
  | { status: "not-found"; reason: string };
