export type GitHubConfig = {
  appId: string | undefined;
  installationId: string | undefined;
  owner: string;
  repo: string;
};

export function getGitHubConfig(): GitHubConfig {
  return {
    appId: process.env.GITHUB_APP_ID,
    installationId: process.env.GITHUB_INSTALLATION_ID,
    owner: process.env.GITHUB_APPLICATION_OWNER ?? "nickmoon1",
    repo: process.env.GITHUB_APPLICATION_REPO ?? "Applications",
  };
}
