import { NextResponse } from "next/server";
import { analyzeJobUrl } from "@/lib/job-url-analysis";

type AnalyzeJobUrlRequest = {
  jobUrl?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AnalyzeJobUrlRequest;
    const analysis = await analyzeJobUrl(body.jobUrl ?? "");

    return NextResponse.json({
      analysis,
      ok: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to analyze job URL.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
