import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseLinkedInAlert } from "@/lib/linkedin-alert-parser.mjs";

type LinkedInAlertRequest = {
  receivedAt?: string;
  text?: string;
};

export async function POST(request: Request) {
  const secret = process.env.LINKEDIN_ALERT_INGEST_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized LinkedIn alert import" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as LinkedInAlertRequest | null;
  const text = body?.text?.trim() ?? "";

  if (!text || text.length > 250_000) {
    return NextResponse.json({ error: "A LinkedIn alert body under 250 KB is required" }, { status: 400 });
  }

  const jobs = parseLinkedInAlert(text);

  if (jobs.length === 0) {
    return NextResponse.json({ error: "No LinkedIn job cards were found" }, { status: 422 });
  }

  const receivedAt = normalizeReceivedAt(body?.receivedAt);
  await prisma.$transaction(
    jobs.map((job) => prisma.linkedInAlertJob.upsert({
      where: { linkedinJobId: job.linkedinJobId },
      create: {
        id: `linkedin-${job.linkedinJobId}`,
        linkedinJobId: job.linkedinJobId,
        company: job.company,
        role: job.role,
        location: job.location,
        jobUrl: job.jobUrl,
        postedAt: receivedAt,
      },
      update: {
        company: job.company,
        role: job.role,
        location: job.location,
        jobUrl: job.jobUrl,
        postedAt: receivedAt,
      },
    })),
  );

  return NextResponse.json({
    ok: true,
    imported: jobs.length,
    jobIds: jobs.map((job) => job.linkedinJobId),
  });
}

function normalizeReceivedAt(value?: string) {
  const parsed = value ? new Date(value) : new Date();

  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
