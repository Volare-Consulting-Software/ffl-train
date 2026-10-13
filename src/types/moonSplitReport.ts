import type { MoonSplit } from "@/types/moonSplit";
import type { MoonSunday } from "@/types/moonSunday";
import type { MoonWeek } from "@/types/moonWeek";

/** The moon team's results split into crescent-moon Sundays and every other Sunday, plus the Sundays still to play. */
export interface MoonSplitReport {
  ownerName: string;
  crescent: MoonSplit;
  other: MoonSplit;
  weeks: MoonWeek[];
  upcoming: MoonSunday[];
}
