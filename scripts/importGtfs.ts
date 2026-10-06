import { readFile } from "node:fs/promises";

import { getDb } from "@/lib/db";
import { GtfsFeedParser } from "@/logic/GtfsFeedParser";

const AMTRAK_GTFS_URL = "https://content.amtrak.com/content/gtfs/GTFS.zip";
const BATCH_SIZE = 5000;
const SHAPE_BATCH_SIZE = 25;

/** Usage: npm run gtfs:import [-- path/to/GTFS.zip]. Replaces all Amtrak schedule tables in one transaction. */
async function main(): Promise<void> {
  const localPath = process.argv[2];
  const zip = localPath ? await readFile(localPath) : await download(AMTRAK_GTFS_URL);
  const feed = new GtfsFeedParser().parse(zip);
  process.stdout.write(
    `Parsed ${feed.routes.length} routes, ${feed.trips.length} trips, ${feed.stopTimes.length} stop times, ${feed.stations.length} stations, ${feed.shapes.length} shapes\n`,
  );

  const db = getDb();
  await db.$transaction(
    async (tx) => {
      await tx.stopTime.deleteMany();
      await tx.trip.deleteMany();
      await tx.trainRoute.deleteMany();
      await tx.serviceCalendar.deleteMany();
      await tx.shape.deleteMany();
      await tx.station.deleteMany();

      await tx.station.createMany({ data: feed.stations });
      await tx.trainRoute.createMany({ data: feed.routes });
      await tx.trip.createMany({ data: feed.trips });
      for (let start = 0; start < feed.stopTimes.length; start += BATCH_SIZE) {
        await tx.stopTime.createMany({ data: feed.stopTimes.slice(start, start + BATCH_SIZE) });
      }
      await tx.serviceCalendar.createMany({
        data: feed.calendars.map((calendar) => ({
          serviceId: calendar.serviceId,
          weekdays: calendar.weekdays,
          startDate: new Date(`${calendar.startDate}T00:00:00Z`),
          endDate: new Date(`${calendar.endDate}T00:00:00Z`),
        })),
      });
      for (let start = 0; start < feed.shapes.length; start += SHAPE_BATCH_SIZE) {
        await tx.shape.createMany({ data: feed.shapes.slice(start, start + SHAPE_BATCH_SIZE) });
      }
      await tx.feedImport.create({ data: { source: localPath ?? AMTRAK_GTFS_URL, rowCount: feed.stopTimes.length } });
    },
    { timeout: 10 * 60_000, maxWait: 60_000 },
  );
  process.stdout.write("Amtrak schedule imported.\n");
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Downloading ${url} failed with ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

main()
  .then(() => getDb().$disconnect())
  .catch(async (err: unknown) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    await getDb().$disconnect();
    process.exit(1);
  });
