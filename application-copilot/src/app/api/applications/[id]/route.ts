import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
  };

  if (!body.status?.trim()) {
    return NextResponse.json(
      {
        error: "Missing status.",
      },
      { status: 400 },
    );
  }

  const application = await prisma.application.update({
    where: {
      id,
    },
    data: {
      status: body.status,
    },
  });

  return NextResponse.json({
    application,
  });
}
