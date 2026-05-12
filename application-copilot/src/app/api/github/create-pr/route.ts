import { NextResponse } from "next/server";
import { getInstallationOctokit, requireGitHubConfig } from "@/lib/github";

const sampleApplication = {
  company: "Capital One",
  role: "Senior Data Analyst",
  location: "Plano, TX",
  source: "Company board",
  matchScore: 96,
};

export async function POST() {
  try {
    const config = requireGitHubConfig();
    const octokit = getInstallationOctokit();
    const slug = `${Date.now()}-capital-one-senior-data-analyst`;
    const branchName = `application/${slug}`;
    const folder = "applications/capital-one/senior-data-analyst";

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
      message: "Add sample job details",
      content: JSON.stringify(sampleApplication, null, 2),
    });

    await createOrUpdateFile({
      octokit,
      owner: config.owner,
      repo: config.repo,
      branch: branchName,
      path: `${folder}/answers.json`,
      message: "Add sample application answers",
      content: JSON.stringify(
        {
          whyThisRole:
            "This role matches my data analytics, SQL, dashboarding, and stakeholder communication experience.",
          location:
            "I am based in Dallas, TX and interested in Dallas-area roles including Plano, Irving, Richardson, and Arlington.",
          workStyle:
            "I can work cross-functionally with business, operations, and technical teams to turn data into clear recommendations.",
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
      message: "Add sample cover letter",
      content: `# Capital One - Senior Data Analyst

Dear Hiring Team,

I am interested in the Senior Data Analyst role because it aligns with my experience in SQL, Python, dashboard development, exploratory analysis, and business-facing data storytelling.

My recent work includes predictive modeling, Tableau dashboards, data cleaning pipelines, and applied analytics projects that translate technical findings into practical recommendations.

Thank you for your consideration.
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
- [ ] Review salary and hybrid-work expectations.
- [ ] Review generated answers.
- [ ] Review cover letter.
- [ ] Approve this pull request before final submission.
`,
    });

    const { data: pull } = await octokit.rest.pulls.create({
      owner: config.owner,
      repo: config.repo,
      title: "Application draft: Capital One - Senior Data Analyst",
      head: branchName,
      base: baseBranch,
      body: `## Application Draft

This PR stages a sample application packet for review.

### Job

- Company: Capital One
- Role: Senior Data Analyst
- Location: Plano, TX
- Match score: 96%

### Approval Gate

Review the files in this PR. The application should remain locked in the app until this PR is approved.
`,
    });

    return NextResponse.json({
      ok: true,
      repo: `${config.owner}/${config.repo}`,
      branch: branchName,
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
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch,
  });
}
