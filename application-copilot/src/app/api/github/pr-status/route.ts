import { NextRequest, NextResponse } from "next/server";
import { getInstallationOctokit, requireGitHubConfig } from "@/lib/github";

export async function GET(request: NextRequest) {
  try {
    const config = requireGitHubConfig();
    const octokit = getInstallationOctokit();
    const pullNumber = Number(request.nextUrl.searchParams.get("pull_number"));

    if (!Number.isInteger(pullNumber) || pullNumber <= 0) {
      return NextResponse.json(
        {
          approved: false,
          error: "Missing or invalid pull_number query parameter.",
        },
        { status: 400 },
      );
    }

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
      const userKey = review.user?.login ?? String(review.id);
      latestReviewByUser.set(userKey, review);
    }

    const latestReviews = Array.from(latestReviewByUser.values());
    const hasApprovalReview = latestReviews.some((review) => review.state === "APPROVED");
    const changesRequested = latestReviews.some((review) => review.state === "CHANGES_REQUESTED");
    const approved = hasApprovalReview || pull.merged === true;

    return NextResponse.json({
      approved,
      state: pull.merged
        ? "MERGED"
        : hasApprovalReview
          ? "APPROVED"
          : changesRequested
            ? "CHANGES_REQUESTED"
            : "PENDING_REVIEW",
      pullNumber,
      pullRequestState: pull.state,
      merged: pull.merged,
      targetRepo: `${config.owner}/${config.repo}`,
      reviewCount: reviews.length,
      latestReviews: latestReviews.map((review) => ({
        user: review.user?.login,
        state: review.state,
        submittedAt: review.submitted_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        approved: false,
        error: error instanceof Error ? error.message : "Unknown PR status error",
      },
      { status: 500 },
    );
  }
}
