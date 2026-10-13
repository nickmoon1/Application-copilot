export type AppEnvironment = "development" | "production" | "staging";

export function getAppEnvironment(): AppEnvironment {
  const configured = process.env.APP_ENVIRONMENT?.trim().toLowerCase();

  if (configured === "staging") return "staging";
  if (configured === "production") return "production";
  if (configured === "development") return "development";

  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function assertSafeGitHubWriteTarget(repo: string) {
  if (getAppEnvironment() !== "staging") return;

  const productionRepo = process.env.GITHUB_PRODUCTION_REPO?.trim() || "Applications";

  if (repo.trim().toLowerCase() === productionRepo.toLowerCase()) {
    throw new Error(
      `Staging GitHub writes are blocked for the production repository ${productionRepo}. ` +
        "Set GITHUB_APPLICATION_REPO to a staging-only repository.",
    );
  }
}
