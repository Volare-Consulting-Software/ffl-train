import { NextResponse, type NextRequest } from "next/server";

import { container } from "@/container";
import { type TripService, TripServiceToken } from "@/interfaces/tripService";
import { departureDateSchema, pickIdSchema } from "@/lib/requestSchemas";

export async function GET(request: NextRequest, context: RouteContext<"/api/trips/[pickId]">) {
  const pickId = pickIdSchema.safeParse((await context.params).pickId);
  const date = departureDateSchema.safeParse(request.nextUrl.searchParams.get("date"));
  if (!pickId.success || !date.success) {
    return NextResponse.json({ error: "pickId must be a number and date must be YYYY-MM-DD" }, { status: 400 });
  }
  const tripService = container.resolve<TripService>(TripServiceToken);
  const detail = await tripService.getDetail(pickId.data, date.data);
  if (!detail) {
    return NextResponse.json({ error: "No train route found for this pick and date" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
