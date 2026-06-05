"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { type DiscoveredJob } from "@/lib/job-discovery";

const jobs = [
  {
    company: "Capital One",
    title: "Senior Data Analyst",
    location: "Plano, TX",
    comp: "$105k-$145k",
    source: "Company board",
    score: "96%",
    status: "PR Review",
    pr: "PR #42 awaiting approval.",
    answer:
      "Emphasizes SQL, dashboarding, stakeholder analysis, and measurable business recommendations for finance/product teams.",
    risk: "Confirm preferred hybrid schedule and salary range before approval.",
  },
  {
    company: "Toyota Connected",
    title: "Data Scientist",
    location: "Plano, TX",
    comp: "$120k-$165k",
    source: "Lever",
    score: "93%",
    status: "Ready",
    pr: "PR #41 approved and ready.",
    answer:
      "Highlights predictive modeling, Python notebooks, feature engineering, and communicating model tradeoffs to business partners.",
    risk: "Ready for final review.",
  },
  {
    company: "Citi",
    title: "Business Analyst",
    location: "Irving, TX",
    comp: "$95k-$135k",
    source: "Workday",
    score: "90%",
    status: "Needs Edit",
    pr: "PR #40 has requested changes.",
    answer:
      "Maps requirements gathering, KPI definition, process analysis, and data-backed recommendations to operations initiatives.",
    risk: "Needs stronger example for cross-functional stakeholder management.",
  },
  {
    company: "UT Dallas",
    title: "Adjunct Professor - Data Analytics",
    location: "Richardson, TX",
    comp: "Per course",
    source: "University board",
    score: "87%",
    status: "Drafted",
    pr: "Draft branch created; PR not opened.",
    answer:
      "Frames industry data experience as classroom-ready instruction in analytics, SQL, Python, and applied business cases.",
    risk: "Needs teaching philosophy and availability confirmation.",
  },
  {
    company: "Lockheed Martin",
    title: "Data Engineer",
    location: "Arlington, TX",
    comp: "$115k-$155k",
    source: "Company board",
    score: "85%",
    status: "PR Review",
    pr: "PR #39 awaiting approval.",
    answer:
      "Centers ETL pipelines, data quality checks, warehouse design, and reliable reporting infrastructure.",
    risk: "Confirm security clearance requirements before approval.",
  },
];

const metrics = [
  { label: "Found", value: "27" },
  { label: "Drafted", value: "9" },
  { label: "PR Review", value: "4" },
  { label: "Ready", value: "2" },
];

const initialJobDraft = {
  company: "",
  role: "Data Analyst",
  location: "Dallas, TX",
  source: "Manual entry",
  jobUrl: "",
  matchScore: "85",
  notes: "",
};

