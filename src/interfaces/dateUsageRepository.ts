/** Records the departure dates clients have spent paid lookups on. */
export interface DateUsageRepository {
  /** True when any client has already spent a lookup on this departure date. */
  isPreviouslySelected(departureDate: string): Promise<boolean>;
  countForWeek(clientId: string, weekStart: string): Promise<number>;
  record(clientId: string, departureDate: string, weekStart: string): Promise<void>;
  /** Every departure date anyone has used, newest first. */
  listSelectedDates(): Promise<string[]>;
}

export const DateUsageRepositoryToken = Symbol.for("DateUsageRepository");
