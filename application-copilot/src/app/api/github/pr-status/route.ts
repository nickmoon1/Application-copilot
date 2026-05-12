import { NextRequest, NextResponse } from "next/server";
import { getGitHubConfig } from "@/lib/github";

export async function GET(request: NextRequest) {
  const config = getGitHubConfig();
  const pullNumber = request.nextUrl.searchParams.get("pull_number");

  return NextResponse.json({
    approved: false,
    state: "NOT_CONNECTED",
    pullNumber,
    targetRepo: `${config.owner}/${config.repo}`,
    nextStep: "Wire GitHub App authentication, then fetch PR reviews and check for APPROVED.",
  });
}
