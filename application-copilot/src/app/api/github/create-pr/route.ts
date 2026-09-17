import { createApplicationPr } from "@/lib/create-application-pr";

export async function POST(request: Request) {
  return createApplicationPr(request);
}
