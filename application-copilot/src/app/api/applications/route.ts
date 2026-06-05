import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncApplicationStatuses } from "@/lib/application-status-sync";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("sync") === "1") {
    await syncApplicationStatuses();
  }

  const applications = await prisma.application.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    applications,
  });
}
