import { injectable } from "tsyringe";

import type { MoonPhaseClient } from "@/interfaces/moonPhaseClient";
import { LEAGUE_TIME_ZONE, zoneOffsetMinutes } from "@/lib/dates";
import type { MoonPhase } from "@/types/moonPhase";

const USNO_ONE_DAY_URL = "https://aa.usno.navy.mil/api/rstt/oneday";
// Charlotte, NC. Illumination barely changes with location; the coordinates are just required by the API.
const COORDINATES = "35.23,-80.84";
const REQUEST_TIMEOUT_MS = 10_000;

export interface UsnoOneDayResponse {
  error?: string;
  properties?: { data?: { curphase?: string; fracillum?: string } };
}

/** Moon illumination from the US Naval Observatory's free one-day astronomy API. */
@injectable()
export class UsnoMoonPhaseClient implements MoonPhaseClient {
  async lookup(date: string): Promise<MoonPhase> {
    const offsetHours = zoneOffsetMinutes(new Date(`${date}T17:00:00Z`), LEAGUE_TIME_ZONE) / 60;
    const query = new URLSearchParams({ date, coords: COORDINATES, tz: String(offsetHours) });
    const response = await fetch(`${USNO_ONE_DAY_URL}?${query}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) {
      throw new Error(`USNO moon phase request for ${date} failed with ${response.status}`);
    }
    return toMoonPhase(date, (await response.json()) as UsnoOneDayResponse);
  }
}

/** Maps a USNO one-day reply (e.g. `fracillum: "7%"`) to a moon phase. */
export function toMoonPhase(date: string, body: UsnoOneDayResponse): MoonPhase {
  const data = body.properties?.data;
  const percent = /^(\d+(?:\.\d+)?)%$/.exec(data?.fracillum ?? "");
  if (!percent) {
    throw new Error(`USNO returned no illumination for ${date}: ${body.error ?? "missing fracillum"}`);
  }
  return { date, illuminationPercent: Math.round(Number(percent[1])), phaseName: data?.curphase ?? "Unknown" };
}
