import { NextResponse } from "next/server";
import { getInstallationOctokit, requireGitHubConfig } from "@/lib/github";

export async function GET() {
  try {
    const config = requireGitHubConfig();
    const octokit = getInstallationOctokit();

    const { data } = await octokit.rest.repos.get({
      owner: config.owner,
      repo: config.repo,
    });

    return NextResponse.json({
      ok: true,
      repo: data.full_name,
      private: data.private,
      defaultBranch: data.default_branch,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown GitHub connection error",
      },
      { status: 500 },
    );
  }
}
