import type { MoonSplitReport } from "@/types/moonSplitReport";

/** What the moon drawer shows after the crescent moon icon is clicked. */
export type MoonPanelState =
  | { status: "loading" }
  | { status: "ready"; report: MoonSplitReport }
  | { status: "error"; message: string };
