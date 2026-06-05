import { prisma } from "@/lib/db";
import { getInstallationOctokit, requireGitHubConfig } from "@/lib/github";

export async function syncApplicationStatuses() {
  const applications = await prisma.application.findMany({
    where: {
      status: {
        notIn: ["SUBMITTED", "INVALID_JOB", "NOT_APPLYING"],
      },
    },
  });

  if (applications.length === 0) return;

  const config = requireGitHubConfig();
  const octokit = getInstallationOctokit();

  for (const application of applications) {
    const status = await fetchPullStatus({
      octokit,
      owner: config.owner,
      repo: config.repo,
      pullNumber: application.prNumber,
    });

    if (status !== application.status) {
      await prisma.application.update({
        where: {
          id: application.id,
        },
        data: {
          status,
        },
      });
    }
  }
}

type FetchPullStatusInput = {
  octokit: ReturnType<typeof getInstallationOctokit>;
  owner: string;
  repo: string;
  pullNumber: number;
};

async function fetchPullStatus({ octokit, owner, repo, pullNumber }: FetchPullStatusInput) {
  const { data: pull } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  if (pull.merged) return "MERGED";
  if (pull.state === "closed") return "INVALID_JOB";

  const { data: reviews } = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });
  const latestReviewByUser = new Map<string, (typeof reviews)[number]>();

  for (const review of reviews) {
    latestReviewByUser.set(review.user?.login ?? String(review.id), review);
  }

  const latestReviews = Array.from(latestReviewByUser.values());

  if (latestReviews.some((review) => review.state === "CHANGES_REQUESTED")) return "CHANGES_REQUESTED";
  if (latestReviews.some((review) => review.state === "APPROVED")) return "APPROVED";

  return "PENDING_REVIEW";
}
