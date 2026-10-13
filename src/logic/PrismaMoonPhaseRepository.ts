import { injectable } from "tsyringe";

import type { MoonPhaseRepository } from "@/interfaces/moonPhaseRepository";
import { getDb } from "@/lib/db";
import { toIsoDate } from "@/lib/dates";
import type { MoonPhase } from "@/types/moonPhase";

const asDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

/** Moon phases stored in the moon_phases table. */
@injectable()
export class PrismaMoonPhaseRepository implements MoonPhaseRepository {
  async findByDates(dates: string[]): Promise<MoonPhase[]> {
    const rows = await getDb().moonPhase.findMany({ where: { date: { in: dates.map(asDate) } } });
    return rows.map((row) => ({ date: toIsoDate(row.date), illuminationPercent: row.illuminationPercent, phaseName: row.phaseName }));
  }

  async save(phase: MoonPhase): Promise<void> {
    const data = { illuminationPercent: phase.illuminationPercent, phaseName: phase.phaseName, fetchedAt: new Date() };
    await getDb().moonPhase.upsert({
      where: { date: asDate(phase.date) },
      create: { date: asDate(phase.date), ...data },
      update: data,
    });
  }
}
