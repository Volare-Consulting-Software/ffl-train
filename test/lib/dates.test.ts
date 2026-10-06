import { isIsoDate, upcomingFriday, weekStart, zonedTimeToEpoch } from "@/lib/dates";

describe("upcomingFriday", () => {
  it("upcomingFriday_tuesday_returnsThatWeeksFriday", () => {
    expect(upcomingFriday(new Date("2026-10-06T15:00:00Z"))).toBe("2026-10-09");
  });

  it("upcomingFriday_friday_returnsToday", () => {
    expect(upcomingFriday(new Date("2026-10-09T15:00:00Z"))).toBe("2026-10-09");
  });

  it("upcomingFriday_saturday_returnsNextFriday", () => {
    expect(upcomingFriday(new Date("2026-10-10T15:00:00Z"))).toBe("2026-10-16");
  });

  it("upcomingFriday_lateThursdayEasternButFridayUtc_usesEasternDate", () => {
    expect(upcomingFriday(new Date("2026-10-09T02:00:00Z"))).toBe("2026-10-09");
  });
});

describe("weekStart", () => {
  it("weekStart_sunday_returnsPreviousMonday", () => {
    expect(weekStart(new Date("2026-10-11T15:00:00Z"))).toBe("2026-10-05");
  });

  it("weekStart_monday_returnsSameDay", () => {
    expect(weekStart(new Date("2026-10-05T15:00:00Z"))).toBe("2026-10-05");
  });
});

describe("zonedTimeToEpoch", () => {
  it("zonedTimeToEpoch_daylightTime_appliesFourHourOffset", () => {
    expect(new Date(zonedTimeToEpoch("2026-10-09", 8, 0, "America/New_York")).toISOString()).toBe("2026-10-09T12:00:00.000Z");
  });

  it("zonedTimeToEpoch_standardTimeCentral_appliesSixHourOffset", () => {
    expect(new Date(zonedTimeToEpoch("2026-12-04", 0, 0, "America/Chicago")).toISOString()).toBe("2026-12-04T06:00:00.000Z");
  });
});

describe("isIsoDate", () => {
  it("isIsoDate_impossibleDate_returnsFalse", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("10/09/2026")).toBe(false);
    expect(isIsoDate("2026-10-09")).toBe(true);
  });
});
