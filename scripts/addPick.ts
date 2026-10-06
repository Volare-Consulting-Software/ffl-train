import { parseArgs } from "node:util";

import { container } from "@/container";
import { type PickRepository, PickRepositoryToken } from "@/interfaces/pickRepository";
import { type PickerSuggester, PickerSuggesterToken } from "@/interfaces/pickerSuggester";
import { type TrainRouter, TrainRouterToken } from "@/interfaces/trainRouter";
import { type TransitRepository, TransitRepositoryToken } from "@/interfaces/transitRepository";
import { addDays, dateInZone, LEAGUE_TIME_ZONE } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { isEasternOrCentral } from "@/lib/timeZones";
import { ORIGIN_STATION_CODE } from "@/logic/TrainTripService";

const REACHABILITY_DAYS = 7;
const USAGE = `Usage: npm run pick:add -- --station <CODE> [--week <n>] [--season <year>] [--team-id <id> --picker "<name>"] [--name "<display name>"]

  --station   Amtrak station code, e.g. CHI (required)
  --week      Fantasy week the pick is for (defaults to the suggested week from ESPN)
  --season    Season year (defaults to ESPN_SEASON)
  --team-id   ESPN team id of the picker (defaults to the ESPN suggestion; requires --picker)
  --picker    Name of the person picking (defaults to the ESPN suggestion)
  --name      Destination display name (defaults to the station name)`;

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      station: { type: "string" },
      week: { type: "string" },
      season: { type: "string" },
      "team-id": { type: "string" },
      picker: { type: "string" },
      name: { type: "string" },
    },
  });
  if (!values.station) {
    throw new Error(USAGE);
  }
  const stationCode = values.station.toUpperCase();
  const season = Number(values.season ?? process.env.ESPN_SEASON ?? new Date().getFullYear());

  const network = await container.resolve<TransitRepository>(TransitRepositoryToken).getNetwork();
  const station = network.stations.get(stationCode);
  if (!station) {
    throw new Error(`Station code ${stationCode} is not in the imported Amtrak schedule. Run npm run gtfs:import or check the code.`);
  }
  if (!isEasternOrCentral(station.timeZone)) {
    throw new Error(`${station.name} is in ${station.timeZone}; destinations must be in the Eastern or Central time zone.`);
  }
  await assertReachable(stationCode);

  const picker = await resolvePicker(season, values);
  const picks = await container.resolve<PickRepository>(PickRepositoryToken).listForSeason(season);
  if (picks.some((pick) => pick.pickerTeamId === picker.teamId)) {
    throw new Error(`${picker.ownerName} already picked this season.`);
  }
  if (picks.some((pick) => pick.week === picker.week)) {
    throw new Error(`Week ${picker.week} of ${season} already has a pick.`);
  }

  const pick = await container.resolve<PickRepository>(PickRepositoryToken).create({
    season,
    week: picker.week,
    pickerTeamId: picker.teamId,
    pickerName: picker.ownerName,
    stationCode,
    destinationName: values.name ?? station.name.replace(/ Amtrak Station$/i, ""),
  });
  process.stdout.write(`Added week ${pick.week} pick: ${pick.pickerName} → ${pick.destinationName} (${pick.stationCode}).\n`);
}

async function assertReachable(stationCode: string): Promise<void> {
  const router = container.resolve<TrainRouter>(TrainRouterToken);
  const today = dateInZone(new Date(), LEAGUE_TIME_ZONE);
  for (let offset = 0; offset < REACHABILITY_DAYS; offset++) {
    if (await router.findItinerary(ORIGIN_STATION_CODE, stationCode, addDays(today, offset))) {
      return;
    }
  }
  throw new Error(`No train route from ${ORIGIN_STATION_CODE} to ${stationCode} in the next ${REACHABILITY_DAYS} days.`);
}

async function resolvePicker(
  season: number,
  values: { week?: string; "team-id"?: string; picker?: string },
): Promise<{ week: number; teamId: number; ownerName: string }> {
  if (values["team-id"] && values.picker && values.week) {
    return { week: Number(values.week), teamId: Number(values["team-id"]), ownerName: values.picker };
  }
  const suggestion = await container.resolve<PickerSuggester>(PickerSuggesterToken).suggest(season);
  if (!suggestion) {
    throw new Error("ESPN shows no completed week without a pick. Pass --week, --team-id and --picker to add one manually.");
  }
  if (values.week && Number(values.week) !== suggestion.week) {
    throw new Error(`The next open week is ${suggestion.week}, not ${values.week}. Pass --team-id and --picker to override.`);
  }
  return { week: suggestion.week, teamId: suggestion.teamId, ownerName: suggestion.ownerName };
}

main()
  .then(() => getDb().$disconnect())
  .catch(async (err: unknown) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    await getDb().$disconnect();
    process.exit(1);
  });
