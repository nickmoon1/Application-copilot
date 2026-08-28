import { redirect } from "next/navigation";
import { restorePassedDiscoveredJob } from "@/lib/passed-discovered-jobs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const jobId = String(formData.get("jobId") ?? "").trim();

  if (jobId) {
    await restorePassedDiscoveredJob(jobId);
  }

  redirect("/#discovered-jobs");
}
