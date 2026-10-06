import type { Airport } from "@/types/airport";

/** An airport as stored in the airports table. */
export interface AirportRow extends Airport {
  country: string;
}
