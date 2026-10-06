import { injectable } from "tsyringe";

import type { FlightSearchClient } from "@/interfaces/flightSearchClient";
import type { FlightSearchResult } from "@/types/flightSearchResult";

const SERPAPI_URL = "https://serpapi.com/search.json";
const ONE_WAY = "2";

interface SerpApiItinerary {
  flights?: unknown[];
  total_duration?: number;
  price?: number;
}

interface SerpApiResponse {
  error?: string;
  best_flights?: SerpApiItinerary[];
  other_flights?: SerpApiItinerary[];
}

/** One-way Google Flights searches through SerpApi. */
@injectable()
export class SerpApiFlightSearchClient implements FlightSearchClient {
  async searchOneWay(fromAirportCode: string, toAirportCode: string, flightDate: string): Promise<FlightSearchResult> {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      throw new Error("SERPAPI_KEY is not set");
    }
    const query = new URLSearchParams({
      engine: "google_flights",
      type: ONE_WAY,
      departure_id: fromAirportCode,
      arrival_id: toAirportCode,
      outbound_date: flightDate,
      currency: "USD",
      hl: "en",
      gl: "us",
      api_key: apiKey,
    });
    const response = await fetch(`${SERPAPI_URL}?${query}`);
    const body = (await response.json()) as SerpApiResponse;
    if (!response.ok) {
      throw new Error(`SerpApi search failed with ${response.status}: ${body.error ?? "unknown error"}`);
    }
    return toSearchResult(body);
  }
}

/** Picks the cheapest priced itinerary across best and other flights. An empty search is a valid "no flights" result. */
export function toSearchResult(body: SerpApiResponse): FlightSearchResult {
  const itineraries = [...(body.best_flights ?? []), ...(body.other_flights ?? [])].filter(
    (itinerary) => typeof itinerary.price === "number",
  );
  const cheapest = itineraries.reduce<SerpApiItinerary | null>(
    (best, itinerary) => (best === null || itinerary.price! < best.price! ? itinerary : best),
    null,
  );
  if (!cheapest) {
    return { priceUsd: null, connections: null, durationMinutes: null, raw: body };
  }
  return {
    priceUsd: cheapest.price!,
    connections: Math.max((cheapest.flights?.length ?? 1) - 1, 0),
    durationMinutes: cheapest.total_duration ?? null,
    raw: { best_flights: body.best_flights ?? [], other_flights: body.other_flights ?? [] },
  };
}
