import { NextResponse } from "next/server";
import { getGitHubConfig } from "@/lib/github";

export async function POST() {
  const config = getGitHubConfig();

  return NextResponse.json({
    ok: false,
    nextStep: "Wire GitHub App authentication, then create a branch, commit application files, and open a PR.",
    targetRepo: `${config.owner}/${config.repo}`,
  });
}
