import { It, Mock, Times } from "moq.ts";

import type { AirportLocator } from "@/interfaces/airportLocator";
import type { DateRateLimiter } from "@/interfaces/dateRateLimiter";
import type { FlightSearchClient } from "@/interfaces/flightSearchClient";
import type { FlightSearchRepository } from "@/interfaces/flightSearchRepository";
import type { TripService } from "@/interfaces/tripService";
import { CachedFlightQuoteService } from "@/logic/CachedFlightQuoteService";
import type { Airport } from "@/types/airport";
import type { FlightItinerary } from "@/types/flightItinerary";
import type { FlightSearchResult } from "@/types/flightSearchResult";
import type { StoredFlightSearch } from "@/types/storedFlightSearch";
import type { TripDetail } from "@/types/tripDetail";

const PICK_ID = 7;
const DEPARTURE_DATE = "2026-10-09";
const CLIENT = "client-hash";
const ARRIVAL_DAY = "2026-10-10";
const NEXT_DAY = "2026-10-11";
const ORD: Airport = { code: "ORD", name: "O'Hare", municipality: "Chicago", region: "IL", latitude: 41.98, longitude: -87.9 };
const CLT: Airport = { code: "CLT", name: "Charlotte Douglas", municipality: "Charlotte", region: "NC", latitude: 35.21, longitude: -80.94 };
const CHICAGO_STATION = { code: "CHI", name: "Chicago Union Station", timeZone: "America/Chicago", latitude: 41.88, longitude: -87.64 };
// The train arrives 08:45 Central on Oct 10, so flights must leave at 10:45 or later.
const TRIP: TripDetail = {
  pick: { id: PICK_ID, season: 2026, week: 5, pickerTeamId: 3, pickerName: "Person 3", stationCode: "CHI", destinationName: "Chicago" },
  airport: ORD,
  itinerary: {
    legs: [
      {
        trainName: "Floridian",
        trainNumber: "40",
        board: { station: { ...CHICAGO_STATION, code: "CLT" }, arrival: "2026-10-09T09:31:00.000Z", departure: "2026-10-09T09:31:00.000Z" },
        alight: { station: CHICAGO_STATION, arrival: "2026-10-10T13:45:00.000Z", departure: "2026-10-10T13:45:00.000Z" },
        intermediateStops: [],
        distanceMiles: 1152,
        path: [],
      },
    ],
    layovers: [],
    departure: "2026-10-09T09:31:00.000Z",
    arrival: "2026-10-10T13:45:00.000Z",
    totalMinutes: 1694,
    totalMiles: 1152,
  },
};

const fare = (priceUsd: number, departs: string, stops = 0): FlightItinerary => ({
  priceUsd,
  durationMinutes: 120,
  segments: Array.from({ length: stops + 1 }, (_, index) => ({
    airline: "American",
    flightNumber: `AA ${index + 1}`,
    departureAirport: index === 0 ? "ORD" : "DFW",
    departureTime: departs,
    arrivalAirport: "CLT",
    arrivalTime: departs,
    durationMinutes: 60,
  })),
});
const stored = (flightDate: string, itineraries: FlightItinerary[]): StoredFlightSearch => ({
  airportCode: "ORD",
  flightDate,
  flightDistanceMiles: 600,
  itineraries,
  googleFlightsUrl: null,
  fetchedAt: "2026-10-06T12:00:00.000Z",
});

interface Scenario {
  cached?: Record<string, StoredFlightSearch>;
  searchResults?: Record<string, FlightItinerary[]>;
  allowed?: boolean;
}

function buildService({ cached = {}, searchResults = {}, allowed = true }: Scenario) {
  const repository = new Mock<FlightSearchRepository>()
    .setup((instance) => instance.find(It.IsAny(), It.IsAny()))
    .callback(({ args: [, flightDate] }) => Promise.resolve(cached[flightDate as string] ?? null))
    .setup((instance) => instance.save(It.IsAny(), It.IsAny(), It.IsAny(), It.IsAny()))
    .callback(({ args: [, flightDate, , result] }) => Promise.resolve(stored(flightDate as string, (result as FlightSearchResult).itineraries)));
  const searchClient = new Mock<FlightSearchClient>()
    .setup((client) => client.searchOneWay(It.IsAny(), It.IsAny(), It.IsAny()))
    .callback(({ args: [, , flightDate] }) =>
      Promise.resolve({ itineraries: searchResults[flightDate as string] ?? [], googleFlightsUrl: null, raw: {} }),
    );
  const rateLimiter = new Mock<DateRateLimiter>()
    .setup((limiter) => limiter.check(CLIENT, DEPARTURE_DATE))
    .returnsAsync({ allowed, datesUsedThisWeek: 1, limit: 3 })
    .setup((limiter) => limiter.consume(CLIENT, DEPARTURE_DATE))
    .returnsAsync({ allowed, datesUsedThisWeek: 2, limit: 3 });
  const tripService = new Mock<TripService>().setup((service) => service.getDetail(PICK_ID, DEPARTURE_DATE)).returnsAsync(TRIP);
  const airportLocator = new Mock<AirportLocator>().setup((locator) => locator.findByCode("CLT")).returnsAsync(CLT);

  const service = new CachedFlightQuoteService(
    tripService.object(),
    airportLocator.object(),
    repository.object(),
    searchClient.object(),
    rateLimiter.object(),
  );
  return { service, searchClient, rateLimiter };
}

