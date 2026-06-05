import { redirect } from "next/navigation";
import { restoreDiscoveredJob } from "@/lib/invalid-discovered-jobs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const jobId = String(formData.get("jobId") ?? "").trim();

  if (jobId) {
    await restoreDiscoveredJob(jobId);
  }

  redirect("/?discover=1#discovered-jobs");
}
