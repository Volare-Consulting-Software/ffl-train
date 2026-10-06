import { injectable } from "tsyringe";

import type { Prisma } from "@/generated/prisma/client";
import type { FlightQuoteRepository } from "@/interfaces/flightQuoteRepository";
import { getDb } from "@/lib/db";
import { toIsoDate } from "@/lib/dates";
import type { FlightQuote } from "@/types/flightQuote";
import type { FlightSearchResult } from "@/types/flightSearchResult";
import type { FlightSegment } from "@/types/flightSegment";

interface FlightQuoteRow {
  airportCode: string;
  flightDate: Date;
  priceUsd: number | null;
  connections: number | null;
  durationMinutes: number | null;
  flightDistanceMiles: number;
  fetchedAt: Date;
  raw: Prisma.JsonValue;
}

/** Shape of the `raw` column: the fare details shown in the drawer plus the search payload. */
interface StoredRaw {
  segments?: FlightSegment[];
  googleFlightsUrl?: string | null;
  search?: unknown;
}

const asDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

/** Fare search results stored in the flight_quotes table. */
@injectable()
export class PrismaFlightQuoteRepository implements FlightQuoteRepository {
  async find(airportCode: string, flightDate: string): Promise<FlightQuote | null> {
    const row = await getDb().flightQuote.findUnique({
      where: { airportCode_flightDate: { airportCode, flightDate: asDate(flightDate) } },
    });
    return row ? toQuote(row) : null;
  }

  async save(airportCode: string, flightDate: string, flightDistanceMiles: number, result: FlightSearchResult): Promise<FlightQuote> {
    const raw: StoredRaw = { segments: result.segments, googleFlightsUrl: result.googleFlightsUrl, search: result.raw ?? null };
    const data = {
      priceUsd: result.priceUsd,
      connections: result.connections,
      durationMinutes: result.durationMinutes,
      flightDistanceMiles,
      fetchedAt: new Date(),
      raw: raw as Prisma.InputJsonValue,
    };
    const row = await getDb().flightQuote.upsert({
      where: { airportCode_flightDate: { airportCode, flightDate: asDate(flightDate) } },
      create: { airportCode, flightDate: asDate(flightDate), ...data },
      update: data,
    });
    return toQuote(row);
  }
}

function toQuote(row: FlightQuoteRow): FlightQuote {
  const raw = (row.raw ?? {}) as StoredRaw;
  return {
    airportCode: row.airportCode,
    flightDate: toIsoDate(row.flightDate),
    priceUsd: row.priceUsd,
    connections: row.connections,
    durationMinutes: row.durationMinutes,
    flightDistanceMiles: row.flightDistanceMiles,
    segments: raw.segments ?? [],
    googleFlightsUrl: raw.googleFlightsUrl ?? null,
    fetchedAt: row.fetchedAt.toISOString(),
  };
}
