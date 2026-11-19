# LinkedIn Job Alert Connector

Application Copilot ingests the plain-text portion of LinkedIn job-alert emails. It stores only the role, company, location, LinkedIn job ID, canonical job URL, and alert date. Recipient details, full email bodies, and LinkedIn tracking parameters are not stored.

## 1. Configure staging

Create a long random value and add it to the staging Vercel project as:

```text
LINKEDIN_ALERT_INGEST_SECRET=replace-with-a-long-random-value
```

Use the same value in the Apps Script property named `COPILOT_LINKEDIN_SECRET`.

## 2. Create the Gmail Apps Script

Open [Google Apps Script](https://script.google.com/), create a project, and paste the script below.

```javascript
function importLinkedInJobAlerts() {
  const properties = PropertiesService.getScriptProperties();
  const endpoint = properties.getProperty("COPILOT_LINKEDIN_ENDPOINT");
  const secret = properties.getProperty("COPILOT_LINKEDIN_SECRET");
  const labelName = "ApplicationCopilot/Imported";
  const label = GmailApp.getUserLabelByName(labelName) || GmailApp.createLabel(labelName);
  const threads = GmailApp.search(
    'from:jobalerts-noreply@linkedin.com newer_than:7d -label:"ApplicationCopilot/Imported"',
    0,
    20,
  );

  for (const thread of threads) {
    let imported = false;

    for (const message of thread.getMessages()) {
      if (!message.getFrom().includes("jobalerts-noreply@linkedin.com")) continue;

      const response = UrlFetchApp.fetch(endpoint, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: `Bearer ${secret}` },
        payload: JSON.stringify({
          receivedAt: message.getDate().toISOString(),
          text: message.getPlainBody(),
        }),
        muteHttpExceptions: true,
      });

      if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
        imported = true;
      }
    }

    if (imported) label.addToThread(thread);
  }
}
```

Add these script properties:

```text
COPILOT_LINKEDIN_ENDPOINT=https://application-copilot-staging.vercel.app/api/jobs/linkedin-alerts
COPILOT_LINKEDIN_SECRET=the-same-secret-used-in-vercel
```

Run the function once manually and approve Gmail read/label access. After the staging test succeeds, add a time-driven trigger to run it each morning.

## 3. Discovery behavior

- Imported jobs remain eligible for discovery for 14 days after their latest alert.
- Duplicate LinkedIn job IDs are updated rather than inserted again.
- The discovery pipeline applies the normal location, job-family, portfolio, seniority, employment-type, validation, pass, invalid, and tracked-application gates.
- LinkedIn email URLs are reduced to `https://www.linkedin.com/jobs/view/{jobId}` before storage.

Do not point production at the connector until the staging import and queue output have been reviewed.
