import type { MoonSunday } from "@/types/moonSunday";

/** A completed week for the moon team: that Sunday's Moon and how the matchup went. */
export interface MoonWeek extends MoonSunday {
  pointsFor: number;
  opponentPoints: number;
  result: "W" | "L" | "T";
}
