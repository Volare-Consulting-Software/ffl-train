import { parse } from "csv-parse/sync";

import type { AirportRow } from "@/types/airportRow";

const INCLUDED_COUNTRIES = new Set(["US", "CA"]);

/** Picks large, scheduled-service US and Canadian airports with an IATA code out of the OurAirports CSV. */
export class OurAirportsParser {
  parse(csv: string): AirportRow[] {
    const rows = parse(csv, { columns: true, skip_empty_lines: true, bom: true }) as Record<string, string>[];
    return rows
      .filter(
        (row) =>
          row.type === "large_airport" &&
          row.scheduled_service === "yes" &&
          INCLUDED_COUNTRIES.has(row.iso_country ?? "") &&
          /^[A-Z]{3}$/.test(row.iata_code ?? ""),
      )
      .map((row) => ({
        code: row.iata_code!,
        name: row.name!,
        municipality: row.municipality ?? "",
        region: (row.iso_region ?? "").replace(/^[A-Z]{2}-/, ""),
        country: row.iso_country!,
        latitude: Number(row.latitude_deg),
        longitude: Number(row.longitude_deg),
      }));
  }
}
