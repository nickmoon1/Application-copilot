CREATE TABLE "LinkedInAlertJob" (
    "id" TEXT NOT NULL,
    "linkedinJobId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "jobUrl" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedInAlertJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LinkedInAlertJob_linkedinJobId_key" ON "LinkedInAlertJob"("linkedinJobId");
CREATE UNIQUE INDEX "LinkedInAlertJob_jobUrl_key" ON "LinkedInAlertJob"("jobUrl");
CREATE INDEX "LinkedInAlertJob_lastSeenAt_idx" ON "LinkedInAlertJob"("lastSeenAt");
