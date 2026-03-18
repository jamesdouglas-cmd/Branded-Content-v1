import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, Trophy, TrendingUp, Star, ChevronRight, RotateCcw, Info, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type ScoreBreakdownItem = { score: number; label: string; insight: string };
type Recommendation = { platformKey: string; rank: number; reason: string; name: string; url: string; description: string };
type ScoreResult = {
  score: number;
  scoreLabel: string;
  reportSummary: string;
  scoreBreakdown: Record<string, ScoreBreakdownItem>;
  topRecommendations: Recommendation[];
};

// Platform metadata for richer cards
const PLATFORM_META: Record<string, { bestFor: string; tag: string; tagColor: string }> = {
  socialNative: { bestFor: "Enterprise UGC & content licensing at scale", tag: "UGC at Scale", tagColor: "oklch(0.68 0.22 45)" },
  grin:         { bestFor: "DTC brands managing creator relationships", tag: "DTC & Relationships", tagColor: "oklch(0.55 0.20 200)" },
  creatoriq:    { bestFor: "Enterprise analytics & brand safety", tag: "Enterprise Analytics", tagColor: "oklch(0.45 0.18 270)" },
  aspire:       { bestFor: "SMB & mid-market creator commerce", tag: "Creator Commerce", tagColor: "oklch(0.50 0.18 150)" },
  upfluence:    { bestFor: "E-commerce & Shopify-integrated brands", tag: "E-commerce", tagColor: "oklch(0.55 0.18 320)" },
  bazaarvoice:  { bestFor: "Retail brands needing reviews & social proof", tag: "Reviews & UGC", tagColor: "oklch(0.50 0.16 60)" },
  modash:       { bestFor: "Nano & micro influencer discovery", tag: "Micro & Nano", tagColor: "oklch(0.48 0.18 240)" },
};

const RANK_LABELS = ["Best Fit", "Strong Fit", "Good Fit"];
const RANK_STYLES = [
  { border: "oklch(0.68 0.22 45)", bg: "oklch(0.68 0.22 45 / 0.12)", text: "oklch(0.78 0.18 50)", num: "1" },
  { border: "oklch(0.65 0.012 240)", bg: "oklch(0.65 0.012 240 / 0.10)", text: "oklch(0.80 0.008 240)", num: "2" },
  { border: "oklch(0.55 0.012 240)", bg: "oklch(0.55 0.012 240 / 0.08)", text: "oklch(0.72 0.008 240)", num: "3" },
];

const SCORE_LABEL_COLOR: Record<string, string> = {
  Emerging:   "oklch(0.70 0.18 30)",
  Developing: "oklch(0.72 0.16 60)",
  Established:"oklch(0.60 0.18 200)",
  Advanced:   "oklch(0.55 0.20 270)",
  Elite:      "oklch(0.68 0.22 45)",
};

// ─── Animated Arc Gauge ──────────────────────────────────────────────────────
function ScoreGauge({ score, label }: { score: number; label: string }) {
  const [displayed, setDisplayed] = useState(0);
  const [animated, setAnimated] = useState(false);
  const color = SCORE_LABEL_COLOR[label] ?? "oklch(0.55 0.20 270)";

  // Arc geometry — 240° sweep starting from bottom-left
  const R = 54;
  const cx = 60; const cy = 65;
  const startAngle = 210; // degrees
  const sweepDeg = 240;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcX = (a: number) => cx + R * Math.cos(toRad(a));
  const arcY = (a: number) => cy + R * Math.sin(toRad(a));

  const endAngle = startAngle + sweepDeg * (animated ? displayed / 100 : 0);
  const largeArc = sweepDeg * (animated ? displayed / 100 : 0) > 180 ? 1 : 0;

  const trackEnd = startAngle + sweepDeg;
  const trackPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${R} ${R} 0 1 1 ${arcX(trackEnd)} ${arcY(trackEnd)}`;
  const fillPath = animated && displayed > 0
    ? `M ${arcX(startAngle)} ${arcY(startAngle)} A ${R} ${R} 0 ${largeArc} 1 ${arcX(endAngle)} ${arcY(endAngle)}`
    : "";

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    let start: number | null = null;
    const duration = 1200;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [animated, score]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 200, height: 170 }}>
        <svg viewBox="0 0 120 110" width="200" height="170">
          {/* Track */}
          <path d={trackPath} fill="none" stroke="oklch(0.35 0.015 240)" strokeWidth="9" strokeLinecap="round" />
          {/* Fill */}
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "none" }}
            />
          )}
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const a = startAngle + sweepDeg * (pct / 100);
            const inner = R - 7;
            const outer = R - 1;
            return (
              <line
                key={pct}
                x1={cx + inner * Math.cos(toRad(a))} y1={cy + inner * Math.sin(toRad(a))}
                x2={cx + outer * Math.cos(toRad(a))} y2={cy + outer * Math.sin(toRad(a))}
                stroke="oklch(0.45 0.015 240)" strokeWidth="1.5" strokeLinecap="round"
              />
            );
          })}
        </svg>
        {/* Center number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: 8 }}>
          <span className="font-bold text-foreground leading-none" style={{ fontSize: 42 }}>{displayed}</span>
          <span className="text-xs text-muted-foreground mt-1">out of 100</span>
        </div>
      </div>
      {/* Label pill */}
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold"
        style={{ background: `${color.replace(")", " / 0.15)")}`, color, border: `1px solid ${color.replace(")", " / 0.35)")}` }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Animated Category Bar ───────────────────────────────────────────────────
function BreakdownBar({ item, delay = 0 }: { item: ScoreBreakdownItem; delay?: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const pct = Math.round((item.score / 20) * 100);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTimeout(() => setWidth(pct), delay); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pct, delay]);

  const barColor = pct >= 75 ? "oklch(0.68 0.22 45)" : pct >= 50 ? "oklch(0.55 0.20 200)" : "oklch(0.60 0.18 30)";

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-foreground">{item.label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>{item.score}<span className="text-muted-foreground font-normal text-xs">/20</span></span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "oklch(0.32 0.016 240)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${barColor}, ${barColor.replace(")", " / 0.7)")})`,
            boxShadow: `0 0 8px ${barColor.replace(")", " / 0.4)")}`,
            transition: "width 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{item.insight}</p>
    </div>
  );
}

