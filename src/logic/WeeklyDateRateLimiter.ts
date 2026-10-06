import { inject, injectable } from "tsyringe";

import type { DateRateLimiter } from "@/interfaces/dateRateLimiter";
import { type DateUsageRepository, DateUsageRepositoryToken } from "@/interfaces/dateUsageRepository";
import { weekStart } from "@/lib/dates";
import type { RateLimitDecision } from "@/types/rateLimitDecision";

export const NEW_DATES_PER_WEEK = 3;

/**
 * Lets each client spend paid lookups on a few new departure dates per week. Dates anyone has
 * already used are free and don't count against the allowance.
 */
@injectable()
export class WeeklyDateRateLimiter implements DateRateLimiter {
  constructor(@inject(DateUsageRepositoryToken) private readonly dateUsageRepository: DateUsageRepository) {}

  check(clientId: string, departureDate: string): Promise<RateLimitDecision> {
    return this.evaluate(clientId, departureDate, false);
  }

  consume(clientId: string, departureDate: string): Promise<RateLimitDecision> {
    return this.evaluate(clientId, departureDate, true);
  }

  private async evaluate(clientId: string, departureDate: string, record: boolean): Promise<RateLimitDecision> {
    const currentWeek = weekStart(new Date());
    const [used, previouslySelected] = await Promise.all([
      this.dateUsageRepository.countForWeek(clientId, currentWeek),
      this.dateUsageRepository.isPreviouslySelected(departureDate),
    ]);
    if (previouslySelected) {
      return { allowed: true, datesUsedThisWeek: used, limit: NEW_DATES_PER_WEEK };
    }
    if (used >= NEW_DATES_PER_WEEK) {
      return { allowed: false, datesUsedThisWeek: used, limit: NEW_DATES_PER_WEEK };
    }
    if (!record) {
      return { allowed: true, datesUsedThisWeek: used, limit: NEW_DATES_PER_WEEK };
    }
    await this.dateUsageRepository.record(clientId, departureDate, currentWeek);
    return { allowed: true, datesUsedThisWeek: used + 1, limit: NEW_DATES_PER_WEEK };
  }
}
