import { useState } from "react";
import CreatorScoreTab from "./CreatorScoreTab";
import StrategyQuizTab from "./StrategyQuizTab";
import { BarChart3, Lightbulb, Zap, ChevronDown, ChevronUp, TrendingUp, Target, Award } from "lucide-react";

type Tab = "score" | "quiz";

const PLATFORMS = [
  { name: "Social Native", url: "https://www.socialnative.com" },
  { name: "Grin", url: "https://grin.co" },
  { name: "CreatorIQ", url: "https://creatoriq.com" },
  { name: "Aspire", url: "https://aspire.io" },
  { name: "Upfluence", url: "https://www.upfluence.com" },
  { name: "Bazaarvoice", url: "https://www.bazaarvoice.com" },
  { name: "Modash", url: "https://www.modash.io" },
];

const FAQ_ITEMS = [
  {
    q: "What is the Branded Content Creator Score?",
    a: "The Creator Score is an AI-powered benchmark that evaluates how effectively your brand is investing in creator marketing relative to your company size, industry, and publicly available data on creator spend. It scores your influencer program across five dimensions (Strategy Maturity, Spend Efficiency, Platform Fit, Content Diversity, and Growth Potential) and returns a 0-100 score with a personalized breakdown and top 3 platform recommendations.",
  },
  {
    q: "How does the AI evaluate my creator strategy?",
    a: "Our AI model analyzes the inputs you provide (company size, annual revenue, estimated creator spend, current platforms, brand description, and social media handles) and benchmarks them against known patterns for brands at your scale and in your industry. It draws on publicly available data about creator program maturity, industry spend norms, and platform fit to generate a score that reflects where you stand and where the biggest opportunities are.",
  },
  {
    q: "Which influencer marketing platforms do you evaluate?",
    a: "We evaluate and recommend from seven leading creator marketing platforms: Social Native, Grin, CreatorIQ, Aspire, Upfluence, Bazaarvoice, and Modash. Each platform has distinct strengths, from UGC at scale and nano/micro-influencer discovery to enterprise analytics and partnership ads management. Our AI matches your brand profile to the platforms most likely to drive results for your specific creator program goals.",
  },
  {
    q: "What is the Strategy Quiz and how is it different from the Creator Score?",
    a: "The Creator Score evaluates your current influencer marketing effectiveness. The Strategy Quiz is forward-looking, asking 8 questions about your goals, budget, content type preferences, creator tier (nano, micro, mid-tier, macro, or celebrity), program maturity, and primary KPI, then recommending a creator strategy tailored to where you want to go. Together, they give you a complete picture of where you are and what to do next.",
  },
  {
    q: "What creator tiers do you cover?",
    a: "We cover the full creator spectrum: Nano influencers (1k-10k followers), Micro influencers (10k-50k followers), Mid-Tier creators (50k-250k followers), Macro influencers (250k+ followers), and Celebrity/Mega influencers (1M+ followers). Each tier has different strengths for branded content, partnership ads, and longtail creator strategies, and our recommendations account for which tier best fits your goals and budget.",
  },
  {
    q: "How accurate is the Creator Score?",
    a: "The Creator Score is currently in beta, and like any AI model, it becomes more accurate the more data it receives. Right now, the score is most precise when you provide your social media handles (YouTube, TikTok, Instagram) and honest estimates of your creator spend and program maturity. Without those inputs, the AI relies on industry benchmarks and the information you provide in the form. Adding your handles allows the model to factor in real follower counts and engagement signals, which significantly improves precision. As more brands complete the score, our benchmarks will sharpen.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-border rounded-xl overflow-hidden transition-all duration-200"
      style={{ background: open ? "oklch(0.28 0.020 240)" : "oklch(0.25 0.018 240)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
        aria-expanded={open}
      >
        <span className="font-semibold text-foreground text-sm md:text-base">{q}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-primary shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("score");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-20" style={{ background: "oklch(0.22 0.018 240 / 0.95)", backdropFilter: "blur(12px)" }}>
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.68 0.22 45), oklch(0.55 0.22 40))" }}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="font-bold text-lg text-foreground tracking-tight">Branded Content </span>
                <span className="font-bold text-lg tracking-tight text-gradient-orange">Creator Score</span>
              </div>
            </div>
            <a
              href="https://www.brandedcontent.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:block text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              brandedcontent.com
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner — two column */}
      <div
        className="grain-overlay relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.20 0.018 240) 0%, oklch(0.24 0.016 240) 100%)" }}
      >
        {/* Background glows */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.68 0.22 45 / 0.09) 0%, transparent 65%)", transform: "translate(20%, -20%)" }} />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.45 0.18 240 / 0.10) 0%, transparent 70%)", transform: "translateY(40%)" }} />
        {/* Dot grid accent */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(oklch(0.68 0.22 45 / 0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        <div className="container py-14 md:py-20 relative" style={{ zIndex: 2 }}>
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left: copy */}
            <div>
              <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
                style={{ background: "oklch(0.68 0.22 45 / 0.12)", borderColor: "oklch(0.68 0.22 45 / 0.3)", color: "oklch(0.78 0.18 50)" }}>
                <Zap className="w-3 h-3" />
                AI-Powered Creator Marketing Intelligence
              </div>
              <h1 className="animate-fade-up animation-delay-100 text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
                Most brands are <span className="text-gradient-orange">underinvesting</span> in creator marketing.
                Find out if yours is one of them.
              </h1>
              <p className="animate-fade-up animation-delay-200 text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
                Enter your brand details and get an AI-powered <strong className="text-foreground">Creator Score</strong> in seconds, benchmarked against your industry. Then see exactly which <strong className="text-foreground">influencer marketing platforms</strong> fit your program, and which creator strategy to run next.
              </p>
              <div className="animate-fade-up animation-delay-300 flex flex-wrap gap-5 text-sm">
                {[
                  { icon: <TrendingUp className="w-4 h-4" />, label: "7 platforms evaluated" },
                  { icon: <Target className="w-4 h-4" />, label: "Nano to celebrity tiers" },
                  { icon: <Award className="w-4 h-4" />, label: "AI-scored in seconds" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2" style={{ color: "oklch(0.68 0.22 45)" }}>
                    {stat.icon}
                    <span className="text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: score preview mockup */}
            <div className="hidden md:flex justify-center animate-scale-in animation-delay-400">
              <div
                className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
                style={{ background: "oklch(0.26 0.020 240)", border: "1.5px solid oklch(0.38 0.018 240)", boxShadow: "0 24px 64px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(0.68 0.22 45 / 0.06)" }}
              >
                {/* Mock header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.68 0.22 45)" }}>Creator Score Report</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "oklch(0.68 0.22 45 / 0.15)", color: "oklch(0.78 0.18 50)" }}>Beta</span>
                </div>

                {/* Mock gauge */}
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="relative" style={{ width: 140, height: 120 }}>
                    <svg viewBox="0 0 120 110" width="140" height="120">
                      <path d="M 14.7 95 A 54 54 0 1 1 105.3 95" fill="none" stroke="oklch(0.32 0.016 240)" strokeWidth="9" strokeLinecap="round" />
                      <path d="M 14.7 95 A 54 54 0 1 1 88.5 28" fill="none" stroke="oklch(0.68 0.22 45)" strokeWidth="9" strokeLinecap="round"
                        style={{ filter: "drop-shadow(0 0 6px oklch(0.68 0.22 45 / 0.6))" }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: 8 }}>
                      <span className="font-bold text-foreground" style={{ fontSize: 32 }}>74</span>
                      <span className="text-xs text-muted-foreground">out of 100</span>
                    </div>
                  </div>
                  <div className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "oklch(0.68 0.22 45 / 0.15)", color: "oklch(0.78 0.18 50)", border: "1px solid oklch(0.68 0.22 45 / 0.3)" }}>Advanced</div>
                </div>

                {/* Mock bars */}
                <div className="space-y-2.5">
                  {[
                    { label: "Strategy Maturity", pct: 80 },
                    { label: "Spend Efficiency", pct: 65 },
                    { label: "Platform Fit", pct: 90 },
                  ].map((b) => (
                    <div key={b.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{b.label}</span>
                        <span className="font-semibold" style={{ color: "oklch(0.68 0.22 45)" }}>{Math.round(b.pct / 5)}/20</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "oklch(0.32 0.016 240)" }}>
                        <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: "linear-gradient(90deg, oklch(0.68 0.22 45), oklch(0.68 0.22 45 / 0.6))" }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mock top rec */}
                <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "oklch(0.22 0.018 240)", border: "1px solid oklch(0.68 0.22 45 / 0.25)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black text-white" style={{ background: "oklch(0.68 0.22 45)" }}>1</div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">Social Native</p>
                    <p className="text-xs text-muted-foreground truncate">Best Fit for your brand</p>
                  </div>
                </div>

                <p className="text-center text-xs text-muted-foreground">Your results appear here in seconds</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border z-10 shadow-sm" style={{ background: "oklch(0.24 0.018 240)" }}>
        <div className="container">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab("score")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
                activeTab === "score"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Creator Score
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
                activeTab === "quiz"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              Strategy Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="flex-1">
        {activeTab === "score" ? <CreatorScoreTab /> : <StrategyQuizTab />}
      </main>

      {/* Platforms We Evaluate */}
      <section className="border-t border-border py-12" style={{ background: "oklch(0.20 0.016 240)" }}>
        <div className="container">
          <p className="text-center text-xs font-semibold uppercase tracking-widest mb-8" style={{ color: "oklch(0.68 0.22 45)" }}>
            Platforms We Evaluate
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {PLATFORMS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-200 hover:scale-105"
                style={{
                  background: "oklch(0.28 0.020 240)",
                  borderColor: "oklch(0.44 0.018 240)",
                  color: "oklch(0.80 0.005 60)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.68 0.22 45 / 0.6)";
                  (e.currentTarget as HTMLElement).style.color = "oklch(0.68 0.22 45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.44 0.018 240)";
                  (e.currentTarget as HTMLElement).style.color = "oklch(0.80 0.005 60)";
                }}
              >
                {p.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-border py-16" style={{ background: "oklch(0.20 0.016 240)" }}>
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.68 0.22 45)" }}>
                Frequently Asked Questions
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                How the Creator Score Works
              </h2>
              <p className="text-muted-foreground mt-3 text-sm md:text-base">
                Straight answers on what we score, how the AI works, and why we built this.
              </p>
            </div>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8" style={{ background: "oklch(0.18 0.016 240)" }}>
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.68 0.22 45), oklch(0.55 0.22 40))" }}>
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground">
                © 2026 Branded Content Creator Score, AI-powered influencer strategy intelligence
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              {PLATFORMS.map((p) => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {p.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
