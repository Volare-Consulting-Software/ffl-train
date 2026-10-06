import { getDb } from "@/lib/db";
import { OurAirportsParser } from "@/logic/OurAirportsParser";

const OUR_AIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";

/** Usage: npm run airports:import. Replaces the airports table with large US and Canadian airports. */
async function main(): Promise<void> {
  const response = await fetch(OUR_AIRPORTS_URL);
  if (!response.ok) {
    throw new Error(`Downloading ${OUR_AIRPORTS_URL} failed with ${response.status}`);
  }
  const airports = new OurAirportsParser().parse(await response.text());
  const db = getDb();
  await db.$transaction([db.airport.deleteMany(), db.airport.createMany({ data: airports })]);
  process.stdout.write(`Imported ${airports.length} airports.\n`);
}

main()
  .then(() => getDb().$disconnect())
  .catch(async (err: unknown) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    await getDb().$disconnect();
    process.exit(1);
  });
