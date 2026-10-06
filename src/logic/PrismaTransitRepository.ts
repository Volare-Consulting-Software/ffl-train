import { injectable } from "tsyringe";

import type { TransitRepository } from "@/interfaces/transitRepository";
import { getDb } from "@/lib/db";
import { toIsoDate } from "@/lib/dates";
import type { LatLng } from "@/types/latLng";
import type { TransitNetwork } from "@/types/transitNetwork";
import type { TransitTrip } from "@/types/transitTrip";

const AMTRAK_AGENCY_TIME_ZONE = "America/New_York";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/** Loads the Amtrak schedule from Postgres once and serves it from memory. */
@injectable()
export class PrismaTransitRepository implements TransitRepository {
  private network: Promise<TransitNetwork> | null = null;
  private loadedAt = 0;
  private readonly shapes = new Map<string, Promise<LatLng[]>>();

  getNetwork(): Promise<TransitNetwork> {
    if (!this.network || Date.now() - this.loadedAt > CACHE_TTL_MS) {
      this.loadedAt = Date.now();
      this.shapes.clear();
      this.network = this.loadNetwork().catch((err: unknown) => {
        this.network = null;
        throw err;
      });
    }
    return this.network;
  }

  getShape(shapeId: string): Promise<LatLng[]> {
    let shape = this.shapes.get(shapeId);
    if (!shape) {
      shape = getDb()
        .shape.findUnique({ where: { id: shapeId } })
        .then((row) => (row ? (row.points as LatLng[]) : []));
      this.shapes.set(shapeId, shape);
    }
    return shape;
  }

  private async loadNetwork(): Promise<TransitNetwork> {
    const db = getDb();
    const [stations, trips, stopTimes, calendars] = await Promise.all([
      db.station.findMany(),
      db.trip.findMany({ include: { route: true } }),
      db.stopTime.findMany({ orderBy: [{ tripId: "asc" }, { sequence: "asc" }] }),
      db.serviceCalendar.findMany(),
    ]);

    const tripsById = new Map<string, TransitTrip>(
      trips.map((trip) => [
        trip.id,
        {
          id: trip.id,
          routeName: trip.route.name,
          trainNumber: trip.trainNumber,
          serviceId: trip.serviceId,
          shapeId: trip.shapeId,
          stopTimes: [],
        },
      ]),
    );
    for (const stopTime of stopTimes) {
      tripsById.get(stopTime.tripId)?.stopTimes.push({
        stationCode: stopTime.stationCode,
        arrivalSeconds: stopTime.arrivalSeconds,
        departureSeconds: stopTime.departureSeconds,
        distanceMiles: stopTime.distanceMiles,
        shapeIndex: stopTime.shapeIndex,
      });
    }

    return {
      agencyTimeZone: AMTRAK_AGENCY_TIME_ZONE,
      stations: new Map(stations.map((station) => [station.code, station])),
      trips: [...tripsById.values()],
      calendars: new Map(
        calendars.map((calendar) => [
          calendar.serviceId,
          {
            serviceId: calendar.serviceId,
            weekdays: calendar.weekdays,
            startDate: toIsoDate(calendar.startDate),
            endDate: toIsoDate(calendar.endDate),
          },
        ]),
      ),
    };
  }
}
