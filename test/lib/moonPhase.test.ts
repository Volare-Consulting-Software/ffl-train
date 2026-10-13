import { isCrescent } from "@/lib/moonPhase";

describe("isCrescent", () => {
  it.each([
    [0, false],
    [1, true],
    [49, true],
    [50, false],
    [100, false],
  ])("isCrescent_%i percent_returns %s", (percent, expected) => {
    expect(isCrescent(percent)).toBe(expected);
  });
});
