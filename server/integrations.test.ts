import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoist mocks ─────────────────────────────────────────────────────────────
const mockAppend = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockUpdate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockSendEmail = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "test-email-id" }));

vi.mock("googleapis", () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn().mockImplementation(() => ({})),
    },
    sheets: vi.fn().mockReturnValue({
      spreadsheets: {
        values: {
          append: mockAppend,
          update: mockUpdate,
        },
      },
    }),
  },
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSendEmail },
  })),
}));

vi.mock("./_core/env", () => ({
  ENV: {
    googleServiceAccountEmail: "test@test.iam.gserviceaccount.com",
    googlePrivateKey: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n",
    googleSpreadsheetId: "test-spreadsheet-id",
    resendApiKey: "re_test_key",
  },
}));

// Import after mocks are set up
const { appendToSheet, sendScoreEmail, sendQuizEmail } = await import("./integrations");

describe("appendToSheet", () => {
  beforeEach(() => {
    mockAppend.mockClear();
  });

  it("calls Google Sheets append with correct spreadsheet ID and range", async () => {
    await appendToSheet("Creator Scores", ["2024-01-01", "Acme Corp", "CPG"]);
    expect(mockAppend).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: "test-spreadsheet-id",
        range: "Creator Scores!A1",
        valueInputOption: "USER_ENTERED",
      })
    );
  });

  it("converts null/undefined values to empty strings", async () => {
    await appendToSheet("Creator Scores", ["Acme", null, undefined, 42]);
    const call = mockAppend.mock.calls[0][0];
    expect(call.requestBody.values[0]).toEqual(["Acme", "", "", "42"]);
  });

  it("does not throw on Sheets API error", async () => {
    mockAppend.mockRejectedValueOnce(new Error("API error"));
    await expect(appendToSheet("Creator Scores", ["test"])).resolves.not.toThrow();
  });
});

describe("sendScoreEmail", () => {
  beforeEach(() => {
    mockSendEmail.mockClear();
  });

  it("sends email to james.douglas@socialnative.com with company name in subject", async () => {
    await sendScoreEmail({
      companyName: "TestBrand",
      industry: "CPG",
      companySize: "201-1000",
      score: 72,
      scoreLabel: "Strong",
      reportSummary: "Good creator strategy.",
      topRecommendations: [
        { name: "Social Native", rank: 1, reason: "Best for UGC at scale." },
      ],
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "james.douglas@socialnative.com",
        subject: expect.stringContaining("TestBrand"),
      })
    );
  });

  it("includes score in email subject", async () => {
    await sendScoreEmail({
      companyName: "Acme",
      industry: "Fashion",
      companySize: "51-200",
      score: 85,
      scoreLabel: "Excellent",
      reportSummary: "Excellent strategy.",
      topRecommendations: [],
    });
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.subject).toContain("85");
  });

  it("does not throw on email API error", async () => {
    mockSendEmail.mockRejectedValueOnce(new Error("Email error"));
    await expect(
      sendScoreEmail({
        companyName: "Acme",
        industry: "Tech",
        companySize: "1-50",
        score: 50,
        scoreLabel: "Developing",
        reportSummary: "Needs work.",
        topRecommendations: [],
      })
    ).resolves.not.toThrow();
  });
});

describe("sendQuizEmail", () => {
  beforeEach(() => {
    mockSendEmail.mockClear();
  });

  it("sends email to james.douglas@socialnative.com with strategy title in subject", async () => {
    await sendQuizEmail({
      companyName: "BrandX",
      answers: { q1: "brand-awareness", q2: "201-1000", q3: "50k-250k", q4: "ugc-ecommerce", q5: "micro", q6: "growing", q7: "instagram", q8: "engagement" },
      strategyTitle: "UGC at Scale",
      strategySummary: "Focus on micro-creator UGC.",
      platformRecommendations: [
        { name: "Social Native", rank: 1, fit: "Excellent", reason: "Best for UGC." },
      ],
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "james.douglas@socialnative.com",
        subject: expect.stringContaining("BrandX"),
      })
    );
  });

  it("does not throw on email API error", async () => {
    mockSendEmail.mockRejectedValueOnce(new Error("Email error"));
    await expect(
      sendQuizEmail({
        companyName: "BrandY",
        answers: {},
        strategyTitle: "Test",
        strategySummary: "Test summary.",
        platformRecommendations: [],
      })
    ).resolves.not.toThrow();
  });
});
