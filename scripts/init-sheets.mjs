import { google } from "googleapis";
import dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config();

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: SERVICE_ACCOUNT_EMAIL,
    private_key: PRIVATE_KEY,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SCORE_HEADERS = [
  "Timestamp", "Company Name", "Industry", "Company Size", "Annual Revenue",
  "Creator Spend", "Current Platforms", "Brand Description", "Creator Goals",
  "Contact Email", "YouTube Handle", "TikTok Handle", "Instagram Handle",
  "Instagram Followers", "Instagram Engagement Rate",
  "Score", "Score Label", "Report Summary",
  "Rec #1", "Rec #2", "Rec #3"
];

const QUIZ_HEADERS = [
  "Timestamp", "Company Name", "Contact Email",
  "Q1: Primary Goal", "Q2: Company Size", "Q3: Budget",
  "Q4: Content Type", "Q5: Creator Tier", "Q6: Program Maturity",
  "Q7: Primary Channel", "Q8: Primary KPI",
  "Strategy Title", "Strategy Summary",
  "Platform Rec #1", "Platform Rec #2", "Platform Rec #3"
];

async function initSheet(sheetName, headers) {
  // Try to add the sheet (ignore error if it already exists)
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
    console.log(`Created sheet: ${sheetName}`);
  } catch {
    console.log(`Sheet "${sheetName}" already exists, skipping creation.`);
  }

  // Write headers to row 1
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });
  console.log(`Headers written to "${sheetName}"`);
}

async function run() {
  await initSheet("Creator Scores", SCORE_HEADERS);
  await initSheet("Strategy Quiz", QUIZ_HEADERS);
  console.log("✅ Google Sheets initialized successfully.");
}

run().catch(console.error);
