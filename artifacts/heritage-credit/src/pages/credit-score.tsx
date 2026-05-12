import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ShieldCheck, RefreshCw, TrendingUp, AlertCircle, CheckCircle2, Info,
  CreditCard, Clock, Percent, Activity, Star,
} from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SCORE = 742;
const SCORE_DATE = "May 10, 2026";

const HISTORY = [
  { month: "Jun '25", score: 718 },
  { month: "Jul '25", score: 724 },
  { month: "Aug '25", score: 720 },
  { month: "Sep '25", score: 728 },
  { month: "Oct '25", score: 731 },
  { month: "Nov '25", score: 737 },
  { month: "Dec '25", score: 733 },
  { month: "Jan '26", score: 738 },
  { month: "Feb '26", score: 736 },
  { month: "Mar '26", score: 740 },
  { month: "Apr '26", score: 741 },
  { month: "May '26", score: 742 },
];

const FACTORS = [
  {
    icon: CheckCircle2,
    label: "Payment History",
    weight: "35%",
    value: 96,
    status: "Excellent",
    color: "text-green-600",
    detail: "No missed payments in the past 7 years.",
  },
  {
    icon: Percent,
    label: "Credit Utilization",
    weight: "30%",
    value: 72,
    status: "Good",
    color: "text-blue-600",
    detail: "Using 28% of available revolving credit.",
  },
  {
    icon: Clock,
    label: "Length of Credit History",
    weight: "15%",
    value: 80,
    status: "Good",
    color: "text-blue-600",
    detail: "Average account age: 8 years, 4 months.",
  },
  {
    icon: Activity,
    label: "Credit Mix",
    weight: "10%",
    value: 90,
    status: "Excellent",
    color: "text-green-600",
    detail: "Mix of credit card, auto loan, and mortgage.",
  },
  {
    icon: Star,
    label: "New Credit",
    weight: "10%",
    value: 65,
    status: "Fair",
    color: "text-yellow-600",
    detail: "1 hard inquiry in the last 12 months.",
  },
];

const ALERTS = [
  { type: "good", text: "No new collections or derogatory marks found." },
  { type: "good", text: "All accounts current — no late payments." },
  { type: "warn", text: "1 hard inquiry detected from Mar 2026." },
];

function ScoreGauge({ score }: { score: number }) {
  const pct = ((score - 300) / (850 - 300)) * 100;
  let tier = "Poor";
  let tierColor = "#ef4444";
  if (score >= 800) { tier = "Exceptional"; tierColor = "#16a34a"; }
  else if (score >= 740) { tier = "Very Good"; tierColor = "#22c55e"; }
  else if (score >= 670) { tier = "Good"; tierColor = "#84cc16"; }
  else if (score >= 580) { tier = "Fair"; tierColor = "#f59e0b"; }

  const r = 80;
  const cx = 100;
  const cy = 100;
  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle;
  const fillArc = (pct / 100) * totalArc;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number, radius: number) => {
    const s = toRad(start);
    const e = toRad(end);
    const x1 = cx + radius * Math.cos(s);
    const y1 = cy + radius * Math.sin(s);
    const x2 = cx + radius * Math.cos(e);
    const y2 = cy + radius * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="140" viewBox="0 0 200 140">
        <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
        <path d={arcPath(startAngle, startAngle + fillArc, r)} fill="none" stroke={tierColor} strokeWidth="14" strokeLinecap="round" />
        <text x="100" y="95" textAnchor="middle" fontSize="32" fontWeight="700" fill="#1e293b">{score}</text>
        <text x="100" y="115" textAnchor="middle" fontSize="12" fill="#64748b">of 850</text>
      </svg>
      <div className="text-center -mt-2">
        <span className="text-lg font-semibold" style={{ color: tierColor }}>{tier}</span>
        <p className="text-xs text-muted-foreground mt-0.5">FICO® Score 8 · Updated {SCORE_DATE}</p>
      </div>
      <div className="flex gap-1 mt-3 text-xs text-muted-foreground">
        <span>300 Poor</span>
        <span className="mx-2">·</span>
        <span>580 Fair</span>
        <span className="mx-2">·</span>
        <span>670 Good</span>
        <span className="mx-2">·</span>
        <span>850 Exceptional</span>
      </div>
    </div>
  );
}

export default function CreditScore() {
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1800);
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Credit Score</h1>
          <p className="text-muted-foreground mt-1">Monitoring provided free by Heritage Bank.</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh Score"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Your FICO® Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ScoreGauge score={SCORE} />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> 12-Month History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={HISTORY} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[700, 760]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v: number) => [v, "Score"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="score" stroke="#1A5C38" strokeWidth={2} dot={{ r: 3, fill: "#1A5C38" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border bg-white">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Score Factors
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-5">
          {FACTORS.map((f) => (
            <div key={f.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <f.icon className={`w-4 h-4 ${f.color}`} />
                  <span className="font-medium text-foreground">{f.label}</span>
                  <UITooltip>
                    <TooltipTrigger>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">{f.detail}</TooltipContent>
                  </UITooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{f.weight} weight</Badge>
                  <span className={`text-xs font-semibold ${f.color}`}>{f.status}</span>
                </div>
              </div>
              <Progress value={f.value} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border bg-white">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" /> Credit Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {ALERTS.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${a.type === "good" ? "bg-green-50 border border-green-100" : "bg-yellow-50 border border-yellow-100"}`}>
              {a.type === "good"
                ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />}
              <p className="text-sm text-foreground">{a.text}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" />
            Score provided by Equifax. Monitoring updates monthly. This score is for informational purposes only and may differ from scores used by lenders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
