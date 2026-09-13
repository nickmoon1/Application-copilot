import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      githubId: string;
      githubLogin: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
