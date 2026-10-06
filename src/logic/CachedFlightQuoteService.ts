import { inject, injectable } from "tsyringe";

import { type AirportLocator, AirportLocatorToken } from "@/interfaces/airportLocator";
import { type DateRateLimiter, DateRateLimiterToken } from "@/interfaces/dateRateLimiter";
import type { FlightQuoteService } from "@/interfaces/flightQuoteService";
import { type FlightSearchClient, FlightSearchClientToken } from "@/interfaces/flightSearchClient";
import { type FlightSearchRepository, FlightSearchRepositoryToken } from "@/interfaces/flightSearchRepository";
import { type TripService, TripServiceToken } from "@/interfaces/tripService";
import { addDays, localDateTime } from "@/lib/dates";
import { haversineMiles } from "@/lib/geo";
import type { Airport } from "@/types/airport";
import type { FlightLookupResult } from "@/types/flightLookupResult";
import type { FlightQuote } from "@/types/flightQuote";
import type { StoredFlightSearch } from "@/types/storedFlightSearch";

export const HOME_AIRPORT_CODE = "CLT";
export const MIN_MINUTES_AFTER_ARRIVAL = 120;

class RateLimitedError extends Error {}

/**
 * Finds the cheapest flight home that leaves at least two hours after the train arrives: first on the
 * arrival day, then the next day if nothing that late is left. Searches are stored per airport and date,
 * so only a cache miss within the client's weekly date allowance reaches the paid search.
 */
@injectable()
export class CachedFlightQuoteService implements FlightQuoteService {
  constructor(
    @inject(TripServiceToken) private readonly tripService: TripService,
    @inject(AirportLocatorToken) private readonly airportLocator: AirportLocator,
    @inject(FlightSearchRepositoryToken) private readonly flightSearchRepository: FlightSearchRepository,
    @inject(FlightSearchClientToken) private readonly flightSearchClient: FlightSearchClient,
    @inject(DateRateLimiterToken) private readonly dateRateLimiter: DateRateLimiter,
  ) {}

  async quoteForTrip(pickId: number, departureDate: string, clientId: string): Promise<FlightLookupResult> {
    const trip = await this.tripService.getDetail(pickId, departureDate);
    if (!trip) {
      return { status: "not-found", reason: "No train route for this pick and date" };
    }
    if (!trip.airport) {
      return { status: "not-found", reason: "No large airport near this destination" };
    }
    const destination = trip.itinerary.legs[trip.itinerary.legs.length - 1]!.alight.station;
    const arrivalMs = Date.parse(trip.itinerary.arrival);
    const arrivalDate = localDateTime(new Date(arrivalMs), destination.timeZone).slice(0, 10);
    const earliestDeparture = localDateTime(new Date(arrivalMs + MIN_MINUTES_AFTER_ARRIVAL * 60_000), destination.timeZone);
    const lookup = { airport: trip.airport, departureDate, clientId };

    try {
      const sameDay = await this.getSearch({ ...lookup, flightDate: arrivalDate });
      const sameDayQuote = cheapestAfter(sameDay, earliestDeparture);
      if (sameDayQuote) {
        return { status: "ok", quote: sameDayQuote };
      }
      const nextDay = await this.getSearch({ ...lookup, flightDate: addDays(arrivalDate, 1) });
      return {
        status: "ok",
        quote: cheapestAfter(nextDay, earliestDeparture) ?? toQuote(nextDay, null, earliestDeparture),
      };
    } catch (err) {
      if (err instanceof RateLimitedError) {
        return { status: "rate-limited" };
      }
      throw err;
    }
  }

  private async getSearch(lookup: { airport: Airport; flightDate: string; departureDate: string; clientId: string }) {
    const { airport, flightDate, departureDate, clientId } = lookup;
    const cached = await this.flightSearchRepository.find(airport.code, flightDate);
    if (cached) {
      return cached;
    }
    const decision = await this.dateRateLimiter.check(clientId, departureDate);
    if (!decision.allowed) {
      throw new RateLimitedError();
    }
    const home = await this.airportLocator.findByCode(HOME_AIRPORT_CODE);
    if (!home) {
      throw new Error(`Airport ${HOME_AIRPORT_CODE} is missing; run npm run airports:import`);
    }
    const distance = Math.round(haversineMiles(airport.latitude, airport.longitude, home.latitude, home.longitude));
    const result = await this.flightSearchClient.searchOneWay(airport.code, HOME_AIRPORT_CODE, flightDate);
    const stored = await this.flightSearchRepository.save(airport.code, flightDate, distance, result);
    // Count the date only once a paid search has succeeded, so failed lookups don't use up the allowance.
    await this.dateRateLimiter.consume(clientId, departureDate);
    return stored;
  }
}

/** Cheapest fare whose first flight leaves at or after `earliestDeparture` (local `YYYY-MM-DD HH:MM` strings compare in order). */
function cheapestAfter(search: StoredFlightSearch, earliestDeparture: string): FlightQuote | null {
  const catchable = search.itineraries
    .filter((itinerary) => (itinerary.segments[0]?.departureTime ?? "") >= earliestDeparture)
    .sort((a, b) => a.priceUsd - b.priceUsd);
  return catchable[0] ? toQuote(search, catchable[0], earliestDeparture) : null;
}

function toQuote(
  search: StoredFlightSearch,
  itinerary: StoredFlightSearch["itineraries"][number] | null,
  earliestDeparture: string,
): FlightQuote {
  return {
    airportCode: search.airportCode,
    flightDate: search.flightDate,
    priceUsd: itinerary?.priceUsd ?? null,
    connections: itinerary ? Math.max(itinerary.segments.length - 1, 0) : null,
    durationMinutes: itinerary?.durationMinutes ?? null,
    flightDistanceMiles: search.flightDistanceMiles,
    segments: itinerary?.segments ?? [],
    googleFlightsUrl: search.googleFlightsUrl,
    earliestDeparture,
    fetchedAt: search.fetchedAt,
  };
}
