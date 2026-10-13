import { toMoonPhase } from "@/logic/UsnoMoonPhaseClient";

const DATE = "2026-09-13";

describe("toMoonPhase", () => {
  it("toMoonPhase_percentAndPhase_mapsToMoonPhase", () => {
    const phase = toMoonPhase(DATE, { properties: { data: { curphase: "Waxing Crescent", fracillum: "7%" } } });

    expect(phase).toEqual({ date: DATE, illuminationPercent: 7, phaseName: "Waxing Crescent" });
  });

  it("toMoonPhase_missingIllumination_throwsWithApiError", () => {
    expect(() => toMoonPhase(DATE, { error: "Invalid date" })).toThrow(`USNO returned no illumination for ${DATE}: Invalid date`);
  });
});
