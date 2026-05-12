"use client";

import { useMemo, useState } from "react";

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

function statusClass(status: string) {
  if (status === "Ready") return "ready";
  if (status === "Needs Edit") return "warn";
  if (status === "PR Review") return "pr";
  return "";
}

export default function Home() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [createPrError, setCreatePrError] = useState<string | null>(null);
  const selectedJob = useMemo(() => jobs[selectedIndex], [selectedIndex]);
  const isReady = selectedJob.status === "Ready";

  async function createSamplePr() {
    setIsCreatingPr(true);
    setCreatePrError(null);
    setPrUrl(null);

    try {
      const response = await fetch("/api/github/create-pr", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to create pull request");
      }

      setPrUrl(data.pullRequest.url);
    } catch (error) {
      setCreatePrError(error instanceof Error ? error.message : "Unable to create pull request");
    } finally {
      setIsCreatingPr(false);
    }
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
            <button className="icon-button" type="button" aria-label="Refresh jobs" title="Refresh jobs">R</button>
            <button className="secondary" disabled={isCreatingPr} onClick={createSamplePr} type="button">
              {isCreatingPr ? "Creating PR" : "Create Sample PR"}
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
                  <p>Submission remains locked until PR approval.</p>
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
