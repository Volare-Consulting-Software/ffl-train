import { inject, injectable } from "tsyringe";

import type { TrainRouter } from "@/interfaces/trainRouter";
import { type TransitRepository, TransitRepositoryToken } from "@/interfaces/transitRepository";
import { addDays, mondayBasedWeekday, zonedTimeToEpoch } from "@/lib/dates";
import type { Itinerary } from "@/types/itinerary";
import type { ItineraryLeg } from "@/types/itineraryLeg";
import type { LatLng } from "@/types/latLng";
import type { Layover } from "@/types/layover";
import type { StopVisit } from "@/types/stopVisit";
import type { TransitNetwork } from "@/types/transitNetwork";
import type { TransitTrip } from "@/types/transitTrip";

const MIN_TRANSFER_MS = 30 * 60_000;
const SEARCH_WINDOW_DAYS = 3;
const MAX_CACHED_PLANS = 20;
const DAY_MS = 86_400_000;

interface TripRun {
  trip: TransitTrip;
  serviceStartMs: number;
}

interface Connection {
  runIndex: number;
  fromIndex: number;
  fromStation: string;
  toStation: string;
  departureMs: number;
  arrivalMs: number;
}

interface JourneyPointer {
  enterConnection: number;
  exitConnection: number;
}

interface TripEntry {
  connection: number;
  legsBefore: number;
}

interface Plan {
  runs: TripRun[];
  connections: Connection[];
  pointers: Map<string, JourneyPointer>;
}

/** Earliest-arrival routing with the Connection Scan Algorithm, cached per origin and date. */
@injectable()
export class ConnectionScanRouter implements TrainRouter {
  private readonly plans = new Map<string, Plan>();

  constructor(@inject(TransitRepositoryToken) private readonly transitRepository: TransitRepository) {}

  async findItinerary(originCode: string, destinationCode: string, departureDate: string): Promise<Itinerary | null> {
    const network = await this.transitRepository.getNetwork();
    if (!network.stations.has(originCode)) {
      throw new Error(`Unknown origin station ${originCode}`);
    }
    if (!network.stations.has(destinationCode)) {
      throw new Error(`Unknown destination station ${destinationCode}`);
    }
    if (originCode === destinationCode) {
      return null;
    }

    const plan = this.getPlan(network, originCode, departureDate);
    const journey: JourneyPointer[] = [];
    let stationCode = destinationCode;
    while (stationCode !== originCode) {
      const pointer = plan.pointers.get(stationCode);
      if (!pointer) {
        return null;
      }
      journey.unshift(pointer);
      stationCode = plan.connections[pointer.enterConnection]!.fromStation;
    }
    return this.buildItinerary(network, plan, journey);
  }

  private getPlan(network: TransitNetwork, originCode: string, departureDate: string): Plan {
    const key = `${originCode}|${departureDate}`;
    let plan = this.plans.get(key);
    if (!plan) {
      if (this.plans.size >= MAX_CACHED_PLANS) {
        this.plans.delete(this.plans.keys().next().value!);
      }
      plan = this.scan(network, originCode, departureDate);
      this.plans.set(key, plan);
    }
    return plan;
  }

  private scan(network: TransitNetwork, originCode: string, departureDate: string): Plan {
    const origin = network.stations.get(originCode)!;
    const startMs = zonedTimeToEpoch(departureDate, 0, 0, origin.timeZone);
    const endMs = startMs + SEARCH_WINDOW_DAYS * DAY_MS;
    const { runs, connections } = this.buildConnections(network, departureDate, startMs, endMs);

    const earliestArrival = new Map<string, number>([[originCode, startMs]]);
    const legsTo = new Map<string, number>([[originCode, 0]]);
    const tripEntry = new Map<number, TripEntry>();
    const pointers = new Map<string, JourneyPointer>();

    connections.forEach((connection, index) => {
      const reachedAt = earliestArrival.get(connection.fromStation);
      const transferBuffer = connection.fromStation === originCode ? 0 : MIN_TRANSFER_MS;
      const canBoardHere = reachedAt !== undefined && reachedAt + transferBuffer <= connection.departureMs;
      const legsBefore = legsTo.get(connection.fromStation) ?? Number.POSITIVE_INFINITY;
      const entry = tripEntry.get(connection.runIndex);
      // Re-board later on the same train when that saves legs, e.g. catch a northbound train at the
      // origin rather than riding south to meet it.
      if (canBoardHere && (!entry || legsBefore < entry.legsBefore)) {
        tripEntry.set(connection.runIndex, { connection: index, legsBefore });
      }
      const boarded = tripEntry.get(connection.runIndex);
      if (!boarded || connection.toStation === originCode) {
        return;
      }
      const bestArrival = earliestArrival.get(connection.toStation) ?? Number.POSITIVE_INFINITY;
      const legs = boarded.legsBefore + 1;
      const fewerLegsSameTime = connection.arrivalMs === bestArrival && legs < (legsTo.get(connection.toStation) ?? Number.POSITIVE_INFINITY);
      if (connection.arrivalMs < bestArrival || fewerLegsSameTime) {
        earliestArrival.set(connection.toStation, connection.arrivalMs);
        legsTo.set(connection.toStation, legs);
        pointers.set(connection.toStation, { enterConnection: boarded.connection, exitConnection: index });
      }
    });

    return { runs, connections, pointers };
  }

