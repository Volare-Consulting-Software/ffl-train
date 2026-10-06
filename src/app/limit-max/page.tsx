import Link from "next/link";

import { formatIsoDate } from "@/lib/format";
import { loadSelectedDates } from "@/server/loadDashboard";

export const dynamic = "force-dynamic";

export default async function LimitMax() {
  const selectedDates = await loadSelectedDates();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Weekly date limit reached</h1>
      <p className="text-lg">
        Bobcat says this data costs money. Try again another day, or pick from a previously selected date.
      </p>
      {selectedDates.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {selectedDates.map((date) => (
            <li key={date}>
              <Link className="text-blue-700 underline hover:text-blue-900 dark:text-blue-400" href={`/?date=${date}`}>
                {formatIsoDate(date)}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-500">No dates have been looked up yet.</p>
      )}
    </main>
  );
}
