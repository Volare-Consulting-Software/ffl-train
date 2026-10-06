/** Whether a client may make a paid lookup for a departure date. */
export interface RateLimitDecision {
  allowed: boolean;
  datesUsedThisWeek: number;
  limit: number;
}
