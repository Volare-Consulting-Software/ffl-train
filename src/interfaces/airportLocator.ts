import type { Airport } from "@/types/airport";

/** Finds airports near a point. */
export interface AirportLocator {
  /** The closest large airport, or null when none are loaded. */
  findNearest(latitude: number, longitude: number): Promise<Airport | null>;
  findByCode(code: string): Promise<Airport | null>;
}

export const AirportLocatorToken = Symbol.for("AirportLocator");
