import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getInstallationOctokit, requireGitHubConfig } from "@/lib/github";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: {
      id,
    },
  });

  if (!application) {
    return NextResponse.redirect(new URL("/#github-reviews", request.url), 303);
  }

  if (application.status !== "SUBMITTED" && application.status !== "INVALID_JOB" && application.status !== "NOT_APPLYING") {
    const status = await fetchPullStatus(application.prNumber);

    await prisma.application.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }

  return NextResponse.redirect(new URL(`/?application=${id}#application-detail`, request.url), 303);
}

async function fetchPullStatus(pullNumber: number) {
  const config = requireGitHubConfig();
  const octokit = getInstallationOctokit();
  const { data: pull } = await octokit.rest.pulls.get({
    owner: config.owner,
    repo: config.repo,
    pull_number: pullNumber,
  });
  const { data: reviews } = await octokit.rest.pulls.listReviews({
    owner: config.owner,
    repo: config.repo,
    pull_number: pullNumber,
    per_page: 100,
  });
  const latestReviewByUser = new Map<string, (typeof reviews)[number]>();

  for (const review of reviews) {
    latestReviewByUser.set(review.user?.login ?? String(review.id), review);
  }

  const latestReviews = Array.from(latestReviewByUser.values());

  if (pull.merged) return "MERGED";
  if (pull.state === "closed") return "INVALID_JOB";
  if (latestReviews.some((review) => review.state === "CHANGES_REQUESTED")) return "CHANGES_REQUESTED";
  if (latestReviews.some((review) => review.state === "APPROVED")) return "APPROVED";

  return "PENDING_REVIEW";
}
