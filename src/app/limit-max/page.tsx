import { CalendarX } from "lucide-react";
import Link from "next/link";

import { formatIsoDate } from "@/lib/format";
import { loadSelectedDates } from "@/server/loadDashboard";

export const dynamic = "force-dynamic";

export default async function LimitMax() {
  const selectedDates = await loadSelectedDates();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-16">
      <CalendarX className="size-8 text-fg" aria-hidden="true" />
      <h1 className="text-3xl font-extrabold tracking-tight text-fg">Weekly date limit reached</h1>
      <p className="text-xl">
        Bobcat says this data costs money. Try again another day, or pick from a previously selected date.
      </p>
      {selectedDates.length > 0 ? (
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
          {selectedDates.map((date) => (
            <li key={date}>
              <Link
                className="flex h-14 items-center px-4 font-medium text-link hover:bg-surface-raised hover:underline dark:underline"
                href={`/?date=${date}`}
              >
                {formatIsoDate(date)}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-fg-secondary">No dates have been looked up yet.</p>
      )}
    </main>
  );
}
