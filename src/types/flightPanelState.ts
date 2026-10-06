import type { Airport } from "@/types/airport";
import type { FlightQuote } from "@/types/flightQuote";

/** What the flight panel shows for the airport code a user clicked. */
export type FlightPanelState =
  | { airport: Airport; pickId: number; status: "loading" }
  | { airport: Airport; pickId: number; status: "ready"; quote: FlightQuote }
  | { airport: Airport; pickId: number; status: "error"; message: string };
