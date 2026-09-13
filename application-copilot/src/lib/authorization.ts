const AUTH_CONFIGURATION_KEYS = [
  "AUTH_GITHUB_CLIENT_ID",
  "AUTH_GITHUB_CLIENT_SECRET",
  "AUTH_ALLOWED_GITHUB_ID",
  "NEXTAUTH_SECRET",
] as const;

export function getAllowedGitHubId() {
  return process.env.AUTH_ALLOWED_GITHUB_ID?.trim() ?? "";
}

export function isAllowedGitHubId(githubId: unknown) {
  const allowedGitHubId = getAllowedGitHubId();

  return Boolean(allowedGitHubId) && String(githubId ?? "") === allowedGitHubId;
}

export function hasGitHubAuthConfiguration() {
  return AUTH_CONFIGURATION_KEYS.every((key) => Boolean(process.env[key]?.trim()));
}

export function isAuthorizedDiscoveryCron(request: Request) {
  const cronSecret = process.env.DISCOVERY_CRON_SECRET?.trim();

  return Boolean(cronSecret) && request.headers.get("authorization") === `Bearer ${cronSecret}`;
}