export type SavedApplication = {
  id: string;
  company: string;
  role: string;
  location: string;
  source: string;
  jobUrl: string;
  matchScore: number;
  notes: string;
  prNumber: number;
  prUrl: string;
  branch: string;
  folder: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ApplicationPacket = {
  applicationId: string;
  branch: string;
  folder: string;
  files: Record<string, string>;
};

function statusClass(status: string) {
  if (status === "Ready") return "ready";
  if (status === "Needs Edit") return "warn";
  if (status === "PR Review") return "pr";
  if (status === "APPROVED" || status === "MERGED" || status === "READY_TO_SUBMIT" || status === "SUBMITTED") return "ready";
  if (status === "INVALID_JOB" || status === "NOT_APPLYING" || status === "CHANGES_REQUESTED") return "warn";
  return "";
}

function isAcceptedStatus(status: string) {
  return status === "APPROVED" || status === "MERGED" || status === "READY_TO_SUBMIT" || status === "SUBMITTED";
}

function isSubmittedStatus(status: string) {
  return status === "SUBMITTED";
}

function isTerminalInactiveStatus(status: string) {
  return status === "INVALID_JOB" || status === "NOT_APPLYING";
}

function getApplicationStatusClass(status: string) {
  if (isAcceptedStatus(status) || isSubmittedStatus(status)) return "ready";
  if (isTerminalInactiveStatus(status) || status === "CHANGES_REQUESTED") return "warn";
  return "pr";
}

function getQueueStatus(status: string) {
  if (status === "APPROVED" || status === "MERGED" || status === "READY_TO_SUBMIT") return "Ready";
  if (status === "SUBMITTED") return "Submitted";
  if (status === "INVALID_JOB" || status === "NOT_APPLYING") return "Closed";
  if (status === "CHANGES_REQUESTED") return "Needs Edit";
  return "PR Review";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

type DashboardClientProps = {
  initialApplications: SavedApplication[];
  initialArchivedDiscoveredJobs: DiscoveredJob[];
  initialDiscoveredJobs: DiscoveredJob[];
  initialDiscoveryAt: string | null;
  initialSelectedApplicationId: string | null;
};

export default function DashboardClient({
  initialApplications,
  initialArchivedDiscoveredJobs,
  initialDiscoveredJobs,
  initialDiscoveryAt,
  initialSelectedApplicationId,
}: DashboardClientProps) {
  const [activeNav, setActiveNav] = useState("Queue");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [jobDraft, setJobDraft] = useState(initialJobDraft);
  const [savedApplications, setSavedApplications] = useState<SavedApplication[]>(initialApplications);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(
    initialApplications.some((application) => application.id === initialSelectedApplicationId)
      ? initialSelectedApplicationId
      : initialApplications.find((application) => !isTerminalInactiveStatus(application.status))?.id ??
        initialApplications[0]?.id ??
        null,
  );
  const [applicationPacket, setApplicationPacket] = useState<ApplicationPacket | null>(null);
  const [isLoadingPacket, setIsLoadingPacket] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [trackedPullNumber, setTrackedPullNumber] = useState(1);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [isUpdatingSubmission, setIsUpdatingSubmission] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [createPrError, setCreatePrError] = useState<string | null>(null);
  const lastDiscoveryAt = initialDiscoveryAt;
  const discoveredJobs = initialDiscoveredJobs;
  const archivedDiscoveredJobs = initialArchivedDiscoveredJobs;
  const activeApplications = useMemo(
    () => savedApplications.filter((application) => !isTerminalInactiveStatus(application.status)),
    [savedApplications],
  );
  const archivedApplications = useMemo(
    () => savedApplications.filter((application) => isTerminalInactiveStatus(application.status)),
    [savedApplications],
  );
  const selectedApplication = useMemo(
    () =>
      savedApplications.find((application) => application.id === selectedApplicationId) ??
      activeApplications[0] ??
      savedApplications[0] ??
      null,
    [activeApplications, savedApplications, selectedApplicationId],
  );
  const queueJobs = useMemo(() => {
    if (activeApplications.length === 0) {
      return jobs.map((job) => ({
        id: `${job.company}-${job.title}`,
        applicationId: null,
        company: job.company,
        title: job.title,
        location: job.location,
        comp: job.comp,
        source: job.source,
        score: job.score,
        status: job.status,
        pr: job.pr,
        answer: job.answer,
        risk: job.risk,
      }));
    }

    return activeApplications.map((application) => {
      const status = getQueueStatus(application.status);

      return {
        id: application.id,
        applicationId: application.id,
        company: application.company,
        title: application.role,
        location: application.location,
        comp: `PR #${application.prNumber}`,
        source: application.source,
        score: `${application.matchScore}%`,
        status,
        pr: `PR #${application.prNumber} is ${application.status}.`,
        answer: application.notes || "Review the generated cover letter and answers in the application detail panel above.",
        risk: isAcceptedStatus(application.status)
          ? "Ready for final manual submission."
          : isTerminalInactiveStatus(application.status)
            ? "This record is closed and retained for audit history."
            : "Use Check Status after approving or merging the GitHub PR.",
      };
    });
  }, [activeApplications]);
  const selectedJob = useMemo(() => queueJobs[selectedIndex] ?? queueJobs[0], [queueJobs, selectedIndex]);
  const isApproved = approvalStatus === "APPROVED" || approvalStatus === "MERGED";
  const isReady = selectedJob?.status === "Ready" || isApproved;
  const selectedApplicationAccepted = selectedApplication ? isAcceptedStatus(selectedApplication.status) : false;
  const selectedApplicationSubmitted = selectedApplication ? isSubmittedStatus(selectedApplication.status) : false;
  const selectedApplicationInactive = selectedApplication ? isTerminalInactiveStatus(selectedApplication.status) : false;

  useEffect(() => {
    if (initialApplications.length === 0) {
      void loadApplications();
    }
  }, [initialApplications.length]);

  useEffect(() => {
    if (!selectedApplication) return;

    void loadApplicationPacket(selectedApplication.id);
  }, [selectedApplication]);

  async function loadApplications() {
    setIsLoadingApplications(true);

    try {
      const response = await fetch("/api/applications?sync=1");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load applications");
      }

      setSavedApplications(data.applications);
      setSelectedApplicationId((current) => current ?? data.applications[0]?.id ?? null);
    } catch (error) {
      setCreatePrError(error instanceof Error ? error.message : "Unable to load applications");
    } finally {
      setIsLoadingApplications(false);
    }
  }

  function updateJobDraft(field: keyof typeof initialJobDraft, value: string) {
    setJobDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function createApplicationPr() {
    setIsCreatingPr(true);

    await createApplicationPrFromDraft(jobDraft);

    setIsCreatingPr(false);
  }

  async function createApplicationPrFromDraft(draft: typeof initialJobDraft) {
    setCreatePrError(null);
    setPrUrl(null);

    try {
      const response = await fetch("/api/github/create-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to create pull request");
      }

      setPrUrl(data.pullRequest.url);
      setTrackedPullNumber(data.pullRequest.number);
      setApprovalStatus("PENDING_REVIEW");
      setSavedApplications((current) => [data.application, ...current]);
      setSelectedApplicationId(data.application.id);
    } catch (error) {
      setCreatePrError(error instanceof Error ? error.message : "Unable to create pull request");
    }
  }

  async function checkApproval() {
    setIsCheckingApproval(true);
    setCreatePrError(null);

    try {
      const status = await fetchApprovalStatus(trackedPullNumber);

      setApprovalStatus(status);
    } catch (error) {
      setCreatePrError(error instanceof Error ? error.message : "Unable to check pull request status");
    } finally {
      setIsCheckingApproval(false);
    }
  }

  async function fetchApprovalStatus(pullNumber: number) {
    const response = await fetch(`/api/github/pr-status?pull_number=${pullNumber}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Unable to check pull request status");
    }

    return data.state as string;
  }

  async function updateApplicationStatus(id: string, status: string) {
    const response = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Unable to update application status");
    }

    return data.application as SavedApplication;
  }

  async function loadApplicationPacket(id: string) {
    setIsLoadingPacket(true);
    setApplicationPacket(null);

    try {
      const response = await fetch(`/api/applications/${id}/packet`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load application packet");
      }

      setApplicationPacket(data);
    } catch (error) {
      setCreatePrError(error instanceof Error ? error.message : "Unable to load application packet");
    } finally {
      setIsLoadingPacket(false);
    }
  }

  async function markSelectedApplicationInvalid() {
    if (!selectedApplication) return;

    setIsUpdatingSubmission(true);
    setCreatePrError(null);

    try {
      const updatedApplication = await updateApplicationStatus(selectedApplication.id, "INVALID_JOB");
      setSavedApplications((current) =>
        current.map((application) =>
          application.id === updatedApplication.id ? updatedApplication : application,
        ),
      );
      setSelectedApplicationId(updatedApplication.id);
      setApprovalStatus("INVALID_JOB");
    } catch (error) {
      setCreatePrError(error instanceof Error ? error.message : "Unable to mark application invalid");
    } finally {
      setIsUpdatingSubmission(false);
    }
  }

  async function copyPacketText(label: string, text: string | undefined) {
    if (!text) return;

    await navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    window.setTimeout(() => setCopiedLabel(null), 1600);
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand">
          <div className="mark">AC</div>
          <div>
            <strong>Application Copilot</strong>
            <span>GitHub-gated job search</span>
          </div>
        </div>

        <nav className="nav" aria-label="Primary">
          <a className={activeNav === "Queue" ? "active" : ""} href="#review-queue" onClick={() => setActiveNav("Queue")}>
            Queue
          </a>
          <a className={activeNav === "Profile" ? "active" : ""} href="#search-profile" onClick={() => setActiveNav("Profile")}>
            Profile
          </a>
          <a className={activeNav === "Sources" ? "active" : ""} href="#manual-intake" onClick={() => setActiveNav("Sources")}>
            Sources
          </a>
          <a className={activeNav === "Reviews" ? "active" : ""} href="#github-reviews" onClick={() => setActiveNav("Reviews")}>
            Reviews
          </a>
          <a className={activeNav === "Settings" ? "active" : ""} href="/settings/github" onClick={() => setActiveNav("Settings")}>
            Settings
          </a>
        </nav>

        <section className="connect">
          <span className="status-dot" />
          <div>
            <strong>GitHub planned</strong>
            <span>nickmoon1/Applications</span>
          </div>
        </section>
      </aside>

      <main className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dallas-Fort Worth Search</p>
            <h1>Application Queue</h1>
          </div>
          <div className="actions">
            <button className="icon-button" onClick={loadApplications} type="button" aria-label="Refresh applications" title="Refresh applications">R</button>
            <form action="/github/sync-applications" className="inline-form" method="post">
              <button className="secondary" type="submit">Sync GitHub</button>
            </form>
            <button className="secondary" disabled={isCheckingApproval} onClick={checkApproval} type="button">
              {isCheckingApproval ? "Checking" : `Check PR #${trackedPullNumber}`}
            </button>
            <Link className="primary link-button" href="/?discover=1#discovered-jobs">
              Find Jobs
            </Link>
          </div>
        </header>

        {(prUrl || createPrError) && (
          <section className={`notice ${createPrError ? "error" : ""}`}>
            {prUrl ? (
              <>
                <strong>Pull request created.</strong>
                <a href={prUrl} rel="noreferrer" target="_blank">{prUrl}</a>
              </>
            ) : (
              <>
                <strong>Could not create pull request.</strong>
                <span>{createPrError}</span>
              </>
            )}
          </section>
        )}

        {approvalStatus && (
          <section className={`notice ${isApproved ? "" : "pending"}`}>
            <strong>PR #{trackedPullNumber} status:</strong>
            <span>{approvalStatus}</span>
          </section>
        )}

        <section className="preferences" id="search-profile" aria-label="Search preferences">
          <div>
            <span>Roles</span>
            <strong>Data Scientist, Data Analyst, Data Engineer, Business Analyst, Adjunct Professor</strong>
          </div>
          <div>
            <span>Preferred Area</span>
            <strong>Dallas, Irving, Plano, Richardson, Arlington</strong>
          </div>
        </section>

        <section className="metrics" aria-label="Pipeline metrics">
          {metrics.map((metric) => (
            <article key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </section>

        <section className="discovery-panel" id="discovered-jobs" aria-label="Discovered jobs">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Automated Discovery</p>
              <h2>Found Jobs</h2>
            </div>
            <span className="count-label">
              {initialDiscoveredJobs.length + initialArchivedDiscoveredJobs.length > 0
                  ? `${discoveredJobs.length} active / ${archivedDiscoveredJobs.length} invalid`
                  : "Not run"}
            </span>
          </div>

          {discoveredJobs.length > 0 ? (
            <div className="discovery-list">
              {discoveredJobs.map((candidate) => (
                <article className="discovery-card" key={candidate.id}>
                  <div>
                    <p className="eyebrow">{candidate.company}</p>
                    <h3>{candidate.role}</h3>
                    <div className="job-meta">
                      <span>{candidate.location}</span>
                      <span>{candidate.source}</span>
                      <span>Posted {formatDate(candidate.posted)}</span>
                    </div>
                  </div>
                  <p>{candidate.summary}</p>
                  <p className="validation-note">{candidate.validationDetails}</p>
                  <div className="tag-row">
                    <span className="pill ready">{candidate.matchScore}% match</span>
                    <span className="pill">{candidate.validationStatus}</span>
                    {candidate.keywords.slice(0, 4).map((keyword) => (
                      <span className="pill" key={keyword}>{keyword}</span>
                    ))}
                  </div>
                  <div className="row-actions">
                    <a className="secondary link-button" href={candidate.jobUrl} rel="noreferrer" target="_blank">
                      Open Job
                    </a>
                    <form action="/github/create-pr" className="inline-form" method="post">
                      <input name="company" type="hidden" value={candidate.company} />
                      <input name="role" type="hidden" value={candidate.role} />
                      <input name="location" type="hidden" value={candidate.location} />
                      <input name="source" type="hidden" value={candidate.source} />
                      <input name="jobUrl" type="hidden" value={candidate.jobUrl} />
                      <input name="matchScore" type="hidden" value={candidate.matchScore} />
                      <input name="notes" type="hidden" value={candidate.notes} />
                      <button className="primary" type="submit">
                        Create PR
                      </button>
                    </form>
                    <form action="/jobs/discovered/invalid" className="inline-form" method="post">
                      <input name="jobId" type="hidden" value={candidate.id} />
                      <button
                        className="secondary"
                        title="Move this discovered job to the invalid found jobs folder"
                        type="submit"
                      >
                        Invalid
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state discovery-empty">
              {lastDiscoveryAt ? (
                <>
                  <strong>No active new jobs passed validation.</strong>
                  <span>
                    Already tracked roles are hidden from discovery, and closed or unreachable roles are moved to the invalid folder below.
                  </span>
                </>
              ) : (
                <span>Click Find Jobs to search configured Dallas-area sources and stage strong matches for review.</span>
              )}
            </div>
          )}

          {archivedDiscoveredJobs.length > 0 && (
            <details className="discovery-archive" open={discoveredJobs.length === 0}>
              <summary>
                <span>Invalid Found Jobs</span>
                <strong>{archivedDiscoveredJobs.length}</strong>
              </summary>
              <div className="discovery-list archived-discovery-list">
                {archivedDiscoveredJobs.map((candidate) => (
                  <article className="discovery-card archived-row" key={candidate.id}>
                    <div>
                      <p className="eyebrow">{candidate.company}</p>
                      <h3>{candidate.role}</h3>
                      <div className="job-meta">
                        <span>{candidate.location}</span>
                        <span>{candidate.source}</span>
                        <span>{candidate.validationStatus}</span>
                      </div>
                    </div>
                    <p>{candidate.summary}</p>
                    <p className="validation-note">{candidate.validationDetails}</p>
                    <div className="row-actions">
                      <a className="ghost link-button" href={candidate.jobUrl} rel="noreferrer" target="_blank">
                        Open Job
                      </a>
                      <form action="/jobs/discovered/restore" className="inline-form" method="post">
                        <input name="jobId" type="hidden" value={candidate.id} />
                        <button className="secondary" type="submit">
                          Restore
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          )}

          {lastDiscoveryAt && (
            <p className="sync-note">Last discovery run: {new Date(lastDiscoveryAt).toLocaleString()}</p>
          )}
        </section>

        <section className="intake-panel" id="manual-intake" aria-label="Manual job intake">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Manual Intake</p>
              <h2>Create Application PR</h2>
            </div>
            <button className="primary" disabled={isCreatingPr} onClick={createApplicationPr} type="button">
              {isCreatingPr ? "Creating PR" : "Create Application PR"}
            </button>
          </div>

          <div className="intake-grid">
            <label>
              <span>Company</span>
              <input
                onChange={(event) => updateJobDraft("company", event.target.value)}
                placeholder="Capital One"
                type="text"
                value={jobDraft.company}
              />
            </label>
            <label>
              <span>Role</span>
              <input
                onChange={(event) => updateJobDraft("role", event.target.value)}
                placeholder="Senior Data Analyst"
                type="text"
                value={jobDraft.role}
              />
            </label>
            <label>
              <span>Location</span>
              <input
                onChange={(event) => updateJobDraft("location", event.target.value)}
                placeholder="Plano, TX"
                type="text"
                value={jobDraft.location}
              />
            </label>
            <label>
              <span>Source</span>
              <input
                onChange={(event) => updateJobDraft("source", event.target.value)}
                placeholder="Company board"
                type="text"
                value={jobDraft.source}
              />
            </label>
            <label>
              <span>Match Score</span>
              <input
                max="100"
                min="0"
                onChange={(event) => updateJobDraft("matchScore", event.target.value)}
                type="number"
                value={jobDraft.matchScore}
              />
            </label>
            <label className="wide">
              <span>Job URL</span>
              <input
                onChange={(event) => updateJobDraft("jobUrl", event.target.value)}
                placeholder="https://..."
                type="url"
                value={jobDraft.jobUrl}
              />
            </label>
            <label className="wide">
              <span>Notes</span>
              <textarea
                onChange={(event) => updateJobDraft("notes", event.target.value)}
                placeholder="What should the cover letter or answers emphasize?"
                rows={3}
                value={jobDraft.notes}
              />
            </label>
          </div>
        </section>

        <section className="applications-panel" id="github-reviews" aria-label="Recent applications">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Recent Applications</p>
              <h2>GitHub PR Tracker</h2>
            </div>
            <span className="count-label">
              {isLoadingApplications
                ? "Loading"
                : `${activeApplications.length} active / ${archivedApplications.length} archived`}
            </span>
          </div>

          {isLoadingApplications ? (
            <p className="empty-state">Loading saved applications...</p>
          ) : savedApplications.length > 0 ? (
            <>
              <div className="tracker-group">
                <div className="tracker-heading">
                  <h3>Active Tracker</h3>
                  <span>{activeApplications.length} roles</span>
                </div>
                {activeApplications.length > 0 ? (
                  <div className="applications-table">
                    {activeApplications.map((application) => (
                      <article
                        className={`application-row${application.id === selectedApplication?.id ? " selected" : ""}`}
                        key={application.id}
                      >
                        <div>
                          <p className="eyebrow">PR #{application.prNumber}</p>
                          <h3>{application.company} - {application.role}</h3>
                          <div className="job-meta">
                            <span>{application.location}</span>
                            <span>{application.source}</span>
                            <span>{application.matchScore}% match</span>
                          </div>
                        </div>
                        <span className={`pill ${getApplicationStatusClass(application.status)}`}>
                          {application.status}
                        </span>
                        <div className="row-actions">
                          <Link className="secondary link-button" href={`/?application=${application.id}#application-detail`}>
                            View
                          </Link>
                          <a className="ghost link-button" href={application.prUrl} rel="noreferrer" target="_blank">
                            Open PR
                          </a>
                          {isSubmittedStatus(application.status) || isTerminalInactiveStatus(application.status) ? (
                            <button className="secondary" disabled type="button">Closed</button>
                          ) : (
                            <form action={`/applications/${application.id}/check-status`} className="inline-form" method="post">
                              <button className="secondary" type="submit">
                                Check Status
                              </button>
                            </form>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No active applications yet.</p>
                )}
              </div>

              <details className="tracker-group archive-folder">
                <summary>
                  <span>Archived Invalid Roles</span>
                  <strong>{archivedApplications.length}</strong>
                </summary>
                {archivedApplications.length > 0 ? (
                  <div className="applications-table archived-table">
                    {archivedApplications.map((application) => (
                      <article
                        className={`application-row archived-row${application.id === selectedApplication?.id ? " selected" : ""}`}
                        key={application.id}
                      >
                        <div>
                          <p className="eyebrow">PR #{application.prNumber}</p>
                          <h3>{application.company} - {application.role}</h3>
                          <div className="job-meta">
                            <span>{application.location}</span>
                            <span>{application.source}</span>
                            <span>{application.matchScore}% match</span>
                          </div>
                        </div>
                        <span className={`pill ${getApplicationStatusClass(application.status)}`}>
                          {application.status}
                        </span>
                        <div className="row-actions">
                          <Link className="secondary link-button" href={`/?application=${application.id}#application-detail`}>
                            View
                          </Link>
                          <a className="ghost link-button" href={application.prUrl} rel="noreferrer" target="_blank">
                            Open PR
                          </a>
                          <button className="secondary" disabled type="button">Closed</button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No invalid or closed-out roles archived.</p>
                )}
              </details>
            </>
          ) : (
            <p className="empty-state">Create an application PR to start tracking it here.</p>
          )}
        </section>

        {selectedApplication && (
          <section className="application-detail-panel" id="application-detail" aria-label="Application detail view">
            <div className="detail-top">
              <div>
                <p className="eyebrow">Application Detail</p>
                <h2>{selectedApplication.company} - {selectedApplication.role}</h2>
              </div>
              <span className={`pill ${getApplicationStatusClass(selectedApplication.status)}`}>
                {selectedApplication.status}
              </span>
            </div>

            <div className="meta-grid detail-meta">
              <div>
                <span>Location</span>
                <strong>{selectedApplication.location}</strong>
              </div>
              <div>
                <span>Match</span>
                <strong>{selectedApplication.matchScore}%</strong>
              </div>
              <div>
                <span>PR</span>
                <strong>#{selectedApplication.prNumber}</strong>
              </div>
              <div>
                <span>Source</span>
                <strong>{selectedApplication.source}</strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{formatDate(selectedApplication.createdAt)}</strong>
              </div>
              <div>
                <span>Branch</span>
                <strong>{selectedApplication.branch}</strong>
              </div>
              <div>
                <span>Folder</span>
                <strong>{selectedApplication.folder || applicationPacket?.folder || "Unknown"}</strong>
              </div>
            </div>

            <section className="detail-grid">
              <article className="review-box">
                <div className="review-head">
                  <div>
                    <p className="eyebrow">Draft Preview</p>
                    <h3>Cover Letter</h3>
                  </div>
                  <button
                    className="ghost"
                    disabled={!applicationPacket?.files["cover-letter.md"]}
                    onClick={() => copyPacketText("Cover letter", applicationPacket?.files["cover-letter.md"])}
                    type="button"
                  >
                    {copiedLabel === "Cover letter" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="file-preview">
                  {isLoadingPacket ? "Loading cover letter..." : applicationPacket?.files["cover-letter.md"] ?? "Cover letter not available."}
                </pre>
              </article>

              <article className="review-box">
                <div className="review-head">
                  <div>
                    <p className="eyebrow">Draft Preview</p>
                    <h3>Job Questions</h3>
                  </div>
                  <button
                    className="ghost"
                    disabled={!applicationPacket?.files["answers.json"]}
                    onClick={() => copyPacketText("Answers", applicationPacket?.files["answers.json"])}
                    type="button"
                  >
                    {copiedLabel === "Answers" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="file-preview">
                  {isLoadingPacket ? "Loading answers..." : applicationPacket?.files["answers.json"] ?? "Answers not available."}
                </pre>
              </article>
            </section>

            <section className="detail-grid">
              <article className="review-box">
                <div className="review-head">
                  <div>
                    <p className="eyebrow">Resume Tailoring</p>
                    <h3>Tailored Resume Draft</h3>
                  </div>
                  <button
                    className="ghost"
                    disabled={!applicationPacket?.files["tailored-resume.md"]}
                    onClick={() => copyPacketText("Tailored resume", applicationPacket?.files["tailored-resume.md"])}
                    type="button"
                  >
                    {copiedLabel === "Tailored resume" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="file-preview tall-preview">
                  {isLoadingPacket ? "Loading tailored resume..." : applicationPacket?.files["tailored-resume.md"] || "Tailored resume draft will appear on newly created PRs."}
                </pre>
              </article>

              <article className="review-box">
                <div className="review-head">
                  <div>
                    <p className="eyebrow">Answer Calibration</p>
                    <h3>Answer Style Profile</h3>
                  </div>
                  <button
                    className="ghost"
                    disabled={!applicationPacket?.files["answer-style.json"]}
                    onClick={() => copyPacketText("Answer style", applicationPacket?.files["answer-style.json"])}
                    type="button"
                  >
                    {copiedLabel === "Answer style" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="file-preview tall-preview">
                  {isLoadingPacket ? "Loading answer style..." : applicationPacket?.files["answer-style.json"] || "Answer style profile will appear on newly created PRs."}
                </pre>
              </article>
            </section>

            <section className="detail-grid">
              <article className="review-box">
                <div className="review-head">
                  <div>
                    <p className="eyebrow">Packet File</p>
                    <h3>Checklist</h3>
                  </div>
                </div>
                <pre className="file-preview">
                  {isLoadingPacket ? "Loading checklist..." : applicationPacket?.files["checklist.md"] ?? "Checklist not available."}
                </pre>
              </article>

              <article className="review-box">
                <div className="review-head">
                  <div>
                    <p className="eyebrow">Packet File</p>
                    <h3>Job Snapshot</h3>
                  </div>
                </div>
                <pre className="file-preview">
                  {isLoadingPacket ? "Loading job snapshot..." : applicationPacket?.files["job.json"] ?? "Job snapshot not available."}
                </pre>
              </article>
            </section>

            <section className="detail-grid">
              <article className="review-box wide-review">
                <div className="review-head">
                  <div>
                    <p className="eyebrow">Transparent Review</p>
                    <h3>Generation Notes</h3>
                  </div>
                  <button
                    className="ghost"
                    disabled={!applicationPacket?.files["review-notes.md"]}
                    onClick={() => copyPacketText("Review notes", applicationPacket?.files["review-notes.md"])}
                    type="button"
                  >
                    {copiedLabel === "Review notes" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="file-preview">
                  {isLoadingPacket ? "Loading review notes..." : applicationPacket?.files["review-notes.md"] ?? "Review notes not available."}
                </pre>
              </article>
            </section>

            <section className="checklist">
              <div className={`check-item done`}>
                <span />
                <strong>Application packet created</strong>
              </div>
              <div className={`check-item done`}>
                <span />
                <strong>Pull request opened</strong>
              </div>
              <div className={`check-item ${selectedApplicationAccepted ? "done" : ""}`}>
                <span />
                <strong>PR approved or merged</strong>
              </div>
              <div className={`check-item ${selectedApplicationAccepted ? "done" : ""}`}>
                <span />
                <strong>Final review unlocked</strong>
              </div>
              <div className={`check-item ${selectedApplicationSubmitted ? "done" : ""}`}>
                <span />
                <strong>Application submitted</strong>
              </div>
              <div className={`check-item ${selectedApplicationInactive ? "warned" : ""}`}>
                <span />
                <strong>Not applying</strong>
              </div>
            </section>

            <section className={`submission-assist ${selectedApplicationAccepted ? "" : "locked-assist"}`}>
              <div>
                <p className="eyebrow">Submission Assist</p>
                <h3>
                  {selectedApplicationInactive
                    ? "Application closed"
                    : selectedApplicationAccepted
                      ? "Ready for manual submission"
                      : "Waiting for PR approval"}
                </h3>
                <p>
                  {selectedApplicationInactive
                    ? "This record is retained for audit history, but it is not part of the active submission queue."
                    : selectedApplicationAccepted
                      ? "Open the job page, copy the approved materials, complete the employer form, then mark this application submitted."
                      : "Approve or merge the GitHub PR before using the submission tools."}
                </p>
              </div>
              <div className="row-actions">
                {selectedApplication.jobUrl ? (
                  <a className="secondary link-button" href={selectedApplication.jobUrl} rel="noreferrer" target="_blank">
                    Open Job
                  </a>
                ) : (
                  <button className="secondary" disabled type="button">No Job URL</button>
                )}
                <button
                  className="secondary"
                  disabled={!selectedApplicationAccepted || selectedApplicationInactive || !applicationPacket?.files["cover-letter.md"]}
                  onClick={() => copyPacketText("Cover letter", applicationPacket?.files["cover-letter.md"])}
                  type="button"
                >
                  Copy Letter
                </button>
                <button
                  className="secondary"
                  disabled={!selectedApplicationAccepted || selectedApplicationInactive || !applicationPacket?.files["tailored-resume.md"]}
                  onClick={() => copyPacketText("Tailored resume", applicationPacket?.files["tailored-resume.md"])}
                  type="button"
                >
                  Copy Resume
                </button>
                <button
                  className="secondary"
                  disabled={!selectedApplicationAccepted || selectedApplicationInactive || !applicationPacket?.files["answers.json"]}
                  onClick={() => copyPacketText("Answers", applicationPacket?.files["answers.json"])}
                  type="button"
                >
                  Copy Answers
                </button>
                <form action={`/applications/${selectedApplication.id}/submit`} className="inline-form" method="post">
                  <button
                    className={`primary${selectedApplicationAccepted ? "" : " locked"}`}
                    disabled={!selectedApplicationAccepted || selectedApplicationInactive || selectedApplicationSubmitted || isUpdatingSubmission}
                    type="submit"
                  >
                    {selectedApplicationSubmitted ? "Submitted" : isUpdatingSubmission ? "Saving" : "Mark Submitted"}
                  </button>
                </form>
                <button
                  className="secondary"
                  disabled={selectedApplicationInactive || selectedApplicationSubmitted || isUpdatingSubmission}
                  onClick={markSelectedApplicationInvalid}
                  type="button"
                >
                  {selectedApplicationInactive ? "Invalid" : "Mark Invalid"}
                </button>
              </div>
            </section>

            <footer className="submit-bar">
              <a className="ghost link-button" href={selectedApplication.prUrl} rel="noreferrer" target="_blank">
                Open PR
              </a>
              {selectedApplication.jobUrl ? (
                <a className="secondary link-button" href={selectedApplication.jobUrl} rel="noreferrer" target="_blank">
                  Open Job
                </a>
              ) : (
                <button className="secondary" disabled type="button">No Job URL</button>
              )}
              <button className={`primary${selectedApplicationAccepted ? "" : " locked"}`} type="button">
                {selectedApplicationInactive
                  ? "Not Applying"
                  : selectedApplicationSubmitted
                    ? "Submitted"
                    : selectedApplicationAccepted
                      ? "Ready to Submit"
                      : "Final Locked"}
              </button>
            </footer>
          </section>
        )}

        <section className="workspace" id="review-queue">
          <div className="queue-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Matched Roles</p>
                <h2>Review Queue</h2>
              </div>
              <div className="segmented" role="tablist" aria-label="Queue filter">
                <button className="selected" type="button">All</button>
                <button type="button">PR</button>
                <button type="button">Ready</button>
              </div>
            </div>

            <div className="job-list">
              {queueJobs.map((job, index) => (
                <button
                  className={`job-card${index === selectedIndex ? " selected" : ""}`}
                  key={job.id}
                  onClick={() => {
                    setSelectedIndex(index);
                    if (job.applicationId) {
                      setSelectedApplicationId(job.applicationId);
                    }
                  }}
                  type="button"
                >
                  <div>
                    <p className="eyebrow">{job.company}</p>
                    <h3>{job.title}</h3>
                  </div>
                  <div className="job-meta">
                    <span>{job.location}</span>
                    <span>{job.comp}</span>
                  </div>
                  <div className="tag-row">
                    <span className={`pill ${statusClass(job.status)}`}>{job.status}</span>
                    <span className="pill">{job.score} match</span>
                    <span className="pill">{job.source}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedJob && (
          <section className="detail-panel" aria-live="polite">
            <div className="detail-top">
              <div>
                <p className="eyebrow">{selectedJob.company}</p>
                <h2>{selectedJob.title}</h2>
              </div>
              <span className="score">{selectedJob.score}</span>
            </div>

            <div className="meta-grid">
              <div>
                <span>Location</span>
                <strong>{selectedJob.location}</strong>
              </div>
              <div>
                <span>Comp</span>
                <strong>{selectedJob.comp}</strong>
              </div>
              <div>
                <span>Source</span>
                <strong>{selectedJob.source}</strong>
              </div>
            </div>

            <section className="timeline" aria-label="Application state">
              <div className="step done">
                <span />
                <div>
                  <strong>Job matched</strong>
                  <p>Skills and preferences scored against posting.</p>
                </div>
              </div>
              <div className="step done">
                <span />
                <div>
                  <strong>Application drafted</strong>
                  <p>Resume, cover letter, and required answers prepared.</p>
                </div>
              </div>
              <div className="step current">
                <span />
                <div>
                  <strong>Pull request opened</strong>
                  <p>{selectedJob.pr}</p>
                </div>
              </div>
              <div className="step">
                <span />
                <div>
                  <strong>Final review</strong>
                  <p>{isReady ? "PR approved. Final review is unlocked." : "Submission remains locked until PR approval."}</p>
                </div>
              </div>
            </section>

            <section className="review-box">
              <div className="review-head">
                <div>
                  <p className="eyebrow">Draft Preview</p>
                  <h3>Answer Highlights</h3>
                </div>
                <button className="ghost" type="button">Open PR</button>
              </div>
              <dl>
                <div>
                  <dt>Why this role?</dt>
                  <dd>{selectedJob.answer}</dd>
                </div>
                <div>
                  <dt>Risk check</dt>
                  <dd>{selectedJob.risk}</dd>
                </div>
              </dl>
            </section>

            <footer className="submit-bar">
              <button className="secondary" type="button">Request Changes</button>
              <button className={`primary${isReady ? "" : " locked"}`} type="button">
                {isReady ? "Review Final" : "Submit Locked"}
              </button>
            </footer>
          </section>
          )}
        </section>
      </main>
    </div>
  );
}
