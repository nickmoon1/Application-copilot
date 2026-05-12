import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";

export type GitHubConfig = {
  appId: string | undefined;
  installationId: string | undefined;
  privateKey: string | undefined;
  owner: string;
  repo: string;
};

export function getGitHubConfig(): GitHubConfig {
  return {
    appId: process.env.GITHUB_APP_ID,
    installationId: process.env.GITHUB_INSTALLATION_ID,
    privateKey: normalizePrivateKey(process.env.GITHUB_PRIVATE_KEY),
    owner: process.env.GITHUB_APPLICATION_OWNER ?? "nickmoon1",
    repo: process.env.GITHUB_APPLICATION_REPO ?? "Applications",
  };
}

export function requireGitHubConfig() {
  const config = getGitHubConfig();
  const missing = Object.entries({
    GITHUB_APP_ID: config.appId,
    GITHUB_PRIVATE_KEY: config.privateKey,
    GITHUB_INSTALLATION_ID: config.installationId,
    GITHUB_APPLICATION_OWNER: config.owner,
    GITHUB_APPLICATION_REPO: config.repo,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing GitHub config: ${missing.join(", ")}`);
  }

  return {
    appId: config.appId,
    installationId: config.installationId,
    privateKey: config.privateKey,
    owner: config.owner,
    repo: config.repo,
  } as const;
}

export function getInstallationOctokit() {
  const config = requireGitHubConfig();

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: config.appId,
      privateKey: config.privateKey,
      installationId: config.installationId,
    },
  });
}

function normalizePrivateKey(value: string | undefined) {
  if (!value) return undefined;

  const trimmed = value.trim();

  try {
    return JSON.parse(trimmed) as string;
  } catch {
    return trimmed.replace(/\\n/g, "\n");
  }
}
