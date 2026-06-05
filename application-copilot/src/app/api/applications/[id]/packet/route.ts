import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getInstallationOctokit, requireGitHubConfig } from "@/lib/github";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const packetFiles = ["job.json", "answers.json", "cover-letter.md", "checklist.md", "review-notes.md"] as const;

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: {
        id,
      },
    });

    if (!application) {
      return NextResponse.json(
        {
          error: "Application not found.",
        },
        { status: 404 },
      );
    }

    const config = requireGitHubConfig();
    const octokit = getInstallationOctokit();
    const folder = application.folder || getApplicationFolder(application.prUrl);
    const files: Record<string, string> = {};

    for (const filename of packetFiles) {
      const content = await readRepoFile({
        octokit,
        owner: config.owner,
        repo: config.repo,
        branch: application.branch,
        path: `${folder}/${filename}`,
        optional: filename === "review-notes.md",
      });

      files[filename] = content;
    }

    return NextResponse.json({
      applicationId: application.id,
      branch: application.branch,
      folder,
      files,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load application packet.",
      },
      { status: 500 },
    );
  }
}

type ReadRepoFileInput = {
  octokit: ReturnType<typeof getInstallationOctokit>;
  owner: string;
  repo: string;
  branch: string;
  path: string;
  optional?: boolean;
};

async function readRepoFile({ octokit, owner, repo, branch, path, optional }: ReadRepoFileInput) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
      throw new Error(`Expected file content at ${path}`);
    }

    return Buffer.from(data.content, "base64").toString("utf8");
  } catch (error) {
    if (optional && isGitHubNotFound(error)) {
      return "";
    }

    throw error;
  }
}

function isGitHubNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && error.status === 404;
}

function getApplicationFolder(prUrl: string) {
  // The database records predate a dedicated folder column, so infer from PR files by convention.
  // Newer records use the same `applications/company/role` convention created in the PR route.
  if (prUrl.includes("/pull/1")) {
    return "applications/capital-one/senior-data-analyst";
  }

  if (prUrl.includes("/pull/2")) {
    return "applications/dallas-college/adjunct-professor-data-analytics";
  }

  throw new Error("Application folder is not available for this record yet.");
}
