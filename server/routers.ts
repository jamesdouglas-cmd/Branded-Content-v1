import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { saveCreatorScore, saveQuizResponse } from "./db";
import { appendToSheet, sendScoreEmail, sendQuizEmail } from "./integrations";
import { z } from "zod";

// Platform definitions
const PLATFORMS = {
  socialNative: {
    name: "Social Native",
    url: "https://www.socialnative.com",
    description: "End-to-end creator content platform specializing in UGC at scale",
    strengths: ["UGC at scale", "content licensing", "performance analytics", "e-commerce brands"],
    bestFor: ["large enterprise", "e-commerce", "CPG", "retail"],
  },
  grin: {
    name: "Grin",
    url: "https://grin.co",
    description: "All-in-one influencer marketing platform for DTC brands",
    strengths: ["relationship management", "DTC brands", "product seeding", "affiliate integration"],
    bestFor: ["DTC", "mid-market", "fashion", "beauty", "lifestyle"],
  },
  creatoriq: {
    name: "CreatorIQ",
    url: "https://creatoriq.com",
    description: "Enterprise creator intelligence platform with deep analytics",
    strengths: ["enterprise analytics", "creator discovery", "campaign measurement", "brand safety"],
    bestFor: ["enterprise", "Fortune 500", "multi-brand", "agency"],
  },
  aspire: {
    name: "Aspire",
    url: "https://aspire.io",
    description: "Creator commerce platform connecting brands with authentic creators",
    strengths: ["creator marketplace", "affiliate programs", "ambassador programs", "small-mid brands"],
    bestFor: ["SMB", "mid-market", "health & wellness", "beauty", "food & beverage"],
  },
  upfluence: {
    name: "Upfluence",
    url: "https://www.upfluence.com",
    description: "Data-driven influencer marketing platform with e-commerce integrations",
    strengths: ["data-driven discovery", "Shopify integration", "email outreach", "ROI tracking"],
    bestFor: ["e-commerce", "Shopify brands", "mid-market", "tech"],
  },
  bazaarvoice: {
    name: "Bazaarvoice",
    url: "https://www.bazaarvoice.com",
    description: "Ratings, reviews, and UGC platform for retail and enterprise brands",
    strengths: ["ratings & reviews", "retail syndication", "UGC management", "social proof"],
    bestFor: ["retail", "enterprise", "CPG", "multi-channel"],
  },
  modash: {
    name: "Modash",
    url: "https://www.modash.io",
    description: "Influencer discovery and analytics platform covering nano, micro, and mid-tier creators",
    strengths: ["nano & micro discovery", "audience analytics", "fake follower detection", "longtail creator search"],
    bestFor: ["SMB", "mid-market", "nano influencers", "micro influencers", "longtail creator strategy"],
  },
};

const PLATFORM_LIST = Object.values(PLATFORMS);

// ─── Creator Score Router ────────────────────────────────────────────────────

const creatorScoreInput = z.object({
  companyName: z.string().min(1),
  companySize: z.enum(["1-50", "51-200", "201-1000", "1001-5000", "5000+"]),
  industry: z.string().min(1),
  annualRevenue: z.string().optional(),
  estimatedCreatorSpend: z.string().optional(),
  currentPlatforms: z.string().optional(),
  brandDescription: z.string().optional(),
  creatorGoals: z.string().optional(),
  contactEmail: z.string().email().optional(),
  youtubeHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  instagramHandle: z.string().optional(),
  instagramFollowers: z.string().optional(),
  instagramEngagementRate: z.string().optional(),
});

// ─── Quiz Router ─────────────────────────────────────────────────────────────

