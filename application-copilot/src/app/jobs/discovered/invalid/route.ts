import { redirect } from "next/navigation";
import { markDiscoveredJobInvalid } from "@/lib/invalid-discovered-jobs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const jobId = String(formData.get("jobId") ?? "").trim();

  if (jobId) {
    await markDiscoveredJobInvalid(jobId);
  }

  redirect("/?discover=1#discovered-jobs");
}
