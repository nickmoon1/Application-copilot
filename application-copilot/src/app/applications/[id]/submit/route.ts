import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  await prisma.application.update({
    where: {
      id,
    },
    data: {
      status: "SUBMITTED",
    },
  });

  return NextResponse.redirect(new URL("/#github-reviews", request.url), 303);
}
