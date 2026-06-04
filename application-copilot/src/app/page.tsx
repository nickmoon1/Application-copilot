import DashboardClient, { type SavedApplication } from "./dashboard-client";
import { prisma } from "@/lib/db";
import { discoverJobs } from "@/lib/job-discovery";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    discover?: string;
  }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const discovery = params?.discover === "1" ? discoverJobs() : null;
  const applications = await prisma.application.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const initialApplications: SavedApplication[] = applications.map((application) => ({
    ...application,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  }));

  return (
    <DashboardClient
      initialApplications={initialApplications}
      initialDiscoveredJobs={discovery?.candidates ?? []}
      initialDiscoveryAt={discovery?.searchedAt ?? null}
    />
  );
}
