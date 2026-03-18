import { google } from "googleapis";
import { Resend } from "resend";
import { ENV } from "./_core/env";

// ─── Google Sheets ────────────────────────────────────────────────────────────

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: ENV.googleServiceAccountEmail,
      private_key: ENV.googlePrivateKey.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function appendToSheet(sheetName: string, values: (string | number | null | undefined)[]) {
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: ENV.googleSpreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values.map((v) => (v === null || v === undefined ? "" : String(v)))],
      },
    });
  } catch (err) {
    console.error(`[Sheets] Failed to append to ${sheetName}:`, err);
  }
}

// ─── Resend Email ─────────────────────────────────────────────────────────────

const NOTIFY_EMAIL = "james.douglas@socialnative.com";
const FROM_EMAIL = "Creator Score <onboarding@resend.dev>";

function getResend() {
  return new Resend(ENV.resendApiKey);
}

export async function sendScoreEmail(data: {
  companyName: string;
  industry: string;
  companySize: string;
  annualRevenue?: string;
  estimatedCreatorSpend?: string;
  currentPlatforms?: string;
  brandDescription?: string;
  creatorGoals?: string;
  contactEmail?: string;
  youtubeHandle?: string;
  tiktokHandle?: string;
  instagramHandle?: string;
  instagramFollowers?: string;
  instagramEngagementRate?: string;
  score: number;
  scoreLabel: string;
  reportSummary: string;
  topRecommendations: { name: string; rank: number; reason: string }[];
}) {
  try {
    const resend = getResend();
    const recs = data.topRecommendations
      .map((r) => `<li><strong>#${r.rank} ${r.name}</strong>: ${r.reason}</li>`)
      .join("");

    await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFY_EMAIL,
      subject: `New Creator Score Submission — ${data.companyName} (Score: ${data.score}/100)`,
      html: `
        <h2>New Creator Score Submission</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;width:220px;">Company Name</td><td style="padding:6px 12px;">${data.companyName}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Industry</td><td style="padding:6px 12px;">${data.industry}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Company Size</td><td style="padding:6px 12px;">${data.companySize}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Annual Revenue</td><td style="padding:6px 12px;">${data.annualRevenue || "—"}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Creator Spend</td><td style="padding:6px 12px;">${data.estimatedCreatorSpend || "—"}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Current Platforms</td><td style="padding:6px 12px;">${data.currentPlatforms || "—"}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Brand Description</td><td style="padding:6px 12px;">${data.brandDescription || "—"}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Creator Goals</td><td style="padding:6px 12px;">${data.creatorGoals || "—"}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Contact Email</td><td style="padding:6px 12px;">${data.contactEmail || "—"}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">YouTube Handle</td><td style="padding:6px 12px;">${data.youtubeHandle || "—"}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">TikTok Handle</td><td style="padding:6px 12px;">${data.tiktokHandle || "—"}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Instagram Handle</td><td style="padding:6px 12px;">${data.instagramHandle || "—"}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Instagram Followers</td><td style="padding:6px 12px;">${data.instagramFollowers || "—"}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Instagram Engagement Rate</td><td style="padding:6px 12px;">${data.instagramEngagementRate || "—"}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;color:#6d28d9;">Creator Score</td><td style="padding:6px 12px;font-weight:bold;color:#6d28d9;">${data.score}/100 — ${data.scoreLabel}</td></tr>
        </table>
        <h3 style="margin-top:24px;">Executive Summary</h3>
        <p style="font-family:sans-serif;font-size:14px;">${data.reportSummary}</p>
        <h3>Top 3 Platform Recommendations</h3>
        <ul style="font-family:sans-serif;font-size:14px;">${recs}</ul>
      `,
    });
  } catch (err) {
    console.error("[Email] Failed to send score notification:", err);
  }
}

export async function sendQuizEmail(data: {
  companyName: string;
  contactEmail?: string;
  answers: Record<string, string>;
  strategyTitle: string;
  strategySummary: string;
  platformRecommendations: { name: string; rank: number; fit: string; reason: string }[];
}) {
  try {
    const resend = getResend();
    const answerLabels: Record<string, string> = {
      q1: "Primary Goal",
      q2: "Company Size",
      q3: "Budget",
      q4: "Content Type",
      q5: "Creator Tier",
      q6: "Program Maturity",
      q7: "Primary Channel",
      q8: "Primary KPI",
    };
    const answersHtml = Object.entries(data.answers)
      .map(([k, v]) => `<tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;width:220px;">${answerLabels[k] || k}</td><td style="padding:6px 12px;">${v}</td></tr>`)
      .join("");
    const recs = (data.platformRecommendations || [])
      .map((r) => `<li><strong>#${r.rank} ${r.name}</strong> (${r.fit} fit): ${r.reason}</li>`)
      .join("");

    await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFY_EMAIL,
      subject: `New Strategy Quiz Submission — ${data.companyName}: ${data.strategyTitle}`,
      html: `
        <h2>New Strategy Quiz Submission</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;width:220px;">Company Name</td><td style="padding:6px 12px;">${data.companyName}</td></tr>
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Contact Email</td><td style="padding:6px 12px;">${data.contactEmail || "—"}</td></tr>
          ${answersHtml}
          <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;color:#6d28d9;">Recommended Strategy</td><td style="padding:6px 12px;font-weight:bold;color:#6d28d9;">${data.strategyTitle}</td></tr>
        </table>
        <h3 style="margin-top:24px;">Strategy Summary</h3>
        <p style="font-family:sans-serif;font-size:14px;">${data.strategySummary}</p>
        <h3>Platform Recommendations</h3>
        <ul style="font-family:sans-serif;font-size:14px;">${recs}</ul>
      `,
    });
  } catch (err) {
    console.error("[Email] Failed to send quiz notification:", err);
  }
}
