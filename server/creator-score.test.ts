import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM and DB to avoid real API calls in tests
const mockInvokeLLM = vi.hoisted(() => vi.fn());
vi.mock("./_core/llm", () => ({
  invokeLLM: mockInvokeLLM,
}));

const SCORE_MOCK_RESPONSE = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          score: 62,
          scoreLabel: "Established",
          reportSummary: "Acme Brands has a solid foundation in creator marketing with room to scale.",
          scoreBreakdown: {
            strategyMaturity: { score: 13, label: "Strategy Maturity", insight: "Good strategic foundation." },
            spendEfficiency: { score: 12, label: "Spend Efficiency", insight: "Spend is reasonable for size." },
            platformFit: { score: 14, label: "Platform Fit", insight: "Current tools are adequate." },
            contentDiversity: { score: 11, label: "Content Diversity", insight: "Could diversify content types." },
            growthPotential: { score: 12, label: "Growth Potential", insight: "Strong room to grow." },
          },
          topRecommendations: [
            { platformKey: "grin", rank: 1, reason: "Best fit for DTC brands at this scale." },
            { platformKey: "aspire", rank: 2, reason: "Great for ambassador programs." },
            { platformKey: "upfluence", rank: 3, reason: "Strong e-commerce integrations." },
          ],
        }),
      },
    },
  ],
};

const QUIZ_MOCK_RESPONSE = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          strategyType: "ugc_at_scale",
          strategyTitle: "Scale UGC for Performance",
          strategySummary: "Focus on high-volume authentic UGC to fuel paid media.",
          platformRecommendations: [
            { platformKey: "socialNative", rank: 1, fit: "Excellent", reason: "Best for UGC at scale." },
            { platformKey: "aspire", rank: 2, fit: "Strong", reason: "Great creator marketplace." },
            { platformKey: "upfluence", rank: 3, fit: "Good", reason: "Strong e-commerce integrations." },
          ],
          examples: [
            { brand: "Glossier", industry: "Beauty", approach: "Used micro-influencers for authentic UGC." },
            { brand: "Gymshark", industry: "Fitness", approach: "Built ambassador community for organic reach." },
          ],
          keyActions: [
            "Identify 50 micro-creators in your niche.",
            "Launch a product seeding program.",
            "Repurpose top UGC as paid social ads.",
          ],
        }),
      },
    },
  ],
};

vi.mock("./db", () => ({
  saveCreatorScore: vi.fn().mockResolvedValue({}),
  saveQuizResponse: vi.fn().mockResolvedValue({}),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getRecentScores: vi.fn().mockResolvedValue([]),
  getRecentQuizResponses: vi.fn().mockResolvedValue([]),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("score.analyze", () => {
  beforeEach(() => {
    mockInvokeLLM.mockResolvedValue(SCORE_MOCK_RESPONSE);
  });

  it("returns a valid score result with all required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.score.analyze({
      companyName: "Acme Brands",
      companySize: "201-1000",
      industry: "Beauty",
      annualRevenue: "50m-250m",
      estimatedCreatorSpend: "250k-1m",
      currentPlatforms: "Manual outreach",
      brandDescription: "A mid-size beauty brand targeting millennials.",
      creatorGoals: "Scale UGC content and drive conversions.",
    });

    expect(result).toBeDefined();
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.scoreLabel).toBeTruthy();
    expect(result.reportSummary).toBeTruthy();
    expect(result.scoreBreakdown).toBeDefined();
    expect(Object.keys(result.scoreBreakdown)).toHaveLength(5);
    expect(result.topRecommendations).toHaveLength(3);
  });

  it("enriches platform recommendations with name and url", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.score.analyze({
      companyName: "Test Brand",
      companySize: "51-200",
      industry: "Fashion",
    });

    const firstRec = result.topRecommendations[0];
    expect(firstRec.name).toBeTruthy();
    expect(firstRec.url).toMatch(/^https?:\/\//);
    expect(firstRec.rank).toBe(1);
  });

  it("requires companyName, companySize, and industry", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.score.analyze({
        companyName: "",
        companySize: "51-200",
        industry: "Tech",
      })
    ).rejects.toThrow();
  });
});

describe("quiz.submit", () => {
  beforeEach(() => {
    mockInvokeLLM.mockResolvedValue(QUIZ_MOCK_RESPONSE);
  });

  it("returns a valid quiz result with strategy and platform recommendations", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quiz.submit({
      companyName: "Test Brand",
      answers: {
        q1: "drive-conversions",
        q2: "mid-market",
        q3: "250k-1m",
        q4: "ugc-authentic",
        q5: "nano-micro",
        q6: "growing",
        q7: "instagram",
        q8: "conversions-revenue",
      },
    });

    expect(result.strategyType).toBeTruthy();
    expect(result.strategyTitle).toBeTruthy();
    expect(result.strategySummary).toBeTruthy();
    expect(result.platformRecommendations).toHaveLength(3);
    expect(result.examples.length).toBeGreaterThan(0);
    expect(result.keyActions.length).toBeGreaterThan(0);
  });

  it("enriches quiz platform recommendations with name and url", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quiz.submit({
      companyName: "Test Brand",
      answers: {
        q1: "brand-awareness",
        q2: "small",
        q3: "under-50k",
        q4: "video-tiktok",
        q5: "mid-tier",
        q6: "early",
        q7: "tiktok",
        q8: "engagement",
      },
    });

    const firstRec = result.platformRecommendations[0];
    expect(firstRec.name).toBeTruthy();
    expect(firstRec.url).toMatch(/^https?:\/\//);
    expect(firstRec.fit).toBeTruthy();
  });

  it("requires companyName", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.quiz.submit({
        companyName: "",
        answers: {
          q1: "brand-awareness", q2: "small", q3: "under-50k",
          q4: "video-tiktok", q5: "mid-tier", q6: "early",
          q7: "tiktok", q8: "engagement",
        },
      })
    ).rejects.toThrow();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
