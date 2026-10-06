import { injectable } from "tsyringe";

import type { Prisma } from "@/generated/prisma/client";
import type { FlightSearchRepository } from "@/interfaces/flightSearchRepository";
import { getDb } from "@/lib/db";
import { toIsoDate } from "@/lib/dates";
import type { FlightItinerary } from "@/types/flightItinerary";
import type { FlightSearchResult } from "@/types/flightSearchResult";
import type { StoredFlightSearch } from "@/types/storedFlightSearch";

interface FlightSearchRow {
  airportCode: string;
  flightDate: Date;
  flightDistanceMiles: number;
  itineraries: Prisma.JsonValue;
  googleFlightsUrl: string | null;
  fetchedAt: Date;
}

const asDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

/** Fare searches stored in the flight_searches table. */
@injectable()
export class PrismaFlightSearchRepository implements FlightSearchRepository {
  async find(airportCode: string, flightDate: string): Promise<StoredFlightSearch | null> {
    const row = await getDb().flightSearch.findUnique({
      where: { airportCode_flightDate: { airportCode, flightDate: asDate(flightDate) } },
    });
    return row ? toStored(row) : null;
  }

  async save(
    airportCode: string,
    flightDate: string,
    flightDistanceMiles: number,
    result: FlightSearchResult,
  ): Promise<StoredFlightSearch> {
    const data = {
      flightDistanceMiles,
      itineraries: result.itineraries as unknown as Prisma.InputJsonValue,
      googleFlightsUrl: result.googleFlightsUrl,
      raw: (result.raw ?? {}) as Prisma.InputJsonValue,
      fetchedAt: new Date(),
    };
    const row = await getDb().flightSearch.upsert({
      where: { airportCode_flightDate: { airportCode, flightDate: asDate(flightDate) } },
      create: { airportCode, flightDate: asDate(flightDate), ...data },
      update: data,
    });
    return toStored(row);
  }
}

function toStored(row: FlightSearchRow): StoredFlightSearch {
  return {
    airportCode: row.airportCode,
    flightDate: toIsoDate(row.flightDate),
    flightDistanceMiles: row.flightDistanceMiles,
    itineraries: (row.itineraries ?? []) as unknown as FlightItinerary[],
    googleFlightsUrl: row.googleFlightsUrl,
    fetchedAt: row.fetchedAt.toISOString(),
  };
}
