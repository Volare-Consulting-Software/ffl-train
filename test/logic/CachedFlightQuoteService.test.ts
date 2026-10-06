import { It, Mock, Times } from "moq.ts";

import type { AirportLocator } from "@/interfaces/airportLocator";
import type { DateRateLimiter } from "@/interfaces/dateRateLimiter";
import type { FlightQuoteRepository } from "@/interfaces/flightQuoteRepository";
import type { FlightSearchClient } from "@/interfaces/flightSearchClient";
import type { TripService } from "@/interfaces/tripService";
import { CachedFlightQuoteService } from "@/logic/CachedFlightQuoteService";
import type { Airport } from "@/types/airport";
import type { FlightQuote } from "@/types/flightQuote";
import type { TripDetail } from "@/types/tripDetail";

const PICK_ID = 7;
const DEPARTURE_DATE = "2026-10-09";
const CLIENT = "client-hash";
const ORD: Airport = { code: "ORD", name: "O'Hare", municipality: "Chicago", region: "IL", latitude: 41.98, longitude: -87.9 };
const CLT: Airport = { code: "CLT", name: "Charlotte Douglas", municipality: "Charlotte", region: "NC", latitude: 35.21, longitude: -80.94 };
const CHICAGO_STATION = { code: "CHI", name: "Chicago Union Station", timeZone: "America/Chicago", latitude: 41.88, longitude: -87.64 };
// Arrives 08:45 Central on Oct 10, so the flight is searched for Oct 10.
const TRIP: TripDetail = {
  pick: { id: PICK_ID, season: 2026, week: 5, pickerTeamId: 3, pickerName: "Team 3", stationCode: "CHI", destinationName: "Chicago" },
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
const CACHED: FlightQuote = {
  airportCode: "ORD",
  flightDate: "2026-10-10",
  priceUsd: 189,
  connections: 0,
  durationMinutes: 115,
  flightDistanceMiles: 599,
  segments: [],
  googleFlightsUrl: null,
  fetchedAt: "2026-10-06T12:00:00.000Z",
};

function buildService(options: { cached: FlightQuote | null; allowed: boolean }) {
  const quoteRepository = new Mock<FlightQuoteRepository>()
    .setup((repository) => repository.find("ORD", "2026-10-10"))
    .returnsAsync(options.cached)
    .setup((repository) => repository.save(It.IsAny(), It.IsAny(), It.IsAny(), It.IsAny()))
    .callback(({ args: [, , distance, result] }) =>
      Promise.resolve({ ...CACHED, flightDistanceMiles: distance as number, priceUsd: (result as { priceUsd: number }).priceUsd }),
    );
  const searchClient = new Mock<FlightSearchClient>()
    .setup((client) => client.searchOneWay(It.IsAny(), It.IsAny(), It.IsAny()))
    .returnsAsync({ priceUsd: 240, connections: 1, durationMinutes: 200, segments: [], googleFlightsUrl: null, raw: {} });
  const rateLimiter = new Mock<DateRateLimiter>()
    .setup((limiter) => limiter.check(CLIENT, DEPARTURE_DATE))
    .returnsAsync({ allowed: options.allowed, datesUsedThisWeek: 1, limit: 3 })
    .setup((limiter) => limiter.consume(CLIENT, DEPARTURE_DATE))
    .returnsAsync({ allowed: options.allowed, datesUsedThisWeek: 2, limit: 3 });
  const tripService = new Mock<TripService>().setup((service) => service.getDetail(PICK_ID, DEPARTURE_DATE)).returnsAsync(TRIP);
  const airportLocator = new Mock<AirportLocator>().setup((locator) => locator.findByCode("CLT")).returnsAsync(CLT);

  const service = new CachedFlightQuoteService(
    tripService.object(),
    airportLocator.object(),
    quoteRepository.object(),
    searchClient.object(),
    rateLimiter.object(),
  );
  return { service, searchClient, rateLimiter };
}

describe("quoteForTrip", () => {
  it("quoteForTrip_storedQuote_returnsItWithoutPaidSearchOrRateLimit", async () => {
    const { service, searchClient, rateLimiter } = buildService({ cached: CACHED, allowed: false });

    expect(await service.quoteForTrip(PICK_ID, DEPARTURE_DATE, CLIENT)).toEqual({ status: "ok", quote: CACHED });
    searchClient.verify((client) => client.searchOneWay(It.IsAny(), It.IsAny(), It.IsAny()), Times.Never());
    rateLimiter.verify((limiter) => limiter.check(It.IsAny(), It.IsAny()), Times.Never());
  });

  it("quoteForTrip_cacheMissWithinLimit_searchesArrivalDateAndStores", async () => {
    const { service, searchClient, rateLimiter } = buildService({ cached: null, allowed: true });

    const result = await service.quoteForTrip(PICK_ID, DEPARTURE_DATE, CLIENT);

    expect(result).toEqual({ status: "ok", quote: expect.objectContaining({ priceUsd: 240, flightDistanceMiles: 600 }) });
    searchClient.verify((client) => client.searchOneWay("ORD", "CLT", "2026-10-10"), Times.Once());
    rateLimiter.verify((limiter) => limiter.consume(CLIENT, DEPARTURE_DATE), Times.Once());
  });

  it("quoteForTrip_paidSearchFails_doesNotCountDateAgainstLimit", async () => {
    const { service, searchClient, rateLimiter } = buildService({ cached: null, allowed: true });
    searchClient.setup((client) => client.searchOneWay(It.IsAny(), It.IsAny(), It.IsAny())).throwsAsync(new Error("SERPAPI_KEY is not set"));

    await expect(service.quoteForTrip(PICK_ID, DEPARTURE_DATE, CLIENT)).rejects.toThrow("SERPAPI_KEY is not set");
    rateLimiter.verify((limiter) => limiter.consume(It.IsAny(), It.IsAny()), Times.Never());
  });

  it("quoteForTrip_cacheMissOverLimit_returnsRateLimitedWithoutSearching", async () => {
    const { service, searchClient } = buildService({ cached: null, allowed: false });

    expect(await service.quoteForTrip(PICK_ID, DEPARTURE_DATE, CLIENT)).toEqual({ status: "rate-limited" });
    searchClient.verify((client) => client.searchOneWay(It.IsAny(), It.IsAny(), It.IsAny()), Times.Never());
  });
});
