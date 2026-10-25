-- Preserve imported production history while allowing staging repositories to
-- use their own pull-request number sequence.
ALTER TABLE "Application"
ADD COLUMN "repoOwner" TEXT NOT NULL DEFAULT 'nickmoon1',
ADD COLUMN "repoName" TEXT NOT NULL DEFAULT 'Applications';

DROP INDEX "Application_prNumber_key";

CREATE UNIQUE INDEX "Application_repoOwner_repoName_prNumber_key"
ON "Application"("repoOwner", "repoName", "prNumber");
