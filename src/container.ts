import "reflect-metadata";
import { container, instanceCachingFactory, Lifecycle } from "tsyringe";

import { type AirportLocator, AirportLocatorToken } from "@/interfaces/airportLocator";
import { type DateRateLimiter, DateRateLimiterToken } from "@/interfaces/dateRateLimiter";
import { type DateUsageRepository, DateUsageRepositoryToken } from "@/interfaces/dateUsageRepository";
import { type FantasyLeagueClient, FantasyLeagueClientToken } from "@/interfaces/fantasyLeagueClient";
import { type FlightSearchRepository, FlightSearchRepositoryToken } from "@/interfaces/flightSearchRepository";
import { type FlightQuoteService, FlightQuoteServiceToken } from "@/interfaces/flightQuoteService";
import { type FlightSearchClient, FlightSearchClientToken } from "@/interfaces/flightSearchClient";
import { type PickRepository, PickRepositoryToken } from "@/interfaces/pickRepository";
import { type PickerSuggester, PickerSuggesterToken } from "@/interfaces/pickerSuggester";
import { type TrainRouter, TrainRouterToken } from "@/interfaces/trainRouter";
import { type TransitRepository, TransitRepositoryToken } from "@/interfaces/transitRepository";
import { type TripOddsService, TripOddsServiceToken } from "@/interfaces/tripOddsService";
import { type TripService, TripServiceToken } from "@/interfaces/tripService";
import { CachedFlightQuoteService } from "@/logic/CachedFlightQuoteService";
import { ConnectionScanRouter } from "@/logic/ConnectionScanRouter";
import { EspnFantasyLeagueClient } from "@/logic/EspnFantasyLeagueClient";
import { LeaguePickerSuggester } from "@/logic/LeaguePickerSuggester";
import { MonteCarloTripOddsService } from "@/logic/MonteCarloTripOddsService";
import { PrismaAirportLocator } from "@/logic/PrismaAirportLocator";
import { PrismaDateUsageRepository } from "@/logic/PrismaDateUsageRepository";
import { PrismaFlightSearchRepository } from "@/logic/PrismaFlightSearchRepository";
import { PrismaPickRepository } from "@/logic/PrismaPickRepository";
import { PrismaTransitRepository } from "@/logic/PrismaTransitRepository";
import { SampleFantasyLeagueClient } from "@/logic/SampleFantasyLeagueClient";
import { SerpApiFlightSearchClient } from "@/logic/SerpApiFlightSearchClient";
import { TrainTripService } from "@/logic/TrainTripService";
import { WeeklyDateRateLimiter } from "@/logic/WeeklyDateRateLimiter";

// Singletons: the transit schedule, routing plans and airport list are cached in memory per process.
const singleton = { lifecycle: Lifecycle.Singleton } as const;

container.register<TransitRepository>(TransitRepositoryToken, { useClass: PrismaTransitRepository }, singleton);
container.register<TrainRouter>(TrainRouterToken, { useClass: ConnectionScanRouter }, singleton);
container.register<AirportLocator>(AirportLocatorToken, { useClass: PrismaAirportLocator }, singleton);
container.register<PickRepository>(PickRepositoryToken, { useClass: PrismaPickRepository }, singleton);
container.register<DateUsageRepository>(DateUsageRepositoryToken, { useClass: PrismaDateUsageRepository }, singleton);
container.register<FlightSearchRepository>(FlightSearchRepositoryToken, { useClass: PrismaFlightSearchRepository }, singleton);
container.register<FlightSearchClient>(FlightSearchClientToken, { useClass: SerpApiFlightSearchClient }, singleton);
// The sample league is an explicit opt-in for local previews before ESPN is connected.
container.register<FantasyLeagueClient>(FantasyLeagueClientToken, {
  useFactory: instanceCachingFactory<FantasyLeagueClient>(() =>
    process.env.ESPN_USE_SAMPLE_LEAGUE === "true" ? new SampleFantasyLeagueClient() : new EspnFantasyLeagueClient(),
  ),
});
container.register<DateRateLimiter>(DateRateLimiterToken, { useClass: WeeklyDateRateLimiter }, singleton);
container.register<PickerSuggester>(PickerSuggesterToken, { useClass: LeaguePickerSuggester }, singleton);
container.register<TripService>(TripServiceToken, { useClass: TrainTripService }, singleton);
container.register<TripOddsService>(TripOddsServiceToken, { useClass: MonteCarloTripOddsService }, singleton);
container.register<FlightQuoteService>(FlightQuoteServiceToken, { useClass: CachedFlightQuoteService }, singleton);

export { container };
