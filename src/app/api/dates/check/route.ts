import { NextResponse, type NextRequest } from "next/server";

import { container } from "@/container";
import { type DateRateLimiter, DateRateLimiterToken } from "@/interfaces/dateRateLimiter";
import { clientIdFrom } from "@/lib/clientId";
import { departureDateSchema } from "@/lib/requestSchemas";

export async function GET(request: NextRequest) {
  const date = departureDateSchema.safeParse(request.nextUrl.searchParams.get("date"));
  if (!date.success) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }
  const rateLimiter = container.resolve<DateRateLimiter>(DateRateLimiterToken);
  return NextResponse.json(await rateLimiter.check(clientIdFrom(request.headers), date.data));
}
