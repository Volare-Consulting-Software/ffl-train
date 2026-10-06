import { NextResponse, type NextRequest } from "next/server";

import { container } from "@/container";
import { type FlightQuoteService, FlightQuoteServiceToken } from "@/interfaces/flightQuoteService";
import { clientIdFrom } from "@/lib/clientId";
import { departureDateSchema, pickIdSchema } from "@/lib/requestSchemas";

export async function GET(request: NextRequest) {
  const pickId = pickIdSchema.safeParse(request.nextUrl.searchParams.get("pickId"));
  const date = departureDateSchema.safeParse(request.nextUrl.searchParams.get("date"));
  if (!pickId.success || !date.success) {
    return NextResponse.json({ error: "pickId must be a number and date must be YYYY-MM-DD" }, { status: 400 });
  }
  const flightQuoteService = container.resolve<FlightQuoteService>(FlightQuoteServiceToken);
  const result = await flightQuoteService.quoteForTrip(pickId.data, date.data, clientIdFrom(request.headers));
  switch (result.status) {
    case "ok":
      return NextResponse.json(result.quote);
    case "rate-limited":
      return NextResponse.json({ redirect: "/limit-max" }, { status: 429 });
    case "not-found":
      return NextResponse.json({ error: result.reason }, { status: 404 });
  }
}
