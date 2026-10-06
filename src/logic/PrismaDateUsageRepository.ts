import { injectable } from "tsyringe";

import type { DateUsageRepository } from "@/interfaces/dateUsageRepository";
import { getDb } from "@/lib/db";
import { toIsoDate } from "@/lib/dates";

const asDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

/** Per-client departure date usage stored in the date_usages table. */
@injectable()
export class PrismaDateUsageRepository implements DateUsageRepository {
  async isPreviouslySelected(departureDate: string): Promise<boolean> {
    return (await getDb().dateUsage.count({ where: { departureDate: asDate(departureDate) } })) > 0;
  }

  countForWeek(clientId: string, weekStart: string): Promise<number> {
    return getDb().dateUsage.count({ where: { clientId, weekStart: asDate(weekStart) } });
  }

  async record(clientId: string, departureDate: string, weekStart: string): Promise<void> {
    await getDb().dateUsage.upsert({
      where: { clientId_departureDate: { clientId, departureDate: asDate(departureDate) } },
      create: { clientId, departureDate: asDate(departureDate), weekStart: asDate(weekStart) },
      update: {},
    });
  }

  async listSelectedDates(): Promise<string[]> {
    const rows = await getDb().dateUsage.findMany({
      distinct: ["departureDate"],
      select: { departureDate: true },
      orderBy: { departureDate: "desc" },
    });
    return rows.map((row) => toIsoDate(row.departureDate));
  }
}
