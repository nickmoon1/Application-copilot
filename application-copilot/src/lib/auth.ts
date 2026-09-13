import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { isAllowedGitHubId } from "@/lib/authorization";

type GitHubProfile = {
  id?: number | string;
  login?: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_CLIENT_ID ?? "missing-github-client-id",
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET ?? "missing-github-client-secret",
      authorization: {
        params: {
          scope: "read:user",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    async signIn({ profile }) {
      return isAllowedGitHubId((profile as GitHubProfile | undefined)?.id);
    },
    async jwt({ token, profile }) {
      const githubProfile = profile as GitHubProfile | undefined;

      if (githubProfile?.id) {
        token.githubId = String(githubProfile.id);
        token.githubLogin = githubProfile.login ?? "";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.githubId = String(token.githubId ?? "");
        session.user.githubLogin = String(token.githubLogin ?? "");
      }

      return session;
    },
  },
};
