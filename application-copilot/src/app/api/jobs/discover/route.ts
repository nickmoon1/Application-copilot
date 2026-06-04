import { NextResponse } from "next/server";
import { discoverJobs } from "@/lib/job-discovery";

export async function GET() {
  return NextResponse.json(await discoverJobs());
}
