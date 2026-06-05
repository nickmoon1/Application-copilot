import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateApplicationPacket } from "@/lib/application-packet";
import { getInstallationOctokit, requireGitHubConfig } from "@/lib/github";

type JobDraftRequest = {
  company?: string;
  role?: string;
  location?: string;
  source?: string;
  jobUrl?: string;
  matchScore?: number | string;
  notes?: string;
};

export async function POST(request: Request) {
  try {
    const config = requireGitHubConfig();
    const octokit = getInstallationOctokit();
    const application = await parseApplicationRequest(request);
    const duplicateApplication = await findDuplicateApplication(application);

    if (duplicateApplication) {
      return NextResponse.json(
        {
          ok: false,
          duplicate: true,
          error: `Application already exists for ${duplicateApplication.company} - ${duplicateApplication.role} as PR #${duplicateApplication.prNumber}.`,
          application: duplicateApplication,
        },
        { status: 409 },
      );
    }

    const companySlug = slugify(application.company);
    const roleSlug = slugify(application.role);
    const slug = `${Date.now()}-${companySlug}-${roleSlug}`;
    const branchName = `application/${slug}`;
    const folder = `applications/${companySlug}/${roleSlug}`;
    const packet = generateApplicationPacket(application);

    const { data: repo } = await octokit.rest.repos.get({
      owner: config.owner,
      repo: config.repo,
    });

    const baseBranch = repo.default_branch;

    const { data: baseRef } = await octokit.rest.git.getRef({
      owner: config.owner,
      repo: config.repo,
      ref: `heads/${baseBranch}`,
    });

    await octokit.rest.git.createRef({
      owner: config.owner,
      repo: config.repo,
      ref: `refs/heads/${branchName}`,
      sha: baseRef.object.sha,
    });

    await createOrUpdateFile({
      octokit,
      owner: config.owner,
      repo: config.repo,
      branch: branchName,
      path: `${folder}/job.json`,
      message: `Add job details for ${application.company}`,
      content: JSON.stringify(application, null, 2),
    });

    await createOrUpdateFile({
      octokit,
      owner: config.owner,
      repo: config.repo,
      branch: branchName,
      path: `${folder}/answers.json`,
      message: `Add draft answers for ${application.company}`,
      content: packet.answers,
    });

    await createOrUpdateFile({
      octokit,
      owner: config.owner,
      repo: config.repo,
      branch: branchName,
      path: `${folder}/cover-letter.md`,
      message: `Add draft cover letter for ${application.company}`,
      content: packet.coverLetter,
    });

    await createOrUpdateFile({
      octokit,
      owner: config.owner,
      repo: config.repo,
      branch: branchName,
      path: `${folder}/tailored-resume.md`,
      message: `Add tailored resume draft for ${application.company}`,
      content: packet.tailoredResume,
    });

    await createOrUpdateFile({
      octokit,
      owner: config.owner,
      repo: config.repo,
      branch: branchName,
      path: `${folder}/answer-style.json`,
      message: "Add answer style profile",
      content: packet.answerStyle,
    });

    await createOrUpdateFile({
      octokit,
      owner: config.owner,
      repo: config.repo,
      branch: branchName,
      path: `${folder}/checklist.md`,
      message: "Add application review checklist",
      content: packet.checklist,
    });

    await createOrUpdateFile({
      octokit,
      owner: config.owner,
      repo: config.repo,
      branch: branchName,
      path: `${folder}/review-notes.md`,
      message: "Add transparent review notes",
      content: packet.reviewNotes,
    });

    const { data: pull } = await octokit.rest.pulls.create({
      owner: config.owner,
      repo: config.repo,
      title: `Application draft: ${application.company} - ${application.role}`,
      head: branchName,
      base: baseBranch,
      body: `## Application Draft

This PR stages a manually entered application packet for review.

### Job

- Company: ${application.company}
- Role: ${application.role}
- Location: ${application.location}
- Source: ${application.source}
- Job URL: ${application.jobUrl || "Not provided"}
- Match score: ${application.matchScore}%

### Approval Gate

Review the files in this PR. The application should remain locked in the app until this PR is approved.
`,
    });

    const storedApplication = await prisma.application.create({
      data: {
        company: application.company,
        role: application.role,
        location: application.location,
        source: application.source,
        jobUrl: application.jobUrl,
        matchScore: application.matchScore,
        notes: application.notes,
        prNumber: pull.number,
        prUrl: pull.html_url,
        branch: branchName,
        folder,
        status: "PENDING_REVIEW",
      },
    });

    return NextResponse.json({
      ok: true,
      repo: `${config.owner}/${config.repo}`,
      branch: branchName,
      application: storedApplication,
      pullRequest: {
        number: pull.number,
        url: pull.html_url,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown create-pr error",
      },
      { status: 500 },
    );
  }
}

async function parseApplicationRequest(request: Request) {
  const body = (await request.json().catch(() => ({}))) as JobDraftRequest;
  const company = requireText(body.company, "company");
  const role = requireText(body.role, "role");
  const location = requireText(body.location, "location");
  const source = body.source?.trim() || "Manual entry";
  const jobUrl = body.jobUrl?.trim() || "";
  const notes = body.notes?.trim() || "";
  const matchScore = normalizeMatchScore(body.matchScore);

  return {
    company,
    role,
    location,
    source,
    jobUrl,
    matchScore,
    notes,
    createdAt: new Date().toISOString(),
  };
}

async function findDuplicateApplication(application: Awaited<ReturnType<typeof parseApplicationRequest>>) {
  const normalizedJobUrl = normalizeUrl(application.jobUrl);

  if (normalizedJobUrl) {
    const applications = await prisma.application.findMany({
      where: {
        jobUrl: {
          not: "",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const duplicateByUrl = applications
      .filter((item) => normalizeUrl(item.jobUrl) === normalizedJobUrl)
      .sort(compareDuplicatePriority)[0];

    if (duplicateByUrl) {
      return duplicateByUrl;
    }
  }

  const applications = await prisma.application.findMany({
    where: {
      company: application.company,
      role: application.role,
    },
  });

  return applications.sort(compareDuplicatePriority)[0] ?? null;
}

function normalizeUrl(value: string) {
  return value.trim().replace(/\/$/, "").toLowerCase();
}

function compareDuplicatePriority(
  left: { status: string; updatedAt: Date; createdAt: Date },
  right: { status: string; updatedAt: Date; createdAt: Date },
) {
  const statusDifference = getDuplicateStatusPriority(right.status) - getDuplicateStatusPriority(left.status);

  if (statusDifference !== 0) {
    return statusDifference;
  }

  return right.createdAt.getTime() - left.createdAt.getTime();
}

function getDuplicateStatusPriority(status: string) {
  if (status === "SUBMITTED") return 5;
  if (status === "MERGED") return 4;
  if (status === "APPROVED" || status === "READY_TO_SUBMIT") return 3;
  if (status === "PENDING_REVIEW" || status === "CHANGES_REQUESTED") return 2;
  if (status === "INVALID_JOB" || status === "NOT_APPLYING") return 1;

  return 0;
}

function requireText(value: string | undefined, field: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`Missing required field: ${field}`);
  }

  return trimmed;
}

function normalizeMatchScore(value: number | string | undefined) {
  const numeric = Number(value ?? 80);

  if (!Number.isFinite(numeric)) {
    return 80;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

type CreateOrUpdateFileInput = {
  octokit: ReturnType<typeof getInstallationOctokit>;
  owner: string;
  repo: string;
  branch: string;
  path: string;
  message: string;
  content: string;
};

async function createOrUpdateFile({
  octokit,
  owner,
  repo,
  branch,
  path,
  message,
  content,
}: CreateOrUpdateFileInput) {
  const existingSha = await getExistingFileSha({
    octokit,
    owner,
    repo,
    branch,
    path,
  });

  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch,
    ...(existingSha ? { sha: existingSha } : {}),
  });
}

async function getExistingFileSha({
  octokit,
  owner,
  repo,
  branch,
  path,
}: Omit<CreateOrUpdateFileInput, "message" | "content">) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if (Array.isArray(data) || data.type !== "file") {
      return undefined;
    }

    return data.sha;
  } catch (error) {
    if (isGitHubNotFound(error)) {
      return undefined;
    }

    throw error;
  }
}

function isGitHubNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && error.status === 404;
}
