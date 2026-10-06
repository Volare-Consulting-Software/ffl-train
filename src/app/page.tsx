import { TripDashboard } from "@/components/TripDashboard/TripDashboard";
import { isIsoDate, upcomingFriday } from "@/lib/dates";
import { loadDashboard } from "@/server/loadDashboard";

export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: Promise<{ date?: string | string[] }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const requestedDate = (await searchParams).date;
  const date = typeof requestedDate === "string" && isIsoDate(requestedDate) ? requestedDate : upcomingFriday(new Date());
  const dashboard = await loadDashboard(date);

  return <TripDashboard initialDate={date} initialSummaries={dashboard.summaries} suggestion={dashboard.suggestion} />;
}
