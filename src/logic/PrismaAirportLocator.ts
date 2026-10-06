import { injectable } from "tsyringe";

import type { AirportLocator } from "@/interfaces/airportLocator";
import { getDb } from "@/lib/db";
import { haversineMiles } from "@/lib/geo";
import type { Airport } from "@/types/airport";

/** Nearest-airport lookups over the imported airports table, held in memory after the first query. */
@injectable()
export class PrismaAirportLocator implements AirportLocator {
  private airports: Promise<Airport[]> | null = null;

  async findNearest(latitude: number, longitude: number): Promise<Airport | null> {
    let nearest: Airport | null = null;
    let nearestMiles = Number.POSITIVE_INFINITY;
    for (const airport of await this.getAirports()) {
      const miles = haversineMiles(latitude, longitude, airport.latitude, airport.longitude);
      if (miles < nearestMiles) {
        nearest = airport;
        nearestMiles = miles;
      }
    }
    return nearest;
  }

  async findByCode(code: string): Promise<Airport | null> {
    return (await this.getAirports()).find((airport) => airport.code === code) ?? null;
  }

  private getAirports(): Promise<Airport[]> {
    this.airports ??= getDb()
      .airport.findMany({
        select: { code: true, name: true, municipality: true, region: true, latitude: true, longitude: true },
      })
      .catch((err: unknown) => {
        this.airports = null;
        throw err;
      });
    return this.airports;
  }
}
