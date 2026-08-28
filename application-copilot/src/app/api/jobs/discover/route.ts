import { NextResponse } from "next/server";
import { getDailyDiscovery } from "@/lib/daily-discovery";

export async function GET(request: Request) {
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";

  return NextResponse.json(await getDailyDiscovery(forceRefresh));
}

export async function POST(request: Request) {
  const cronSecret = process.env.DISCOVERY_CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized discovery run" }, { status: 401 });
  }

  return NextResponse.json(await getDailyDiscovery(true));
}
