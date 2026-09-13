import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import SignInButton from "./sign-in-button";
import { authOptions } from "@/lib/auth";
import { hasGitHubAuthConfiguration, isAllowedGitHubId } from "@/lib/authorization";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [session, params] = await Promise.all([getServerSession(authOptions), searchParams]);

  if (session?.user && isAllowedGitHubId(session.user.githubId)) {
    redirect(getSafeCallbackUrl(params?.callbackUrl));
  }

  const configured = hasGitHubAuthConfiguration();
  const accessDenied = params?.error === "AccessDenied";
  const callbackUrl = getSafeCallbackUrl(params?.callbackUrl);

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="mark">AC</div>
        <div>
          <p className="eyebrow">Private workspace</p>
          <h1>Application Copilot</h1>
          <p className="auth-copy">
            Sign in with the approved GitHub account to access application drafts, job discovery, and review controls.
          </p>
        </div>

        {accessDenied && (
          <p className="auth-alert" role="alert">
            This GitHub account is not authorized for this workspace.
          </p>
        )}

        {!configured && (
          <p className="auth-alert" role="alert">
            GitHub authentication is not configured. Add the required authentication variables before signing in.
          </p>
        )}

        <SignInButton callbackUrl={callbackUrl} disabled={!configured} />
        <p className="auth-footnote">Access is limited by immutable GitHub user ID.</p>
      </section>
    </main>
  );
}

function getSafeCallbackUrl(callbackUrl?: string) {
  if (!callbackUrl?.startsWith("/") || callbackUrl.startsWith("//")) return "/";

  return callbackUrl;
}
