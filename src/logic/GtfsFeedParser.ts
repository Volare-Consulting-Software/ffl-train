import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";

import { haversineMiles } from "@/lib/geo";
import type { GtfsFeed } from "@/types/gtfsFeed";
import type { LatLng } from "@/types/latLng";
import type { TransitStopTime } from "@/types/transitStopTime";

const RAIL_ROUTE_TYPE = "2";
const MAX_STOP_TO_SHAPE_MILES = 3;
const WEEKDAY_COLUMNS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

type CsvRow = Record<string, string>;

interface RawStopTime {
  stationCode: string;
  sequence: number;
  arrivalSeconds: number;
  departureSeconds: number;
}

interface ShapeProjection {
  distances: number[];
  shapeIndexes: (number | null)[];
}

/** Converts an Amtrak GTFS zip into rail-only rows ready to load into the database. */
export class GtfsFeedParser {
  parse(zipBuffer: Buffer): GtfsFeed {
    const zip = new AdmZip(zipBuffer);
    const readCsv = (name: string): CsvRow[] => {
      const entry = zip.getEntry(name);
      if (!entry) {
        throw new Error(`GTFS zip is missing ${name}`);
      }
      return parse(entry.getData().toString("utf8"), { columns: true, skip_empty_lines: true, bom: true, trim: true }) as CsvRow[];
    };

    const routes = readCsv("routes.txt")
      .filter((row) => row.route_type === RAIL_ROUTE_TYPE)
      .map((row) => ({ id: row.route_id!, name: row.route_long_name || row.route_short_name || row.route_id! }));
    const routeIds = new Set(routes.map((route) => route.id));

    const trips = readCsv("trips.txt")
      .filter((row) => routeIds.has(row.route_id!))
      .map((row) => ({
        id: row.trip_id!,
        routeId: row.route_id!,
        serviceId: row.service_id!,
        trainNumber: row.trip_short_name ?? "",
        headsign: row.trip_headsign ?? "",
        shapeId: row.shape_id || null,
      }));
    const tripIds = new Set(trips.map((trip) => trip.id));

    const rawStopTimes = new Map<string, RawStopTime[]>();
    for (const row of readCsv("stop_times.txt")) {
      if (!tripIds.has(row.trip_id!)) {
        continue;
      }
      const list = rawStopTimes.get(row.trip_id!) ?? [];
      list.push({
        stationCode: row.stop_id!,
        sequence: Number(row.stop_sequence),
        arrivalSeconds: parseGtfsTime(row.arrival_time || row.departure_time!),
        departureSeconds: parseGtfsTime(row.departure_time || row.arrival_time!),
      });
      rawStopTimes.set(row.trip_id!, list);
    }

    const usedStationCodes = new Set([...rawStopTimes.values()].flat().map((stopTime) => stopTime.stationCode));
    const stations = readCsv("stops.txt")
      .filter((row) => usedStationCodes.has(row.stop_id!))
      .map((row) => ({
        code: row.stop_id!,
        name: row.stop_name!,
        timeZone: row.stop_timezone || "America/New_York",
        latitude: Number(row.stop_lat),
        longitude: Number(row.stop_lon),
      }));
    const stationsByCode = new Map(stations.map((station) => [station.code, station]));

    const usedShapeIds = new Set(trips.map((trip) => trip.shapeId).filter((id): id is string => id !== null));
    const shapePoints = new Map<string, { sequence: number; point: LatLng }[]>();
    for (const row of readCsv("shapes.txt")) {
      if (!usedShapeIds.has(row.shape_id!)) {
        continue;
      }
      const list = shapePoints.get(row.shape_id!) ?? [];
      list.push({ sequence: Number(row.shape_pt_sequence), point: [round5(Number(row.shape_pt_lat)), round5(Number(row.shape_pt_lon))] });
      shapePoints.set(row.shape_id!, list);
    }
    const shapes = [...shapePoints].map(([id, points]) => ({
      id,
      points: points.sort((a, b) => a.sequence - b.sequence).map((entry) => entry.point),
    }));
    const shapesById = new Map(shapes.map((shape) => [shape.id, shape.points]));

    const projectionCache = new Map<string, ShapeProjection>();
    const stopTimes: (TransitStopTime & { tripId: string; sequence: number })[] = [];
    for (const trip of trips) {
      const tripStops = (rawStopTimes.get(trip.id) ?? []).sort((a, b) => a.sequence - b.sequence);
      const coordinates = tripStops.map((stopTime) => {
        const station = stationsByCode.get(stopTime.stationCode)!;
        return [station.latitude, station.longitude] as LatLng;
      });
      const cacheKey = `${trip.shapeId}|${tripStops.map((stopTime) => stopTime.stationCode).join(",")}`;
      let projection = projectionCache.get(cacheKey);
      if (!projection) {
        projection = projectOntoShape(coordinates, trip.shapeId ? shapesById.get(trip.shapeId) : undefined);
        projectionCache.set(cacheKey, projection);
      }
      tripStops.forEach((stopTime, index) => {
        stopTimes.push({
          tripId: trip.id,
          sequence: stopTime.sequence,
          stationCode: stopTime.stationCode,
          arrivalSeconds: stopTime.arrivalSeconds,
          departureSeconds: stopTime.departureSeconds,
          distanceMiles: round2(projection.distances[index]!),
          shapeIndex: projection.shapeIndexes[index]!,
        });
      });
    }

    const serviceIds = new Set(trips.map((trip) => trip.serviceId));
    const calendars = readCsv("calendar.txt")
      .filter((row) => serviceIds.has(row.service_id!))
      .map((row) => ({
        serviceId: row.service_id!,
        weekdays: WEEKDAY_COLUMNS.reduce((mask, column, bit) => (row[column] === "1" ? mask | (1 << bit) : mask), 0),
        startDate: gtfsDateToIso(row.start_date!),
        endDate: gtfsDateToIso(row.end_date!),
      }));

    return { routes, trips, stations, stopTimes, calendars, shapes };
  }
}

