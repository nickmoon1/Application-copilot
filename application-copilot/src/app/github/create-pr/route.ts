import { NextResponse } from "next/server";
import { createApplicationPr } from "@/lib/create-application-pr";

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = {
    company: String(formData.get("company") ?? ""),
    role: String(formData.get("role") ?? ""),
    location: String(formData.get("location") ?? ""),
    source: String(formData.get("source") ?? ""),
    jobUrl: String(formData.get("jobUrl") ?? ""),
    matchScore: String(formData.get("matchScore") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const response = await createApplicationPr(new Request(request.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }));
  const data = await response.json().catch(() => ({}));
  const redirectUrl = new URL("/#github-reviews", request.url);

  if (response.status === 409 && data.duplicate === true) {
    redirectUrl.searchParams.set("duplicate", String(data.application?.prNumber ?? "1"));

    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!response.ok || data.ok === false) {
    redirectUrl.searchParams.set("error", data.error ?? "Unable to create pull request");

    return NextResponse.redirect(redirectUrl, 303);
  }

  redirectUrl.searchParams.set("createdPr", String(data.pullRequest?.number ?? ""));

  return NextResponse.redirect(redirectUrl, 303);
}
