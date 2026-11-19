const ignoredCardLines = [
  /^this company is actively hiring$/i,
  /^actively recruiting$/i,
  /^\d+\s+(school alum|connection)s?$/i,
  /^easy apply$/i,
  /^promoted$/i,
];

/**
 * Parse the plain-text part of a LinkedIn job-alert digest without retaining
 * recipient details, tracking parameters, or the rest of the email body.
 *
 * @param {string} text
 * @returns {Array<{linkedinJobId: string, company: string, role: string, location: string, jobUrl: string}>}
 */
export function parseLinkedInAlert(text) {
  const jobs = [];
  const jobLinkPattern = /View job:\s*(https:\/\/www\.linkedin\.com\/comm\/jobs\/view\/(\d+)\/?[^\s]*)/gi;
  let previousMatchEnd = 0;

  for (const match of text.matchAll(jobLinkPattern)) {
    const segment = text.slice(previousMatchEnd, match.index ?? 0);
    const lines = segment
      .split(/\r?\n/)
      .map(cleanLine)
      .filter(Boolean)
      .filter((line) => !/^[-–—]{8,}$/.test(line))
      .filter((line) => !/^your job alert for\b/i.test(line))
      .filter((line) => !/^view jobs in\b/i.test(line))
      .filter((line) => !ignoredCardLines.some((pattern) => pattern.test(line)));
    const [role, company, location] = lines.slice(-3);
    const linkedinJobId = match[2];

    if (role && company && location && linkedinJobId) {
      jobs.push({
        linkedinJobId,
        company,
        role,
        location,
        jobUrl: `https://www.linkedin.com/jobs/view/${linkedinJobId}`,
      });
    }

    previousMatchEnd = (match.index ?? 0) + match[0].length;
  }

  return deduplicateJobs(jobs);
}

function cleanLine(value) {
  return value.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").replace(/\s+/g, " ").trim();
}

function deduplicateJobs(jobs) {
  return Array.from(new Map(jobs.map((job) => [job.linkedinJobId, job])).values());
}
