import { inject, injectable } from "tsyringe";

import { type AirportLocator, AirportLocatorToken } from "@/interfaces/airportLocator";
import { type DateRateLimiter, DateRateLimiterToken } from "@/interfaces/dateRateLimiter";
import { type FlightQuoteRepository, FlightQuoteRepositoryToken } from "@/interfaces/flightQuoteRepository";
import type { FlightQuoteService } from "@/interfaces/flightQuoteService";
import { type FlightSearchClient, FlightSearchClientToken } from "@/interfaces/flightSearchClient";
import { type TripService, TripServiceToken } from "@/interfaces/tripService";
import { dateInZone } from "@/lib/dates";
import { haversineMiles } from "@/lib/geo";
import type { FlightLookupResult } from "@/types/flightLookupResult";

export const HOME_AIRPORT_CODE = "CLT";

/** Database-first fare lookups; only a cache miss within the client's weekly allowance reaches the paid search. */
@injectable()
export class CachedFlightQuoteService implements FlightQuoteService {
  constructor(
    @inject(TripServiceToken) private readonly tripService: TripService,
    @inject(AirportLocatorToken) private readonly airportLocator: AirportLocator,
    @inject(FlightQuoteRepositoryToken) private readonly flightQuoteRepository: FlightQuoteRepository,
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
    const flightDate = dateInZone(new Date(trip.itinerary.arrival), destination.timeZone);

    const cached = await this.flightQuoteRepository.find(trip.airport.code, flightDate);
    if (cached) {
      return { status: "ok", quote: cached };
    }
    const decision = await this.dateRateLimiter.check(clientId, departureDate);
    if (!decision.allowed) {
      return { status: "rate-limited" };
    }

    const home = await this.airportLocator.findByCode(HOME_AIRPORT_CODE);
    if (!home) {
      throw new Error(`Airport ${HOME_AIRPORT_CODE} is missing; run npm run airports:import`);
    }
    const distance = Math.round(haversineMiles(trip.airport.latitude, trip.airport.longitude, home.latitude, home.longitude));
    const result = await this.flightSearchClient.searchOneWay(trip.airport.code, HOME_AIRPORT_CODE, flightDate);
    const quote = await this.flightQuoteRepository.save(trip.airport.code, flightDate, distance, result);
    // Count the date only once a paid search has succeeded, so failed lookups don't use up the allowance.
    await this.dateRateLimiter.consume(clientId, departureDate);
    return { status: "ok", quote };
  }
}
