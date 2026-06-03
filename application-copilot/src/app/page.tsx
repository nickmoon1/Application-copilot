import DashboardClient, { type SavedApplication } from "./dashboard-client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
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

  return <DashboardClient initialApplications={initialApplications} />;
}