/** Parses `HH:MM:SS`, where hours may exceed 23 for trips that run past midnight. */
export function parseGtfsTime(value: string): number {
  const [hours, minutes, seconds] = value.split(":").map(Number);
  return (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
}

function gtfsDateToIso(value: string): string {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

/**
 * Walks the shape forward, snapping each stop to its nearest shape point at or after the previous stop's,
 * and measures distance along the track. Stops too far from the track (or trips without a shape) fall back
 * to straight-line distance between stations.
 */
export function projectOntoShape(stops: LatLng[], shape: LatLng[] | undefined): ShapeProjection {
  const straightLine = (): ShapeProjection => {
    const distances = [0];
    for (let index = 1; index < stops.length; index++) {
      const [latA, lonA] = stops[index - 1]!;
      const [latB, lonB] = stops[index]!;
      distances.push(distances[index - 1]! + haversineMiles(latA, lonA, latB, lonB));
    }
    return { distances, shapeIndexes: stops.map(() => null) };
  };
  if (!shape || shape.length < 2) {
    return straightLine();
  }

  const cumulative = [0];
  for (let index = 1; index < shape.length; index++) {
    const [latA, lonA] = shape[index - 1]!;
    const [latB, lonB] = shape[index]!;
    cumulative.push(cumulative[index - 1]! + haversineMiles(latA, lonA, latB, lonB));
  }

  const shapeIndexes: number[] = [];
  let searchFrom = 0;
  for (const [latitude, longitude] of stops) {
    let bestIndex = searchFrom;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = searchFrom; index < shape.length; index++) {
      const [shapeLat, shapeLon] = shape[index]!;
      const distance = haversineMiles(latitude, longitude, shapeLat, shapeLon);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    if (bestDistance > MAX_STOP_TO_SHAPE_MILES) {
      return straightLine();
    }
    shapeIndexes.push(bestIndex);
    searchFrom = bestIndex;
  }
  return { distances: shapeIndexes.map((index) => cumulative[index]!), shapeIndexes };
}

function round5(value: number): number {
  return Math.round(value * 100_000) / 100_000;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
