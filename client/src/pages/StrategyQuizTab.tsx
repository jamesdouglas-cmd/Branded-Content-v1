import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, ChevronRight, ChevronLeft, RotateCcw, CheckCircle2, Lightbulb, Building2 } from "lucide-react";
import { toast } from "sonner";

type QuizAnswers = {
  q1: string; q2: string; q3: string; q4: string;
  q5: string; q6: string; q7: string; q8: string;
};

type PlatformRec = {
  platformKey: string; rank: number; fit: string;
  reason: string; name: string; url: string; description: string;
};

type Example = { brand: string; industry: string; approach: string };

type QuizResult = {
  strategyType: string;
  strategyTitle: string;
  strategySummary: string;
  platformRecommendations: PlatformRec[];
  examples: Example[];
  keyActions: string[];
};

const QUESTIONS = [
  {
    id: "q1",
    question: "What is your primary goal for creator marketing?",
    options: [
      { value: "brand-awareness", label: "Build brand awareness" },
      { value: "drive-conversions", label: "Drive conversions" },
      { value: "creator-relationships", label: "Build creator relationships" },
      { value: "product-launch", label: "Support a specific product launch" },
    ],
  },
  {
    id: "q2",
    question: "How large is your company?",
    options: [
      { value: "startup", label: "Startup (1–50 employees)" },
      { value: "small", label: "Small business (51–200 employees)" },
      { value: "mid-market", label: "Mid-market (201–1,000 employees)" },
      { value: "enterprise", label: "Enterprise (1,001–5,000 employees)" },
      { value: "large-enterprise", label: "Large enterprise (5,000+ employees)" },
    ],
  },
  {
    id: "q3",
    question: "What is your annual creator marketing budget?",
    options: [
      { value: "under-50k", label: "Under $50K" },
      { value: "50k-250k", label: "$50K – $250K" },
      { value: "250k-1m", label: "$250K – $1M" },
      { value: "1m-5m", label: "$1M – $5M" },
      { value: "over-5m", label: "Over $5M" },
    ],
  },
  {
    id: "q4",
    question: "What type of creator content matters most to your brand?",
    options: [
      { value: "ugc-ecommerce", label: "Authentic UGC (user-generated content) for ecommerce" },
      { value: "ugc-ads-social", label: "UGC for ads & social" },
      { value: "video-tiktok", label: "Short-form video (TikTok, Reels, YouTube Shorts)" },
      { value: "long-form", label: "Long-form content (YouTube, blogs, podcasts)" },
    ],
  },
  {
    id: "q5",
    question: "What type of creators do you want to work with?",
    options: [
      { value: "nano", label: "Nano  —  1k–10k Followers" },
      { value: "micro", label: "Micro  —  10k–50k Followers" },
      { value: "mid-tier", label: "Mid-Tier  —  50k–250k Followers" },
      { value: "macro", label: "Macro  —  250k+ Followers" },
      { value: "celebrity", label: "Celebrities / Mega  —  1M+ Followers" },
      { value: "mix", label: "A mix across all tiers" },
    ],
  },
  {
    id: "q6",
    question: "How mature is your current creator marketing program?",
    options: [
      { value: "none", label: "We have no creator program yet" },
      { value: "early", label: "Early stage — a few ad-hoc partnerships" },
      { value: "growing", label: "Growing — running campaigns but not systematized" },
      { value: "established", label: "Established — regular campaigns with some measurement" },
      { value: "advanced", label: "Advanced — full-scale program with dedicated team & tools" },
    ],
  },
  {
    id: "q7",
    question: "Which channel is most important for your creator strategy?",
    options: [
      { value: "instagram", label: "Instagram" },
      { value: "tiktok", label: "TikTok" },
      { value: "youtube", label: "YouTube" },
      { value: "multi-channel", label: "Multi-channel (Instagram + TikTok + YouTube)" },
      { value: "ecommerce", label: "E-commerce / retail (Amazon, Shopify, etc.)" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "q8",
    question: "What is your primary KPI of success?",
    options: [
      { value: "impressions-reach", label: "Impressions, reach & brand awareness metrics" },
      { value: "engagement", label: "Engagement rate & community interaction" },
      { value: "conversions-revenue", label: "Direct conversions, revenue & ROAS" },
      { value: "content-volume", label: "Volume of content produced & content library growth" },
      { value: "brand-sentiment", label: "Brand sentiment, reviews & social proof" },
    ],
  },
];

const FIT_COLORS: Record<string, string> = {
  Excellent: "bg-green-50 text-green-700 border-green-200",
  Strong: "bg-blue-50 text-blue-700 border-blue-200",
  Good: "bg-slate-50 text-slate-600 border-slate-200",
};

const STRATEGY_ICONS: Record<string, string> = {
  ugc_at_scale: "📦",
  influencer_awareness: "📣",
  ambassador_community: "🤝",
  performance_affiliate: "📈",
  enterprise_analytics: "🔬",
  niche_authenticity: "🎯",
};

export default function StrategyQuizTab() {
  const [step, setStep] = useState<"info" | "quiz" | "results">("info");
  const [currentQ, setCurrentQ] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const submitQuiz = trpc.quiz.submit.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setStep("results");
    },
    onError: (err) => toast.error(`Quiz submission failed: ${err.message}`),
  });

  const handleAnswer = (value: string) => {
    const qId = QUESTIONS[currentQ].id as keyof QuizAnswers;
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300);
    } else {
      // All answered — submit
      submitQuiz.mutate({
        companyName,
        contactEmail: contactEmail || undefined,
        answers: newAnswers as QuizAnswers,
      });
    }
  };

  const handleReset = () => {
    setStep("info");
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
    setCompanyName("");
    setContactEmail("");
  };

  // Info / Start screen
  if (step === "info") {
    return (
      <div className="container py-10">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-display font-bold text-foreground">Creator Strategy Quiz</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              Answer 8 quick questions about your brand's goals and we'll recommend the right creator strategy and platforms for you — with real-world examples.
            </p>
          </div>

          <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="companyNameQuiz">Company Name <span className="text-destructive">*</span></Label>
                <Input
                  id="companyNameQuiz"
                  placeholder="e.g. Acme Brands Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactEmailQuiz">Contact Email (optional)</Label>
                <Input
                  id="contactEmailQuiz"
                  type="email"
                  placeholder="you@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <Button
                className="w-full h-11 text-base font-semibold text-white"
                style={{ background: "oklch(0.45 0.18 270)" }}
                onClick={() => {
                  if (!companyName.trim()) {
                    toast.error("Please enter your company name.");
                    return;
                  }
                  setStep("quiz");
                }}
              >
                Start the Quiz <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: "⚡", title: "8 Questions", desc: "Takes less than 3 minutes" },
              { icon: "🎯", title: "Personalized", desc: "Strategy tailored to your goals" },
              { icon: "🔗", title: "Platform Links", desc: "Direct links to top solutions" },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-xl border border-border bg-card text-center space-y-1">
                <div className="text-2xl">{item.icon}</div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  if (step === "quiz") {
    const q = QUESTIONS[currentQ];
    const progress = ((currentQ + 1) / QUESTIONS.length) * 100;

    return (
      <div className="container py-10">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground">Question {currentQ + 1} of {QUESTIONS.length}</span>
              <span className="text-xs font-bold" style={{ color: "oklch(0.68 0.22 45)" }}>{Math.round(progress)}% complete</span>
            </div>
            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    height: 6,
                    flex: i === currentQ ? "0 0 24px" : "0 0 6px",
                    background: i < currentQ
                      ? "oklch(0.68 0.22 45)"
                      : i === currentQ
                      ? "oklch(0.68 0.22 45)"
                      : "oklch(0.35 0.016 240)",
                    opacity: i > currentQ ? 0.5 : 1,
                  }}
                />
              ))}
            </div>
          </div>

          {submitQuiz.isPending ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Analyzing your answers and building your strategy...</p>
            </div>
          ) : (
            <Card className="shadow-sm animate-fade-up">
              <CardContent className="pt-8 pb-6 space-y-6">
                <h3 className="text-lg font-display font-bold text-foreground leading-snug">{q.question}</h3>
                <div className="space-y-2.5">
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(opt.value)}
                      className={`w-full text-left px-4 py-3.5 rounded-lg border text-sm font-medium transition-all duration-150 hover:border-primary hover:bg-accent/40 hover:text-primary ${
                        answers[q.id as keyof QuizAnswers] === opt.value
                          ? "border-primary bg-accent/40 text-primary"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentQ > 0 && !submitQuiz.isPending && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentQ(currentQ - 1)} className="flex items-center gap-1 text-muted-foreground">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Results
  if (step === "results" && result) {
    const icon = STRATEGY_ICONS[result.strategyType] ?? "🎯";
    return (
      <div className="container py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Strategy Header */}
          <div className="rounded-2xl p-8 text-white space-y-3" style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 270) 0%, oklch(0.55 0.20 290) 100%)" }}>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{icon}</span>
              <div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Your Recommended Strategy</p>
                <h2 className="text-2xl font-display font-bold">{result.strategyTitle}</h2>
              </div>
            </div>
            <p className="text-white/85 text-sm leading-relaxed max-w-2xl">{result.strategySummary}</p>
          </div>

          {/* Key Actions */}
          <Card className="shadow-sm">
            <CardContent className="pt-6 pb-5">
              <h3 className="text-base font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Key Actions to Get Started
              </h3>
              <div className="space-y-3">
                {result.keyActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white flex-shrink-0 mt-0.5" style={{ background: "oklch(0.45 0.18 270)" }}>
                      {i + 1}
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Recommendations */}
          <div>
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-primary" /> Recommended Platforms
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {result.platformRecommendations.map((rec) => (
                <Card key={rec.platformKey} className="shadow-sm">
                  <CardContent className="pt-5 pb-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-xs font-semibold ${FIT_COLORS[rec.fit] ?? ""}`}>
                        {rec.fit} Fit
                      </Badge>
                      <span className="text-xs text-muted-foreground">#{rec.rank}</span>
                    </div>
                    <div>
                      <a
                        href={rec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-display font-bold text-lg hover:text-primary transition-colors group"
                      >
                        {rec.name}
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{rec.reason}</p>
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Visit {rec.name} <ChevronRight className="w-3 h-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Real-World Examples */}
          <div>
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Real-World Examples
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {result.examples.map((ex, i) => (
                <Card key={i} className="shadow-sm bg-muted/20">
                  <CardContent className="pt-5 pb-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-foreground">{ex.brand}</span>
                      <Badge variant="outline" className="text-xs text-muted-foreground">{ex.industry}</Badge>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{ex.approach}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* All Platforms */}
          <Card className="shadow-sm bg-muted/30">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">All Platforms</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Social Native", url: "https://www.socialnative.com" },
                  { name: "Grin", url: "https://grin.co" },
                  { name: "CreatorIQ", url: "https://creatoriq.com" },
                  { name: "Aspire", url: "https://aspire.io" },
                  { name: "Upfluence", url: "https://www.upfluence.com" },
                  { name: "Bazaarvoice", url: "https://www.bazaarvoice.com" },
                ].map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-all"
                  >
                    {p.name} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Retake Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