const quizAnswersSchema = z.object({
  q1: z.string(), // primary goal
  q2: z.string(), // company size
  q3: z.string(), // budget range
  q4: z.string(), // content type preference
  q5: z.string(), // creator tier preference
  q6: z.string(), // current maturity
  q7: z.string(), // primary channel
  q8: z.string(), // measurement priority
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  score: router({
    analyze: publicProcedure
      .input(creatorScoreInput)
      .mutation(async ({ input }) => {
        const platformContext = PLATFORM_LIST.map(p =>
          `${p.name}: ${p.description}. Best for: ${p.bestFor.join(", ")}. Strengths: ${p.strengths.join(", ")}.`
        ).join("\n");

        const prompt = `You are an expert in influencer and creator marketing strategy. Analyze the following brand and produce a Creator Score.

BRAND INFORMATION:
- Company: ${input.companyName}
- Size: ${input.companySize} employees
- Industry: ${input.industry}
- Annual Revenue: ${input.annualRevenue || "Not provided"}
- Estimated Creator/Influencer Marketing Spend: ${input.estimatedCreatorSpend || "Not provided"}
- Current Platforms Used: ${input.currentPlatforms || "None specified"}
- Brand Description: ${input.brandDescription || "Not provided"}
- Creator Marketing Goals: ${input.creatorGoals || "Not provided"}
- YouTube Handle: ${input.youtubeHandle || "Not provided"}
- TikTok Handle: ${input.tiktokHandle || "Not provided"}
- Instagram Handle: ${input.instagramHandle || "Not provided"}
- Instagram Follower Count: ${input.instagramFollowers || "Not provided"}
- Instagram Engagement Rate: ${input.instagramEngagementRate || "Not provided"}

AVAILABLE PLATFORMS:
${platformContext}

SCORING CRITERIA (each out of 20 points, total out of 100):
1. Strategy Maturity: How developed is their creator marketing strategy vs. their company size?
2. Spend Efficiency: Is their estimated creator spend appropriate for their size and industry?
3. Platform Fit: Are they using the right tools for their goals and scale?
4. Content Diversity: Are their goals aligned with diverse content approaches?
5. Growth Potential: How much room do they have to improve and scale their creator program?

Return a JSON object with EXACTLY this structure:
{
  "score": <number 0-100>,
  "scoreBreakdown": {
    "strategyMaturity": { "score": <0-20>, "label": "Strategy Maturity", "insight": "<1-2 sentence insight>" },
    "spendEfficiency": { "score": <0-20>, "label": "Spend Efficiency", "insight": "<1-2 sentence insight>" },
    "platformFit": { "score": <0-20>, "label": "Platform Fit", "insight": "<1-2 sentence insight>" },
    "contentDiversity": { "score": <0-20>, "label": "Content Diversity", "insight": "<1-2 sentence insight>" },
    "growthPotential": { "score": <0-20>, "label": "Growth Potential", "insight": "<1-2 sentence insight>" }
  },
  "topRecommendations": [
    { "platformKey": "<one of: socialNative|grin|creatoriq|aspire|upfluence|bazaarvoice>", "rank": 1, "reason": "<2-3 sentence personalized reason why this platform is #1 for this brand>" },
    { "platformKey": "<one of: socialNative|grin|creatoriq|aspire|upfluence|bazaarvoice>", "rank": 2, "reason": "<2-3 sentence personalized reason why this platform is #2 for this brand>" },
    { "platformKey": "<one of: socialNative|grin|creatoriq|aspire|upfluence|bazaarvoice>", "rank": 3, "reason": "<2-3 sentence personalized reason why this platform is #3 for this brand>" }
  ],
  "reportSummary": "<3-4 sentence executive summary of the brand's creator marketing position, key strengths, and primary opportunity areas>",
  "scoreLabel": "<one of: Emerging|Developing|Established|Advanced|Elite>"
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a creator marketing strategy expert. Always respond with valid JSON only, no markdown, no explanation." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "creator_score_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  scoreLabel: { type: "string" },
                  reportSummary: { type: "string" },
                  scoreBreakdown: {
                    type: "object",
                    properties: {
                      strategyMaturity: { type: "object", properties: { score: { type: "number" }, label: { type: "string" }, insight: { type: "string" } }, required: ["score", "label", "insight"], additionalProperties: false },
                      spendEfficiency: { type: "object", properties: { score: { type: "number" }, label: { type: "string" }, insight: { type: "string" } }, required: ["score", "label", "insight"], additionalProperties: false },
                      platformFit: { type: "object", properties: { score: { type: "number" }, label: { type: "string" }, insight: { type: "string" } }, required: ["score", "label", "insight"], additionalProperties: false },
                      contentDiversity: { type: "object", properties: { score: { type: "number" }, label: { type: "string" }, insight: { type: "string" } }, required: ["score", "label", "insight"], additionalProperties: false },
                      growthPotential: { type: "object", properties: { score: { type: "number" }, label: { type: "string" }, insight: { type: "string" } }, required: ["score", "label", "insight"], additionalProperties: false },
                    },
                    required: ["strategyMaturity", "spendEfficiency", "platformFit", "contentDiversity", "growthPotential"],
                    additionalProperties: false,
                  },
                  topRecommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        platformKey: { type: "string" },
                        rank: { type: "number" },
                        reason: { type: "string" },
                      },
                      required: ["platformKey", "rank", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["score", "scoreLabel", "reportSummary", "scoreBreakdown", "topRecommendations"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content;
        const raw = typeof rawContent === "string" ? rawContent : "{}";
        const result = JSON.parse(raw);

        // Enrich recommendations with full platform data
        const enrichedRecs = (result.topRecommendations as Array<{ platformKey: string; rank: number; reason: string }>).map((rec) => {
          const platformData = PLATFORMS[rec.platformKey as keyof typeof PLATFORMS];
          return {
            ...rec,
            name: platformData?.name ?? rec.platformKey,
            url: platformData?.url ?? "#",
            description: platformData?.description ?? "",
          };
        });

        // Save to DB
        try {
          await saveCreatorScore({
            companyName: input.companyName,
            companySize: input.companySize,
            industry: input.industry,
            annualRevenue: input.annualRevenue,
            estimatedCreatorSpend: input.estimatedCreatorSpend,
            currentPlatforms: input.currentPlatforms,
            brandDescription: input.brandDescription,
            creatorGoals: input.creatorGoals,
            contactEmail: input.contactEmail,
            youtubeHandle: input.youtubeHandle,
            tiktokHandle: input.tiktokHandle,
            instagramHandle: input.instagramHandle,
            instagramFollowers: input.instagramFollowers,
            instagramEngagementRate: input.instagramEngagementRate,
            score: result.score,
            scoreBreakdown: result.scoreBreakdown,
            topRecommendations: enrichedRecs,
            reportSummary: result.reportSummary,
          });
        } catch (e) {
          console.error("Failed to save creator score:", e);
        }

        // Log to Google Sheets
        const scoreRecs = enrichedRecs as Array<{ name: string; rank: number; reason: string }>;
        appendToSheet("Creator Scores", [
          new Date().toISOString(),
          input.companyName,
          input.industry,
          input.companySize,
          input.annualRevenue ?? "",
          input.estimatedCreatorSpend ?? "",
          input.currentPlatforms ?? "",
          input.brandDescription ?? "",
          input.creatorGoals ?? "",
          input.contactEmail ?? "",
          input.youtubeHandle ?? "",
          input.tiktokHandle ?? "",
          input.instagramHandle ?? "",
          input.instagramFollowers ?? "",
          input.instagramEngagementRate ?? "",
          result.score,
          result.scoreLabel,
          result.reportSummary,
          scoreRecs[0]?.name ?? "",
          scoreRecs[1]?.name ?? "",
          scoreRecs[2]?.name ?? "",
        ]);

        // Send email notification
        sendScoreEmail({
          companyName: input.companyName,
          industry: input.industry,
          companySize: input.companySize,
          annualRevenue: input.annualRevenue,
          estimatedCreatorSpend: input.estimatedCreatorSpend,
          currentPlatforms: input.currentPlatforms,
          brandDescription: input.brandDescription,
          creatorGoals: input.creatorGoals,
          contactEmail: input.contactEmail,
          youtubeHandle: input.youtubeHandle,
          tiktokHandle: input.tiktokHandle,
          instagramHandle: input.instagramHandle,
          instagramFollowers: input.instagramFollowers,
          instagramEngagementRate: input.instagramEngagementRate,
          score: result.score as number,
          scoreLabel: result.scoreLabel as string,
          reportSummary: result.reportSummary as string,
          topRecommendations: scoreRecs,
        });

        return {
          score: result.score as number,
          scoreLabel: result.scoreLabel as string,
          reportSummary: result.reportSummary as string,
          scoreBreakdown: result.scoreBreakdown as Record<string, { score: number; label: string; insight: string }>,
          topRecommendations: enrichedRecs,
        };
      }),
  }),

  quiz: router({
    submit: publicProcedure
      .input(z.object({
        companyName: z.string().min(1),
        contactEmail: z.string().email().optional(),
        answers: quizAnswersSchema,
      }))
      .mutation(async ({ input }) => {
        const platformContext = PLATFORM_LIST.map(p =>
          `${p.name} (key: ${Object.keys(PLATFORMS).find(k => PLATFORMS[k as keyof typeof PLATFORMS].name === p.name)}): ${p.description}. Best for: ${p.bestFor.join(", ")}. Strengths: ${p.strengths.join(", ")}.`
        ).join("\n");

        const quizContext = `
Q1 - Primary goal: ${input.answers.q1}
Q2 - Company size: ${input.answers.q2}
Q3 - Budget range: ${input.answers.q3}
Q4 - Content type preference: ${input.answers.q4}
Q5 - Creator tier preference: ${input.answers.q5}
Q6 - Current program maturity: ${input.answers.q6}
Q7 - Primary channel: ${input.answers.q7}
Q8 - Measurement priority: ${input.answers.q8}`;

        const prompt = `You are an expert creator marketing strategist. Based on the quiz answers below, determine the best creator strategy for this brand and recommend platforms.

COMPANY: ${input.companyName}
QUIZ ANSWERS:${quizContext}

AVAILABLE PLATFORMS:
${platformContext}

STRATEGY TYPES (choose the most fitting one):
- "ugc_at_scale": Best for brands needing high-volume authentic content for paid media and e-commerce
- "influencer_awareness": Best for brands focused on reach, brand awareness, and top-of-funnel growth
- "ambassador_community": Best for brands wanting long-term creator relationships and brand advocates
- "performance_affiliate": Best for brands focused on measurable ROI, conversions, and affiliate-style programs
- "enterprise_analytics": Best for large brands needing deep data, brand safety, and multi-campaign management
- "niche_authenticity": Best for brands targeting specific communities with highly authentic, niche creators

Return a JSON object with EXACTLY this structure:
{
  "strategyType": "<one of the strategy types above>",
  "strategyTitle": "<catchy 4-6 word title for their recommended strategy>",
  "strategySummary": "<3-4 sentence explanation of why this strategy fits their goals and how to execute it>",
  "platformRecommendations": [
    {
      "platformKey": "<one of: socialNative|grin|creatoriq|aspire|upfluence|bazaarvoice>",
      "rank": 1,
      "fit": "<Excellent|Strong|Good>",
      "reason": "<2-3 sentence reason why this platform fits their strategy and goals>"
    },
    {
      "platformKey": "<different platform key>",
      "rank": 2,
      "fit": "<Excellent|Strong|Good>",
      "reason": "<2-3 sentence reason>"
    },
    {
      "platformKey": "<different platform key>",
      "rank": 3,
      "fit": "<Excellent|Strong|Good>",
      "reason": "<2-3 sentence reason>"
    }
  ],
  "examples": [
    {
      "brand": "<real brand name>",
      "industry": "<industry>",
      "approach": "<2-3 sentence description of how this real brand successfully used a similar strategy>"
    },
    {
      "brand": "<different real brand name>",
      "industry": "<industry>",
      "approach": "<2-3 sentence description>"
    }
  ],
  "keyActions": [
    "<actionable first step>",
    "<actionable second step>",
    "<actionable third step>"
  ]
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a creator marketing strategy expert. Always respond with valid JSON only." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "quiz_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  strategyType: { type: "string" },
                  strategyTitle: { type: "string" },
                  strategySummary: { type: "string" },
                  platformRecommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        platformKey: { type: "string" },
                        rank: { type: "number" },
                        fit: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["platformKey", "rank", "fit", "reason"],
                      additionalProperties: false,
                    },
                  },
                  examples: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        brand: { type: "string" },
                        industry: { type: "string" },
                        approach: { type: "string" },
                      },
                      required: ["brand", "industry", "approach"],
                      additionalProperties: false,
                    },
                  },
                  keyActions: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["strategyType", "strategyTitle", "strategySummary", "platformRecommendations", "examples", "keyActions"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content;
        const raw = typeof rawContent === "string" ? rawContent : "{}";
        const result = JSON.parse(raw);

        // Enrich platform recommendations
        const enrichedRecs = ((result.platformRecommendations ?? []) as Array<{ platformKey: string; rank: number; fit: string; reason: string }>).map((rec) => {
          const platformData = PLATFORMS[rec.platformKey as keyof typeof PLATFORMS];
          return {
            ...rec,
            name: platformData?.name ?? rec.platformKey,
            url: platformData?.url ?? "#",
            description: platformData?.description ?? "",
          };
        });

        // Save to DB
        try {
          await saveQuizResponse({
            companyName: input.companyName,
            contactEmail: input.contactEmail,
            answers: input.answers,
            strategyType: result.strategyType,
            strategyTitle: result.strategyTitle,
            strategySummary: result.strategySummary,
            platformRecommendations: enrichedRecs,
            examples: result.examples,
          });
        } catch (e) {
          console.error("Failed to save quiz response:", e);
        }

        // Log to Google Sheets
        const quizRecs = enrichedRecs as Array<{ name: string; rank: number; fit: string; reason: string }>;
        appendToSheet("Strategy Quiz", [
          new Date().toISOString(),
          input.companyName,
          input.contactEmail ?? "",
          input.answers.q1,
          input.answers.q2,
          input.answers.q3,
          input.answers.q4,
          input.answers.q5,
          input.answers.q6,
          input.answers.q7,
          input.answers.q8,
          result.strategyTitle,
          result.strategySummary,
          quizRecs[0]?.name ?? "",
          quizRecs[1]?.name ?? "",
          quizRecs[2]?.name ?? "",
        ]);

        // Send email notification
        sendQuizEmail({
          companyName: input.companyName,
          contactEmail: input.contactEmail,
          answers: input.answers,
          strategyTitle: result.strategyTitle,
          strategySummary: result.strategySummary,
          platformRecommendations: quizRecs,
        });

        return {
          strategyType: result.strategyType as string,
          strategyTitle: result.strategyTitle as string,
          strategySummary: result.strategySummary as string,
          platformRecommendations: enrichedRecs,
          examples: result.examples as Array<{ brand: string; industry: string; approach: string }>,
          keyActions: result.keyActions as string[],
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
