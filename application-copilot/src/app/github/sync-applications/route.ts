import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getInstallationOctokit, requireGitHubConfig } from "@/lib/github";

type JobSnapshot = {
  company?: string;
  role?: string;
  location?: string;
  source?: string;
  jobUrl?: string;
  matchScore?: number;
  notes?: string;
  createdAt?: string;
};

export async function POST(request: Request) {
  const config = requireGitHubConfig();
  const octokit = getInstallationOctokit();

  const { data: pulls } = await octokit.rest.pulls.list({
    owner: config.owner,
    repo: config.repo,
    state: "all",
    per_page: 100,
  });

  let synced = 0;

  for (const pull of pulls) {
    if (!pull.title.startsWith("Application draft:")) continue;

    const { data: files } = await octokit.rest.pulls.listFiles({
      owner: config.owner,
      repo: config.repo,
      pull_number: pull.number,
      per_page: 100,
    });

    const jobFile = files.find((file) => file.filename.endsWith("/job.json"));
    if (!jobFile) continue;

    const ref = pull.merged_at ? pull.base.ref : pull.head.ref;
    const job = await readJobSnapshot(jobFile.filename, ref);
    if (!job.company || !job.role || !job.location) continue;

    const status = await getPullStatus(pull.number, pull.merged_at !== null, pull.state);
    const folder = jobFile.filename.replace(/\/job\.json$/, "");
    const existingApplication = await prisma.application.findUnique({
      where: {
        prNumber: pull.number,
      },
    });
    const nextStatus = existingApplication?.status === "SUBMITTED" ? existingApplication.status : status;

    await prisma.application.upsert({
      where: {
        prNumber: pull.number,
      },
      update: {
        company: job.company,
        role: job.role,
        location: job.location,
        source: job.source ?? "GitHub sync",
        jobUrl: job.jobUrl ?? "",
        matchScore: normalizeMatchScore(job.matchScore),
        notes: job.notes ?? "",
        prUrl: pull.html_url,
        branch: pull.head.ref,
        folder,
        status: nextStatus,
      },
      create: {
        company: job.company,
        role: job.role,
        location: job.location,
        source: job.source ?? "GitHub sync",
        jobUrl: job.jobUrl ?? "",
        matchScore: normalizeMatchScore(job.matchScore),
        notes: job.notes ?? "",
        prNumber: pull.number,
        prUrl: pull.html_url,
        branch: pull.head.ref,
        folder,
        status: nextStatus,
        createdAt: parseDate(job.createdAt ?? pull.created_at),
      },
    });

    synced += 1;
  }

  const redirectUrl = new URL("/#github-reviews", request.url);
  redirectUrl.searchParams.set("synced", String(synced));

  return NextResponse.redirect(redirectUrl, 303);

  async function readJobSnapshot(path: string, ref: string) {
    const { data } = await octokit.rest.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path,
      ref,
    });

    if (Array.isArray(data) || data.type !== "file" || !data.content) {
      return {};
    }

    return JSON.parse(Buffer.from(data.content, "base64").toString("utf8")) as JobSnapshot;
  }

  async function getPullStatus(pullNumber: number, merged: boolean, state: string) {
    if (merged) return "MERGED";
    if (state === "closed") return "INVALID_JOB";

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

    if (latestReviews.some((review) => review.state === "CHANGES_REQUESTED")) {
      return "CHANGES_REQUESTED";
    }

    if (latestReviews.some((review) => review.state === "APPROVED")) {
      return "APPROVED";
    }

    return "PENDING_REVIEW";
  }
}

function normalizeMatchScore(value: number | undefined) {
  if (!Number.isFinite(value)) return 80;

  return Math.max(0, Math.min(100, Math.round(Number(value))));
}

function parseDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}