describe("quoteForTrip", () => {
  it("quoteForTrip_cheaperFlightLeavesBeforeTrainArrives_returnsCheapestCatchableFlight", async () => {
    const { service, searchClient } = buildService({
      searchResults: { [ARRIVAL_DAY]: [fare(99, `${ARRIVAL_DAY} 07:00`), fare(180, `${ARRIVAL_DAY} 10:30`), fare(240, `${ARRIVAL_DAY} 12:15`, 1)] },
    });

    const result = await service.quoteForTrip(PICK_ID, DEPARTURE_DATE, CLIENT);

    expect(result).toEqual({
      status: "ok",
      quote: expect.objectContaining({ priceUsd: 240, connections: 1, flightDate: ARRIVAL_DAY, earliestDeparture: `${ARRIVAL_DAY} 10:45`, flightDistanceMiles: 600 }),
    });
    searchClient.verify((client) => client.searchOneWay("ORD", "CLT", ARRIVAL_DAY), Times.Once());
    searchClient.verify((client) => client.searchOneWay(It.IsAny(), It.IsAny(), NEXT_DAY), Times.Never());
  });

  it("quoteForTrip_noFlightsLeftOnArrivalDay_searchesNextDay", async () => {
    const { service, searchClient } = buildService({
      searchResults: { [ARRIVAL_DAY]: [fare(99, `${ARRIVAL_DAY} 07:00`)], [NEXT_DAY]: [fare(150, `${NEXT_DAY} 06:00`)] },
    });

    const result = await service.quoteForTrip(PICK_ID, DEPARTURE_DATE, CLIENT);

    expect(result).toEqual({ status: "ok", quote: expect.objectContaining({ priceUsd: 150, flightDate: NEXT_DAY }) });
    searchClient.verify((client) => client.searchOneWay("ORD", "CLT", NEXT_DAY), Times.Once());
  });

  it("quoteForTrip_storedSearch_returnsItWithoutPaidSearchOrRateLimit", async () => {
    const { service, searchClient, rateLimiter } = buildService({
      cached: { [ARRIVAL_DAY]: stored(ARRIVAL_DAY, [fare(189, `${ARRIVAL_DAY} 13:00`)]) },
      allowed: false,
    });

    expect(await service.quoteForTrip(PICK_ID, DEPARTURE_DATE, CLIENT)).toEqual({
      status: "ok",
      quote: expect.objectContaining({ priceUsd: 189 }),
    });
    searchClient.verify((client) => client.searchOneWay(It.IsAny(), It.IsAny(), It.IsAny()), Times.Never());
    rateLimiter.verify((limiter) => limiter.check(It.IsAny(), It.IsAny()), Times.Never());
  });

  it("quoteForTrip_cacheMissOverLimit_returnsRateLimitedWithoutSearching", async () => {
    const { service, searchClient } = buildService({ allowed: false });

    expect(await service.quoteForTrip(PICK_ID, DEPARTURE_DATE, CLIENT)).toEqual({ status: "rate-limited" });
    searchClient.verify((client) => client.searchOneWay(It.IsAny(), It.IsAny(), It.IsAny()), Times.Never());
  });

  it("quoteForTrip_noCatchableFlightEitherDay_returnsQuoteWithoutPrice", async () => {
    const { service } = buildService({});

    const result = await service.quoteForTrip(PICK_ID, DEPARTURE_DATE, CLIENT);

    expect(result).toEqual({ status: "ok", quote: expect.objectContaining({ priceUsd: null, flightDate: NEXT_DAY }) });
  });

  it("quoteForTrip_paidSearchFails_doesNotCountDateAgainstLimit", async () => {
    const { service, searchClient, rateLimiter } = buildService({});
    searchClient.setup((client) => client.searchOneWay(It.IsAny(), It.IsAny(), It.IsAny())).throwsAsync(new Error("SERPAPI_KEY is not set"));

    await expect(service.quoteForTrip(PICK_ID, DEPARTURE_DATE, CLIENT)).rejects.toThrow("SERPAPI_KEY is not set");
    rateLimiter.verify((limiter) => limiter.consume(It.IsAny(), It.IsAny()), Times.Never());
  });
});
