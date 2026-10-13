import type { Metadata } from "next";
import { getAppEnvironment } from "@/lib/runtime-environment";
import "./globals.css";

const appEnvironment = getAppEnvironment();

export const metadata: Metadata = {
  title: appEnvironment === "staging" ? "Application Copilot Staging" : "Application Copilot",
  description: "GitHub-gated job application workflow for Dallas-area data roles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {appEnvironment === "staging" && (
          <div className="environment-banner" role="status">
            STAGING ENVIRONMENT <span>Test data and staging-only GitHub PRs</span>
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
