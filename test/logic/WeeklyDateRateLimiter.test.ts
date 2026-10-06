import { It, Mock, Times } from "moq.ts";

import type { DateUsageRepository } from "@/interfaces/dateUsageRepository";
import { NEW_DATES_PER_WEEK, WeeklyDateRateLimiter } from "@/logic/WeeklyDateRateLimiter";

const CLIENT = "client-hash";
const NEW_DATE = "2026-11-06";
const NOW = new Date("2026-10-07T15:00:00Z");
const CURRENT_WEEK = "2026-10-05";

function usageRepository(usedThisWeek: number, previouslySelected: boolean) {
  return new Mock<DateUsageRepository>()
    .setup((repository) => repository.countForWeek(CLIENT, CURRENT_WEEK))
    .returnsAsync(usedThisWeek)
    .setup((repository) => repository.isPreviouslySelected(It.IsAny()))
    .returnsAsync(previouslySelected)
    .setup((repository) => repository.record(It.IsAny(), It.IsAny(), It.IsAny()))
    .returnsAsync(undefined);
}

describe("consume", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("consume_underLimitNewDate_recordsAndAllows", async () => {
    const repository = usageRepository(NEW_DATES_PER_WEEK - 1, false);

    const decision = await new WeeklyDateRateLimiter(repository.object()).consume(CLIENT, NEW_DATE);

    expect(decision).toEqual({ allowed: true, datesUsedThisWeek: NEW_DATES_PER_WEEK, limit: NEW_DATES_PER_WEEK });
    repository.verify((instance) => instance.record(CLIENT, NEW_DATE, CURRENT_WEEK), Times.Once());
  });

  it("consume_fourthNewDate_blocksWithoutRecording", async () => {
    const repository = usageRepository(NEW_DATES_PER_WEEK, false);

    const decision = await new WeeklyDateRateLimiter(repository.object()).consume(CLIENT, NEW_DATE);

    expect(decision.allowed).toBe(false);
    repository.verify((instance) => instance.record(It.IsAny(), It.IsAny(), It.IsAny()), Times.Never());
  });

  it("consume_previouslySelectedDateAtLimit_allowsWithoutCounting", async () => {
    const repository = usageRepository(NEW_DATES_PER_WEEK, true);

    const decision = await new WeeklyDateRateLimiter(repository.object()).consume(CLIENT, NEW_DATE);

    expect(decision.allowed).toBe(true);
    repository.verify((instance) => instance.record(It.IsAny(), It.IsAny(), It.IsAny()), Times.Never());
  });
});

describe("check", () => {
  it("check_underLimit_allowsWithoutRecording", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const repository = usageRepository(0, false);

    const decision = await new WeeklyDateRateLimiter(repository.object()).check(CLIENT, NEW_DATE);

    expect(decision.allowed).toBe(true);
    repository.verify((instance) => instance.record(It.IsAny(), It.IsAny(), It.IsAny()), Times.Never());
    vi.useRealTimers();
  });
});

describe("weekly reset", () => {
  it("consume_newWeekAfterHittingLimit_allowsAgain", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T15:00:00Z"));
    const repository = usageRepository(NEW_DATES_PER_WEEK, false)
      .setup((instance) => instance.countForWeek(CLIENT, "2026-10-12"))
      .returnsAsync(0);

    const decision = await new WeeklyDateRateLimiter(repository.object()).consume(CLIENT, NEW_DATE);

    expect(decision).toEqual({ allowed: true, datesUsedThisWeek: 1, limit: NEW_DATES_PER_WEEK });
    vi.useRealTimers();
  });
});
