/** How much of the Moon is lit on a calendar date, as reported by the US Naval Observatory. */
export interface MoonPhase {
  date: string;
  illuminationPercent: number;
  phaseName: string;
}
