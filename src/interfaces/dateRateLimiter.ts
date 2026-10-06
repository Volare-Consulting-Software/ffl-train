import type { RateLimitDecision } from "@/types/rateLimitDecision";

/** Caps how many new departure dates a client can spend paid lookups on each week. */
export interface DateRateLimiter {
  /** Whether the client may use the date, without consuming anything. */
  check(clientId: string, departureDate: string): Promise<RateLimitDecision>;
  /** Checks and, when allowed, records the date against the client's weekly allowance. */
  consume(clientId: string, departureDate: string): Promise<RateLimitDecision>;
}

export const DateRateLimiterToken = Symbol.for("DateRateLimiter");
