import { redirect } from "next/navigation";
import { isDiscoveredJobPassReason } from "@/lib/discovered-job-pass-reasons";
import { passDiscoveredJob } from "@/lib/passed-discovered-jobs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const jobId = getFormValue(formData, "jobId");
  const reason = getFormValue(formData, "reason");
  const matchScore = Number.parseInt(getFormValue(formData, "matchScore"), 10);

  if (jobId && isDiscoveredJobPassReason(reason)) {
    await passDiscoveredJob({
      jobId,
      reason,
      company: getFormValue(formData, "company"),
      role: getFormValue(formData, "role"),
      location: getFormValue(formData, "location"),
      source: getFormValue(formData, "source"),
      jobUrl: getFormValue(formData, "jobUrl"),
      summary: getFormValue(formData, "summary"),
      matchScore: Number.isFinite(matchScore) ? matchScore : 0,
    });
  }

  redirect("/#discovered-jobs");
}

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
