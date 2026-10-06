import { injectable } from "tsyringe";

import type { FlightSearchClient } from "@/interfaces/flightSearchClient";
import { FlightSearchUnavailableError } from "@/logic/FlightSearchUnavailableError";
import type { FlightItinerary } from "@/types/flightItinerary";
import type { FlightSearchResult } from "@/types/flightSearchResult";
import type { FlightSegment } from "@/types/flightSegment";

const SERPAPI_URL = "https://serpapi.com/search.json";
const ONE_WAY = "2";
// Under the Lambda/CloudFront 30 s limit, so a stalled search fails cleanly instead of timing out the request.
const REQUEST_TIMEOUT_MS = 25_000;

interface SerpApiAirportTime {
  id?: string;
  time?: string;
}

interface SerpApiFlight {
  airline?: string;
  flight_number?: string;
  duration?: number;
  departure_airport?: SerpApiAirportTime;
  arrival_airport?: SerpApiAirportTime;
}

interface SerpApiItinerary {
  flights?: SerpApiFlight[];
  total_duration?: number;
  price?: number;
}

export interface SerpApiResponse {
  error?: string;
  search_metadata?: { google_flights_url?: string };
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
    let response: Response;
    try {
      response = await fetch(`${SERPAPI_URL}?${query}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (err) {
      throw new FlightSearchUnavailableError(`SerpApi request failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    return toSearchResult(parseSerpApiResponse(response.status, await response.text()));
  }
}

/**
 * Parses a SerpApi reply. When Google Flights is slow SerpApi can answer with an HTML error page instead
 * of JSON, so anything that isn't a JSON success becomes a retryable error carrying the status and a snippet.
 */
export function parseSerpApiResponse(status: number, text: string): SerpApiResponse {
  let body: SerpApiResponse;
  try {
    body = JSON.parse(text) as SerpApiResponse;
  } catch {
    throw new FlightSearchUnavailableError(`SerpApi returned ${status} non-JSON: ${text.replace(/s+/g, " ").slice(0, 160)}`);
  }
  if (status >= 400 || body.error) {
    throw new FlightSearchUnavailableError(`SerpApi returned ${status}: ${body.error ?? "unknown error"}`);
  }
  return body;
}

/** Maps every priced fare in best and other flights, cheapest first. An empty search is a valid "no flights" result. */
export function toSearchResult(body: SerpApiResponse): FlightSearchResult {
  const itineraries: FlightItinerary[] = [...(body.best_flights ?? []), ...(body.other_flights ?? [])]
    .filter((itinerary) => typeof itinerary.price === "number")
    .map((itinerary) => ({
      priceUsd: itinerary.price!,
      durationMinutes: itinerary.total_duration ?? null,
      segments: (itinerary.flights ?? []).map(toSegment),
    }))
    .sort((a, b) => a.priceUsd - b.priceUsd);
  return {
    itineraries,
    googleFlightsUrl: body.search_metadata?.google_flights_url ?? null,
    raw: { best_flights: body.best_flights ?? [], other_flights: body.other_flights ?? [] },
  };
}

function toSegment(flight: SerpApiFlight): FlightSegment {
  return {
    airline: flight.airline ?? "",
    flightNumber: flight.flight_number ?? "",
    departureAirport: flight.departure_airport?.id ?? "",
    departureTime: flight.departure_airport?.time ?? "",
    arrivalAirport: flight.arrival_airport?.id ?? "",
    arrivalTime: flight.arrival_airport?.time ?? "",
    durationMinutes: flight.duration ?? null,
  };
}
