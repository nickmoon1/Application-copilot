import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Application Copilot",
  description: "GitHub-gated job application workflow for Dallas-area data roles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
