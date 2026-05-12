import { getGitHubConfig } from "@/lib/github";

export default function GitHubSettingsPage() {
  const config = getGitHubConfig();

  return (
    <main className="shell">
      <p className="eyebrow">Settings</p>
      <h1>GitHub Connection</h1>
      <section className="preferences">
        <div>
          <span>Application Repo</span>
          <strong>{config.owner}/{config.repo}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>GitHub App credentials not connected yet</strong>
        </div>
      </section>
    </main>
  );
}
