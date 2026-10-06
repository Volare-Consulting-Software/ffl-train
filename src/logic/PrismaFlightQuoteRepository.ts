import { injectable } from "tsyringe";

import type { Prisma } from "@/generated/prisma/client";
import type { FlightQuoteRepository } from "@/interfaces/flightQuoteRepository";
import { getDb } from "@/lib/db";
import { toIsoDate } from "@/lib/dates";
import type { FlightQuote } from "@/types/flightQuote";
import type { FlightSearchResult } from "@/types/flightSearchResult";

interface FlightQuoteRow {
  airportCode: string;
  flightDate: Date;
  priceUsd: number | null;
  connections: number | null;
  durationMinutes: number | null;
  flightDistanceMiles: number;
  fetchedAt: Date;
}

/** Fare search results stored in the flight_quotes table. */
@injectable()
export class PrismaFlightQuoteRepository implements FlightQuoteRepository {
  async find(airportCode: string, flightDate: string): Promise<FlightQuote | null> {
    const row = await getDb().flightQuote.findUnique({
      where: { airportCode_flightDate: { airportCode, flightDate: new Date(`${flightDate}T00:00:00Z`) } },
    });
    return row ? toQuote(row) : null;
  }

  async save(airportCode: string, flightDate: string, flightDistanceMiles: number, result: FlightSearchResult): Promise<FlightQuote> {
    const data = {
      priceUsd: result.priceUsd,
      connections: result.connections,
      durationMinutes: result.durationMinutes,
      flightDistanceMiles,
      fetchedAt: new Date(),
      raw: (result.raw ?? {}) as Prisma.InputJsonValue,
    };
    const row = await getDb().flightQuote.upsert({
      where: { airportCode_flightDate: { airportCode, flightDate: new Date(`${flightDate}T00:00:00Z`) } },
      create: { airportCode, flightDate: new Date(`${flightDate}T00:00:00Z`), ...data },
      update: data,
    });
    return toQuote(row);
  }
}

function toQuote(row: FlightQuoteRow): FlightQuote {
  return {
    airportCode: row.airportCode,
    flightDate: toIsoDate(row.flightDate),
    priceUsd: row.priceUsd,
    connections: row.connections,
    durationMinutes: row.durationMinutes,
    flightDistanceMiles: row.flightDistanceMiles,
    fetchedAt: row.fetchedAt.toISOString(),
  };
}
