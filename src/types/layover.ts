import type { Station } from "@/types/station";

/** Time spent at a station between arriving on one train and departing on the next. */
export interface Layover {
  station: Station;
  minutes: number;
  fromTrain: string;
  toTrain: string;
}