  private buildConnections(network: TransitNetwork, departureDate: string, startMs: number, endMs: number) {
    const runs: TripRun[] = [];
    const connections: Connection[] = [];
    // Start a day early so overnight trains that began yesterday but pass the origin today are included.
    for (let dayOffset = -1; dayOffset <= SEARCH_WINDOW_DAYS; dayOffset++) {
      const serviceDate = addDays(departureDate, dayOffset);
      // GTFS times count from "noon minus 12h", which differs from midnight on DST change days.
      const serviceStartMs = zonedTimeToEpoch(serviceDate, 12, 0, network.agencyTimeZone) - DAY_MS / 2;
      for (const trip of network.trips) {
        if (!this.runsOn(network, trip.serviceId, serviceDate)) {
          continue;
        }
        const runIndex = runs.push({ trip, serviceStartMs }) - 1;
        for (let index = 0; index < trip.stopTimes.length - 1; index++) {
          const from = trip.stopTimes[index]!;
          const to = trip.stopTimes[index + 1]!;
          const departureMs = serviceStartMs + from.departureSeconds * 1000;
          if (departureMs < startMs || departureMs > endMs) {
            continue;
          }
          connections.push({
            runIndex,
            fromIndex: index,
            fromStation: from.stationCode,
            toStation: to.stationCode,
            departureMs,
            arrivalMs: serviceStartMs + to.arrivalSeconds * 1000,
          });
        }
      }
    }
    connections.sort((a, b) => a.departureMs - b.departureMs || a.arrivalMs - b.arrivalMs);
    return { runs, connections };
  }

  private runsOn(network: TransitNetwork, serviceId: string, isoDate: string): boolean {
    const calendar = network.calendars.get(serviceId);
    if (!calendar || isoDate < calendar.startDate || isoDate > calendar.endDate) {
      return false;
    }
    return (calendar.weekdays & (1 << mondayBasedWeekday(isoDate))) !== 0;
  }

  private async buildItinerary(network: TransitNetwork, plan: Plan, journey: JourneyPointer[]): Promise<Itinerary> {
    const legs: ItineraryLeg[] = [];
    for (const pointer of journey) {
      const enter = plan.connections[pointer.enterConnection]!;
      const exit = plan.connections[pointer.exitConnection]!;
      legs.push(await this.buildLeg(network, plan.runs[enter.runIndex]!, enter.fromIndex, exit.fromIndex + 1));
    }

    const layovers: Layover[] = [];
    for (let index = 1; index < legs.length; index++) {
      const previous = legs[index - 1]!;
      const next = legs[index]!;
      layovers.push({
        station: next.board.station,
        minutes: Math.round((Date.parse(next.board.departure) - Date.parse(previous.alight.arrival)) / 60_000),
        fromTrain: `${previous.trainName} ${previous.trainNumber}`,
        toTrain: `${next.trainName} ${next.trainNumber}`,
      });
    }

    const departure = legs[0]!.board.departure;
    const arrival = legs[legs.length - 1]!.alight.arrival;
    return {
      legs,
      layovers,
      departure,
      arrival,
      totalMinutes: Math.round((Date.parse(arrival) - Date.parse(departure)) / 60_000),
      totalMiles: Math.round(legs.reduce((sum, leg) => sum + leg.distanceMiles, 0)),
    };
  }

  private async buildLeg(network: TransitNetwork, run: TripRun, boardIndex: number, alightIndex: number): Promise<ItineraryLeg> {
    const visits: StopVisit[] = run.trip.stopTimes.slice(boardIndex, alightIndex + 1).map((stopTime) => ({
      station: network.stations.get(stopTime.stationCode)!,
      arrival: new Date(run.serviceStartMs + stopTime.arrivalSeconds * 1000).toISOString(),
      departure: new Date(run.serviceStartMs + stopTime.departureSeconds * 1000).toISOString(),
    }));
    const boardStop = run.trip.stopTimes[boardIndex]!;
    const alightStop = run.trip.stopTimes[alightIndex]!;

    return {
      trainName: run.trip.routeName,
      trainNumber: run.trip.trainNumber,
      board: visits[0]!,
      alight: visits[visits.length - 1]!,
      intermediateStops: visits.slice(1, -1),
      distanceMiles: alightStop.distanceMiles - boardStop.distanceMiles,
      path: await this.legPath(run.trip, boardStop.shapeIndex, alightStop.shapeIndex, visits),
    };
  }

  private async legPath(trip: TransitTrip, fromShapeIndex: number | null, toShapeIndex: number | null, visits: StopVisit[]): Promise<LatLng[]> {
    const stationPath = visits.map((visit): LatLng => [visit.station.latitude, visit.station.longitude]);
    if (!trip.shapeId || fromShapeIndex === null || toShapeIndex === null || toShapeIndex <= fromShapeIndex) {
      return stationPath;
    }
    const shape = await this.transitRepository.getShape(trip.shapeId);
    const slice = shape.slice(fromShapeIndex, toShapeIndex + 1);
    return slice.length >= 2 ? slice : stationPath;
  }
}
