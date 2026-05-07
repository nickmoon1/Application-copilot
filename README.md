# Application-copilot
An MVP blueprint for a job-application assistant that finds relevant roles, drafts applications, opens a GitHub pull request for review, and only submits after explicit human approval.

Core Workflow

Connect profile sources
GitHub OAuth for identity and repository access.
Resume, preferences, location, salary range, work authorization, and target roles.
Optional LinkedIn or portfolio import where permitted by platform terms.

Discover jobs
Pull jobs from compliant sources first: Greenhouse boards, Lever boards, company career pages, RSS/API feeds, and manually supplied URLs.
Score jobs against the user's profile, skills, seniority, location, compensation, and preferences.
Store raw posting data, extracted requirements, source URL, and match explanation.

Draft applications
Generate a tailored resume variant, cover letter, and short-answer responses.
Keep each application as structured files in a GitHub repo:
applications/{company}/{role}/job.json
applications/{company}/{role}/answers.json
applications/{company}/{role}/cover-letter.md
applications/{company}/{role}/resume.md

Open a pull request
A bot branch is created for each drafted application.
The pull request includes the job details, drafted answers, risks, and a submission checklist.
Required approval prevents accidental submission.

Human review and submit
The app shows the PR approval state.
After approval, the user reviews the final rendered application.
The user clicks Submit manually, or the system performs a controlled browser-assisted submission only where permitted.

MVP Scope
Local profile builder.
Job discovery from Greenhouse, Lever, Workday, company boards, and university career pages where access is permitted.
Match scoring and queue management.
Draft generation placeholders that can later connect to an LLM provider.
GitHub App integration that creates one PR per application.
Review dashboard with states: Found, Drafted, PR Opened, Approved, Ready to Submit, Submitted.

Initial Preferences
Target roles:
Data Scientist
Data Analyst
Data Engineer
Business Analyst
Adjunct Professor

Preferred location:
Dallas, TX
Irving, TX
Plano, TX
Richardson, TX
Arlington, TX

Architecture
User
Web App
Backend API
Job Source Connectors
Match Scorer
Draft Generator
GitHub App
Applications Repository
Pull Request Review
Human-Gated Submitter

Important Boundaries
The app should not bypass CAPTCHA, rate limits, authentication, or employer anti-bot controls.
The user should approve every final application before submission.
Some job boards prohibit automated form submission. The safer MVP is to automate preparation and hand off the final send action to the user.
Keep a full audit trail of generated answers and user edits.

Tech Stack
Frontend: Next.js.
Backend:  Python with FastAPI.
Queue: Postgres plus a worker queue such as BullMQ, pg-boss, or Celery.
Browser assistance: Playwright only for user-authorized sessions and compliant sites.
GitHub: GitHub App installation, Checks API, Pull Requests API.
Data: Postgres for applications/jobs, object storage for resumes and rendered files.

GitHub PR Design
Each application PR should include:
Job posting snapshot and source link.
Match score with reasons.
Generated application materials.
Diff-friendly answer files.

A checklist:
Resume reviewed.
Cover letter reviewed.
Required questions reviewed.
Salary/location/work authorization answers confirmed.
Approved for submission.

Only merged or approved PRs become eligible for the final submit action.
