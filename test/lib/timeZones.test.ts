import { isEasternOrCentral } from "@/lib/timeZones";

describe("isEasternOrCentral", () => {
  it.each(["America/New_York", "America/Chicago", "America/Detroit", "America/Indiana/Indianapolis", "America/Indiana/Knox", "America/Toronto"])(
    "isEasternOrCentral_%s_returnsTrue",
    (zone) => {
      expect(isEasternOrCentral(zone)).toBe(true);
    },
  );

  it.each(["America/Denver", "America/Los_Angeles", "America/Phoenix"])("isEasternOrCentral_%s_returnsFalse", (zone) => {
    expect(isEasternOrCentral(zone)).toBe(false);
  });
});
