import { prisma } from "@/lib/db";
import { type DiscoveredJobPassReason } from "@/lib/discovered-job-pass-reasons";

export type PassedDiscoveredJob = {
  jobId: string;
  reason: string;
  company: string;
  role: string;
  location: string;
  source: string;
  jobUrl: string;
  summary: string;
  matchScore: number;
  createdAt: string;
  updatedAt: string;
};

type PassDiscoveredJobInput = {
  jobId: string;
  reason: DiscoveredJobPassReason;
  company: string;
  role: string;
  location: string;
  source: string;
  jobUrl: string;
  summary: string;
  matchScore: number;
};

export async function getPassedDiscoveredJobs(): Promise<PassedDiscoveredJob[]> {
  const jobs = await prisma.passedDiscoveredJob.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return jobs.map((job) => ({
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  }));
}

export async function passDiscoveredJob(input: PassDiscoveredJobInput) {
  await prisma.passedDiscoveredJob.upsert({
    where: { jobId: input.jobId },
    create: input,
    update: {
      ...input,
      updatedAt: new Date(),
    },
  });
}

export async function restorePassedDiscoveredJob(jobId: string) {
  await prisma.passedDiscoveredJob.deleteMany({
    where: { jobId },
  });
}
