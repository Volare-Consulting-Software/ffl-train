import { inject, injectable } from "tsyringe";

import { type AirportLocator, AirportLocatorToken } from "@/interfaces/airportLocator";
import { type PickRepository, PickRepositoryToken } from "@/interfaces/pickRepository";
import { type TrainRouter, TrainRouterToken } from "@/interfaces/trainRouter";
import { type TransitRepository, TransitRepositoryToken } from "@/interfaces/transitRepository";
import type { TripService } from "@/interfaces/tripService";
import type { Pick } from "@/types/pick";
import type { TripDetail } from "@/types/tripDetail";
import type { TripSummary } from "@/types/tripSummary";

export const ORIGIN_STATION_CODE = "CLT";

/** Builds the trips table and route details from picks, the train router and the airport list. */
@injectable()
export class TrainTripService implements TripService {
  constructor(
    @inject(PickRepositoryToken) private readonly pickRepository: PickRepository,
    @inject(TrainRouterToken) private readonly trainRouter: TrainRouter,
    @inject(TransitRepositoryToken) private readonly transitRepository: TransitRepository,
    @inject(AirportLocatorToken) private readonly airportLocator: AirportLocator,
  ) {}

  async listSummaries(departureDate: string): Promise<TripSummary[]> {
    const picks = await this.pickRepository.list();
    return Promise.all(picks.map((pick) => this.summarize(pick, departureDate)));
  }

  async getDetail(pickId: number, departureDate: string): Promise<TripDetail | null> {
    const pick = await this.pickRepository.findById(pickId);
    if (!pick) {
      return null;
    }
    const itinerary = await this.trainRouter.findItinerary(ORIGIN_STATION_CODE, pick.stationCode, departureDate);
    if (!itinerary) {
      return null;
    }
    const destination = itinerary.legs[itinerary.legs.length - 1]!.alight.station;
    const airport = await this.airportLocator.findNearest(destination.latitude, destination.longitude);
    return { pick, itinerary, airport };
  }

  private async summarize(pick: Pick, departureDate: string): Promise<TripSummary> {
    const network = await this.transitRepository.getNetwork();
    const destination = network.stations.get(pick.stationCode) ?? null;
    const empty: TripSummary = {
      pick,
      destination,
      totalMiles: null,
      totalMinutes: null,
      arrival: null,
      transfers: null,
      airport: null,
      error: null,
    };
    if (!destination) {
      return { ...empty, error: `Station ${pick.stationCode} is not in the current Amtrak schedule` };
    }
    const [itinerary, airport] = await Promise.all([
      this.trainRouter.findItinerary(ORIGIN_STATION_CODE, pick.stationCode, departureDate),
      this.airportLocator.findNearest(destination.latitude, destination.longitude),
    ]);
    if (!itinerary) {
      return { ...empty, airport, error: "No train route found within 3 days of this date" };
    }
    return {
      ...empty,
      totalMiles: itinerary.totalMiles,
      totalMinutes: itinerary.totalMinutes,
      arrival: itinerary.arrival,
      transfers: itinerary.legs.length - 1,
      airport,
    };
  }
}
