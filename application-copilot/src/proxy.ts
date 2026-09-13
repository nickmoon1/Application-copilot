import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { isAllowedGitHubId, isAuthorizedDiscoveryCron } from "@/lib/authorization";

const PUBLIC_PATHS = ["/sign-in", "/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  if (pathname === "/api/jobs/discover" && request.method === "POST" && isAuthorizedDiscoveryCron(request)) {
    return NextResponse.next();
  }

  const authSecret = process.env.NEXTAUTH_SECRET?.trim();
  const token = authSecret
    ? await getToken({
        req: request,
        secret: authSecret,
      })
    : null;

  if (token && isAllowedGitHubId(token.githubId)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signInUrl = new URL("/sign-in", request.url);
  const canResumeNavigation = request.method === "GET" || request.method === "HEAD";
  signInUrl.searchParams.set("callbackUrl", canResumeNavigation ? `${pathname}${request.nextUrl.search}` : "/");

  return NextResponse.redirect(signInUrl, canResumeNavigation ? 307 : 303);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
