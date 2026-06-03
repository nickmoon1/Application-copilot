import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
    const companySlug = slugify(application.company);
    const roleSlug = slugify(application.role);
    const slug = `${Date.now()}-${companySlug}-${roleSlug}`;
    const branchName = `application/${slug}`;
    const folder = `applications/${companySlug}/${roleSlug}`;

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
      content: JSON.stringify(
        {
          whyThisRole:
            `This ${application.role} role matches my data analytics, SQL, Python, dashboarding, and stakeholder communication experience.`,
          location:
            `I am based in Dallas, TX and interested in Dallas-area roles including ${application.location}.`,
          workStyle:
            "I can work cross-functionally with business, operations, and technical teams to turn data into clear recommendations.",
          notesForReview: application.notes || "No extra notes provided.",
        },
        null,
        2,
      ),
    });

    await createOrUpdateFile({
      octokit,
      owner: config.owner,
      repo: config.repo,
      branch: branchName,
      path: `${folder}/cover-letter.md`,
      message: `Add draft cover letter for ${application.company}`,
      content: `# ${application.company} - ${application.role}

Dear Hiring Team,

I am interested in the ${application.role} role because it aligns with my experience in SQL, Python, dashboard development, exploratory analysis, and business-facing data storytelling.

My recent work includes predictive modeling, Tableau dashboards, data cleaning pipelines, and applied analytics projects that translate technical findings into practical recommendations.

${application.notes ? `Additional review notes: ${application.notes}\n\n` : ""}Thank you for your consideration.
`,
    });

    await createOrUpdateFile({
      octokit,
      owner: config.owner,
      repo: config.repo,
      branch: branchName,
      path: `${folder}/checklist.md`,
      message: "Add application review checklist",
      content: `# Review Checklist

- [ ] Confirm role, company, and location.
- [ ] Confirm job URL and source.
- [ ] Review salary and hybrid-work expectations.
- [ ] Review generated answers.
- [ ] Review cover letter.
- [ ] Approve this pull request before final submission.
`,
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
