import type { FlightSearchResult } from "@/types/flightSearchResult";
import type { StoredFlightSearch } from "@/types/storedFlightSearch";

/** Saved fare searches, so each airport and date is only paid for once. */
export interface FlightSearchRepository {
  find(airportCode: string, flightDate: string): Promise<StoredFlightSearch | null>;
  save(airportCode: string, flightDate: string, flightDistanceMiles: number, result: FlightSearchResult): Promise<StoredFlightSearch>;
}

export const FlightSearchRepositoryToken = Symbol.for("FlightSearchRepository");
