import { NextResponse } from "next/server";

import { container } from "@/container";
import { type MoonSplitService, MoonSplitServiceToken } from "@/interfaces/moonSplitService";

export async function GET() {
  const moonSplitService = container.resolve<MoonSplitService>(MoonSplitServiceToken);
  try {
    return NextResponse.json(await moonSplitService.getReport(Number(process.env.ESPN_SEASON ?? new Date().getFullYear())));
  } catch (err) {
    console.warn(`Moon split failed: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Moon stats are unavailable right now." }, { status: 502 });
  }
}
