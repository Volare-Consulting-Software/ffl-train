import { NextResponse, type NextRequest } from "next/server";

import { container } from "@/container";
import { type TripService, TripServiceToken } from "@/interfaces/tripService";
import { departureDateSchema } from "@/lib/requestSchemas";

export async function GET(request: NextRequest) {
  const date = departureDateSchema.safeParse(request.nextUrl.searchParams.get("date"));
  if (!date.success) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }
  const tripService = container.resolve<TripService>(TripServiceToken);
  return NextResponse.json(await tripService.listSummaries(date.data));
}