// ─── Platform Recommendation Card ────────────────────────────────────────────
function PlatformCard({ rec, rank }: { rec: Recommendation; rank: number }) {
  const style = RANK_STYLES[rank] ?? RANK_STYLES[2];
  const meta = PLATFORM_META[rec.platformKey] ?? { bestFor: rec.description, tag: "Recommended", tagColor: "oklch(0.68 0.22 45)" };
  const isTop = rank === 0;

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1"
      style={{
        background: "oklch(0.26 0.018 240)",
        border: `1.5px solid ${style.border.replace(")", " / 0.35)")}`,
        boxShadow: isTop ? `0 0 24px ${style.border.replace(")", " / 0.15)")}` : undefined,
      }}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: style.border }} />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Rank badge + tag */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: style.bg, color: style.text, border: `1px solid ${style.border.replace(")", " / 0.3)")}` }}
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black"
              style={{ background: style.border, color: "white" }}
            >
              {style.num}
            </span>
            {RANK_LABELS[rank]}
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
            style={{ background: `${meta.tagColor.replace(")", " / 0.12)")}`, color: meta.tagColor }}
          >
            {meta.tag}
          </span>
        </div>

        {/* Platform name */}
        <div>
          <a
            href={rec.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 font-bold text-xl text-foreground hover:text-primary transition-colors"
          >
            {rec.name}
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </a>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{rec.description}</p>
        </div>

        {/* Best For */}
        <div className="rounded-lg px-3 py-2.5" style={{ background: "oklch(0.22 0.016 240)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: meta.tagColor }}>Best For</p>
          <p className="text-xs text-foreground leading-snug">{meta.bestFor}</p>
        </div>

        {/* Why this platform */}
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{rec.reason}</p>

        {/* CTA */}
        <a
          href={rec.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{
            background: isTop ? style.border : "oklch(0.32 0.018 240)",
            color: isTop ? "white" : "oklch(0.85 0.008 240)",
            border: isTop ? "none" : `1px solid ${style.border.replace(")", " / 0.3)")}`,
          }}
        >
          Visit {rec.name} <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreatorScoreTab() {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    companySize: "" as "1-50" | "51-200" | "201-1000" | "1001-5000" | "5000+",
    industry: "",
    annualRevenue: "",
    estimatedCreatorSpend: "",
    currentPlatforms: "",
    brandDescription: "",
    creatorGoals: "",
    contactEmail: "",
    youtubeHandle: "",
    tiktokHandle: "",
    instagramHandle: "",
    instagramFollowers: "",
    instagramEngagementRate: "",
  });

  const analyze = trpc.score.analyze.useMutation({
    onSuccess: (data) => setResult(data),
    onError: (err) => toast.error(`Analysis failed: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.companySize || !form.industry) {
      toast.error("Please fill in the required fields.");
      return;
    }
    analyze.mutate(form);
  };

  // ── Results View ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="container py-10">
        <div className="max-w-4xl mx-auto space-y-10">

          {/* Header */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.68 0.22 45)" }}>Creator Score Report</p>
            <h2 className="text-3xl font-bold text-foreground">
              {form.companyName}
            </h2>
            <p className="text-muted-foreground">Here's how your creator marketing strategy measures up against industry benchmarks.</p>
          </div>

          {/* Score + Summary — two column */}
          <div className="grid md:grid-cols-5 gap-6 items-start">
            {/* Gauge — takes 2 cols */}
            <div
              className="md:col-span-2 rounded-2xl flex flex-col items-center justify-center py-10 gap-2"
              style={{ background: "oklch(0.26 0.018 240)", border: "1.5px solid oklch(0.38 0.018 240)" }}
            >
              <ScoreGauge score={result.score} label={result.scoreLabel} />
            </div>

            {/* Summary — takes 3 cols */}
            <div
              className="md:col-span-3 rounded-2xl p-6 flex flex-col gap-4 h-full"
              style={{ background: "oklch(0.26 0.018 240)", border: "1.5px solid oklch(0.38 0.018 240)" }}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-foreground uppercase tracking-wide">Executive Summary</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed flex-1">{result.reportSummary}</p>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">Score generated by AI benchmarking against industry data. Results are in beta and improve with more inputs.</p>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Score Breakdown</h3>
            </div>
            <div
              className="rounded-2xl p-6"
              style={{ background: "oklch(0.26 0.018 240)", border: "1.5px solid oklch(0.38 0.018 240)" }}
            >
              <div className="grid md:grid-cols-2 gap-6">
                {Object.values(result.scoreBreakdown).map((item, i) => (
                  <BreakdownBar key={item.label} item={item} delay={i * 100} />
                ))}
              </div>
            </div>
          </div>

          {/* Top 3 Recommendations */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Top 3 Platform Recommendations</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {result.topRecommendations.map((rec, i) => (
                <PlatformCard key={rec.platformKey} rec={rec} rank={i} />
              ))}
            </div>
          </div>

          {/* All Platforms */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "oklch(0.24 0.016 240)", border: "1px solid oklch(0.36 0.016 240)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">All Platforms We Evaluate</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Social Native", url: "https://www.socialnative.com" },
                { name: "Grin", url: "https://grin.co" },
                { name: "CreatorIQ", url: "https://creatoriq.com" },
                { name: "Aspire", url: "https://aspire.io" },
                { name: "Upfluence", url: "https://www.upfluence.com" },
                { name: "Bazaarvoice", url: "https://www.bazaarvoice.com" },
                { name: "Modash", url: "https://www.modash.io" },
              ].map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-primary transition-all"
                  style={{ background: "oklch(0.28 0.018 240)", border: "1px solid oklch(0.40 0.016 240)" }}
                >
                  {p.name} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setResult(null)}
              className="flex items-center gap-2 px-6"
            >
              <RotateCcw className="w-4 h-4" />
              Analyze Another Brand
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form View ───────────────────────────────────────────────────────────────
  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Get Your Creator Score</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Our AI analyzes your brand's creator marketing footprint against your company size and industry benchmarks to generate a personalized score and platform recommendations.
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: "oklch(0.26 0.018 240)", border: "1.5px solid oklch(0.40 0.018 240)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Company Name <span className="text-destructive">*</span></Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Acme Brands Inc."
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry <span className="text-destructive">*</span></Label>
                <Input
                  id="industry"
                  placeholder="e.g. Beauty, CPG, Fashion, Tech"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Company Size <span className="text-destructive">*</span></Label>
                <Select
                  value={form.companySize}
                  onValueChange={(v) => setForm({ ...form, companySize: v as typeof form.companySize })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-50">1–50 employees</SelectItem>
                    <SelectItem value="51-200">51–200 employees</SelectItem>
                    <SelectItem value="201-1000">201–1,000 employees</SelectItem>
                    <SelectItem value="1001-5000">1,001–5,000 employees</SelectItem>
                    <SelectItem value="5000+">5,000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="annualRevenue">Annual Revenue (optional)</Label>
                <Select
                  value={form.annualRevenue}
                  onValueChange={(v) => setForm({ ...form, annualRevenue: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select revenue range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-1m">Under $1M</SelectItem>
                    <SelectItem value="1m-10m">$1M – $10M</SelectItem>
                    <SelectItem value="10m-50m">$10M – $50M</SelectItem>
                    <SelectItem value="50m-250m">$50M – $250M</SelectItem>
                    <SelectItem value="250m-1b">$250M – $1B</SelectItem>
                    <SelectItem value="over-1b">Over $1B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="estimatedCreatorSpend">Estimated Annual Creator Spend</Label>
                <Select
                  value={form.estimatedCreatorSpend}
                  onValueChange={(v) => setForm({ ...form, estimatedCreatorSpend: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select spend range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No current spend</SelectItem>
                    <SelectItem value="under-50k">Under $50K</SelectItem>
                    <SelectItem value="50k-250k">$50K – $250K</SelectItem>
                    <SelectItem value="250k-1m">$250K – $1M</SelectItem>
                    <SelectItem value="1m-5m">$1M – $5M</SelectItem>
                    <SelectItem value="over-5m">Over $5M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail">Contact Email (optional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="you@company.com"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
              </div>
            </div>

            {/* Social Media Handles */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pt-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Social Media Handles</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <p className="text-xs text-muted-foreground -mt-1">(optional, but will return a more accurate score)</p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="youtubeHandle">YouTube Handle</Label>
                  <Input
                    id="youtubeHandle"
                    placeholder="@YourBrand"
                    value={form.youtubeHandle}
                    onChange={(e) => setForm({ ...form, youtubeHandle: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tiktokHandle">TikTok Handle</Label>
                  <Input
                    id="tiktokHandle"
                    placeholder="@YourBrand"
                    value={form.tiktokHandle}
                    onChange={(e) => setForm({ ...form, tiktokHandle: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="instagramHandle">Instagram Handle</Label>
                  <Input
                    id="instagramHandle"
                    placeholder="@YourBrand"
                    value={form.instagramHandle}
                    onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                  />
                </div>
              </div>
              <div className="ml-4 pl-4 border-l-2 border-border grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="instagramFollowers" className="text-muted-foreground">Instagram Follower Count (est.)</Label>
                  <Input
                    id="instagramFollowers"
                    placeholder="e.g. 250000"
                    value={form.instagramFollowers}
                    onChange={(e) => setForm({ ...form, instagramFollowers: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="instagramEngagementRate" className="text-muted-foreground">Instagram Engagement Rate (est.)</Label>
                  <Input
                    id="instagramEngagementRate"
                    placeholder="e.g. 3.2%"
                    value={form.instagramEngagementRate}
                    onChange={(e) => setForm({ ...form, instagramEngagementRate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currentPlatforms">Current Platforms / Tools Used</Label>
              <Input
                id="currentPlatforms"
                placeholder="e.g. CreatorIQ, Social Native, manual outreach, none"
                value={form.currentPlatforms}
                onChange={(e) => setForm({ ...form, currentPlatforms: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brandDescription">Brand Description</Label>
              <Textarea
                id="brandDescription"
                placeholder="Briefly describe your brand, products, and target audience..."
                rows={3}
                value={form.brandDescription}
                onChange={(e) => setForm({ ...form, brandDescription: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="creatorGoals">Creator Marketing Goals</Label>
              <Textarea
                id="creatorGoals"
                placeholder="What are you trying to achieve with creator marketing? (e.g. brand awareness, UGC content, conversions, community building)"
                rows={3}
                value={form.creatorGoals}
                onChange={(e) => setForm({ ...form, creatorGoals: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold text-white rounded-xl"
              style={{ background: "linear-gradient(135deg, oklch(0.68 0.22 45), oklch(0.55 0.22 40))" }}
              disabled={analyze.isPending}
            >
              {analyze.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing your strategy...</>
              ) : (
                <>Get My Creator Score <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>

            {analyze.isPending && (
              <p className="text-center text-xs text-muted-foreground animate-pulse">
                Our AI is evaluating your brand's creator marketing footprint. This takes 10–20 seconds...
              </p>
            )}
          </form>
        </div>

        {/* Platform Preview */}
        <div className="mt-8 space-y-3">
          <p className="text-xs text-muted-foreground text-center font-medium uppercase tracking-wide">Platforms we evaluate</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { name: "Social Native", url: "https://www.socialnative.com" },
              { name: "Grin", url: "https://grin.co" },
              { name: "CreatorIQ", url: "https://creatoriq.com" },
              { name: "Aspire", url: "https://aspire.io" },
              { name: "Upfluence", url: "https://www.upfluence.com" },
              { name: "Bazaarvoice", url: "https://www.bazaarvoice.com" },
              { name: "Modash", url: "https://www.modash.io" },
            ].map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-primary transition-all"
                style={{ background: "oklch(0.28 0.018 240)", border: "1px solid oklch(0.40 0.016 240)" }}
              >
                {p.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
