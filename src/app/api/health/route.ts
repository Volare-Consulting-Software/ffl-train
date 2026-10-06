import { NextResponse } from "next/server";

/** Readiness probe for the AWS Lambda Web Adapter. Touches nothing external so cold starts stay fast. */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
