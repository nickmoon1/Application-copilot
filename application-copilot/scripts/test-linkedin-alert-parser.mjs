import assert from "node:assert/strict";
import test from "node:test";
import { parseLinkedInAlert } from "../src/lib/linkedin-alert-parser.mjs";

const sample = `Your job alert for Full-time Data Analyst in United States
Data Analyst
Atmos Energy
Dallas, TX

This company is actively hiring
View job: https://www.linkedin.com/comm/jobs/view/4491385293/?trackingId=secret

---------------------------------------------------------

Business Data Analyst I
SCP Health
Dallas, TX

1 school alum
View job: https://www.linkedin.com/comm/jobs/view/4492286604/?trackingId=secret
`;

test("parses LinkedIn job cards and strips tracking parameters", () => {
  assert.deepEqual(parseLinkedInAlert(sample), [
    {
      linkedinJobId: "4491385293",
      company: "Atmos Energy",
      role: "Data Analyst",
      location: "Dallas, TX",
      jobUrl: "https://www.linkedin.com/jobs/view/4491385293",
    },
    {
      linkedinJobId: "4492286604",
      company: "SCP Health",
      role: "Business Data Analyst I",
      location: "Dallas, TX",
      jobUrl: "https://www.linkedin.com/jobs/view/4492286604",
    },
  ]);
});
