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
      status: "INVALID_JOB",
    },
  });

  return NextResponse.redirect(new URL(`/?application=${id}#github-reviews`, request.url), 303);
}
