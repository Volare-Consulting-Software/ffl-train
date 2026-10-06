/** The dates a service runs. `weekdays` is a bitmask with bit 0 = Monday through bit 6 = Sunday. */
export interface ServiceCalendar {
  serviceId: string;
  weekdays: number;
  startDate: string;
  endDate: string;
}
