"use client";

import { useEffect, useMemo, useState } from "react";

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

type SavedApplication = {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function Home() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [jobDraft, setJobDraft] = useState(initialJobDraft);
  const [savedApplications, setSavedApplications] = useState<SavedApplication[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [applicationPacket, setApplicationPacket] = useState<ApplicationPacket | null>(null);
  const [isLoadingPacket, setIsLoadingPacket] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [trackedPullNumber, setTrackedPullNumber] = useState(1);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [checkingApplicationId, setCheckingApplicationId] = useState<string | null>(null);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [isUpdatingSubmission, setIsUpdatingSubmission] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [createPrError, setCreatePrError] = useState<string | null>(null);
  const selectedJob = useMemo(() => jobs[selectedIndex], [selectedIndex]);
  const selectedApplication = useMemo(
    () =>
      savedApplications.find((application) => application.id === selectedApplicationId) ??
      savedApplications[0] ??
      null,
    [savedApplications, selectedApplicationId],
  );
  const isApproved = approvalStatus === "APPROVED" || approvalStatus === "MERGED";
  const isReady = selectedJob.status === "Ready" || isApproved;
  const selectedApplicationAccepted = selectedApplication ? isAcceptedStatus(selectedApplication.status) : false;
  const selectedApplicationSubmitted = selectedApplication ? isSubmittedStatus(selectedApplication.status) : false;
  const selectedApplicationInactive = selectedApplication ? isTerminalInactiveStatus(selectedApplication.status) : false;

  useEffect(() => {
    void loadApplications();
  }, []);

  useEffect(() => {
    if (!selectedApplication) return;

    void loadApplicationPacket(selectedApplication.id);
  }, [selectedApplication]);

  async function loadApplications() {
    setIsLoadingApplications(true);

    try {
      const response = await fetch("/api/applications");
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
    setCreatePrError(null);
    setPrUrl(null);

    try {
      const response = await fetch("/api/github/create-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobDraft),
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
    } finally {
      setIsCreatingPr(false);
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

  async function checkSavedApplication(application: SavedApplication) {
    if (isSubmittedStatus(application.status) || isTerminalInactiveStatus(application.status)) {
      setSelectedApplicationId(application.id);
      setTrackedPullNumber(application.prNumber);
      setApprovalStatus(application.status);
      return;
    }

    setCheckingApplicationId(application.id);
    setCreatePrError(null);

    try {
      const status = await fetchApprovalStatus(application.prNumber);

      setTrackedPullNumber(application.prNumber);
      setApprovalStatus(status);
      const updatedApplication = await updateApplicationStatus(application.id, status);
      setSavedApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? updatedApplication
            : item,
        ),
      );
      setSelectedApplicationId(application.id);
    } catch (error) {
      setCreatePrError(error instanceof Error ? error.message : "Unable to check pull request status");
    } finally {
      setCheckingApplicationId(null);
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

  async function markSelectedApplicationSubmitted() {
    if (!selectedApplication) return;

    setIsUpdatingSubmission(true);
    setCreatePrError(null);

    try {
      const updatedApplication = await updateApplicationStatus(selectedApplication.id, "SUBMITTED");
      setSavedApplications((current) =>
        current.map((application) =>
          application.id === updatedApplication.id ? updatedApplication : application,
        ),
      );
      setSelectedApplicationId(updatedApplication.id);
    } catch (error) {
      setCreatePrError(error instanceof Error ? error.message : "Unable to mark application submitted");
    } finally {
      setIsUpdatingSubmission(false);
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
          <button className="active" type="button">Queue</button>
          <button type="button">Profile</button>
          <button type="button">Sources</button>
          <button type="button">Reviews</button>
          <button type="button">Settings</button>
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
            <button className="secondary" disabled={isCheckingApproval} onClick={checkApproval} type="button">
              {isCheckingApproval ? "Checking" : `Check PR #${trackedPullNumber}`}
            </button>
            <button className="primary" type="button">Find Jobs</button>
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

        <section className="preferences" aria-label="Search preferences">
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

        <section className="intake-panel" aria-label="Manual job intake">
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

        <section className="applications-panel" aria-label="Recent applications">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Recent Applications</p>
              <h2>GitHub PR Tracker</h2>
            </div>
            <span className="count-label">{isLoadingApplications ? "Loading" : `${savedApplications.length} saved`}</span>
          </div>

          {isLoadingApplications ? (
            <p className="empty-state">Loading saved applications...</p>
          ) : savedApplications.length > 0 ? (
            <div className="applications-table">
              {savedApplications.map((application) => (
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
                    <button className="secondary" onClick={() => setSelectedApplicationId(application.id)} type="button">
                      View
                    </button>
                    <a className="ghost link-button" href={application.prUrl} rel="noreferrer" target="_blank">
                      Open PR
                    </a>
                    <button
                      className="secondary"
                      disabled={
                        checkingApplicationId === application.id ||
                        isSubmittedStatus(application.status) ||
                        isTerminalInactiveStatus(application.status)
                      }
                      onClick={() => checkSavedApplication(application)}
                      type="button"
                    >
                      {isSubmittedStatus(application.status) || isTerminalInactiveStatus(application.status)
                        ? "Closed"
                        : checkingApplicationId === application.id
                          ? "Checking"
                          : "Check Status"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">Create an application PR to start tracking it here.</p>
          )}
        </section>

        {selectedApplication && (
          <section className="application-detail-panel" aria-label="Application detail view">
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
                  disabled={!selectedApplicationAccepted || selectedApplicationInactive || !applicationPacket?.files["answers.json"]}
                  onClick={() => copyPacketText("Answers", applicationPacket?.files["answers.json"])}
                  type="button"
                >
                  Copy Answers
                </button>
                <button
                  className={`primary${selectedApplicationAccepted ? "" : " locked"}`}
                  disabled={!selectedApplicationAccepted || selectedApplicationInactive || selectedApplicationSubmitted || isUpdatingSubmission}
                  onClick={markSelectedApplicationSubmitted}
                  type="button"
                >
                  {selectedApplicationSubmitted ? "Submitted" : isUpdatingSubmission ? "Saving" : "Mark Submitted"}
                </button>
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

        <section className="workspace">
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
              {jobs.map((job, index) => (
                <button
                  className={`job-card${index === selectedIndex ? " selected" : ""}`}
                  key={job.company + job.title}
                  onClick={() => setSelectedIndex(index)}
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
                  <p>{isApproved ? "PR approved. Final review is unlocked." : "Submission remains locked until PR approval."}</p>
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
        </section>
      </main>
    </div>
  );
}
