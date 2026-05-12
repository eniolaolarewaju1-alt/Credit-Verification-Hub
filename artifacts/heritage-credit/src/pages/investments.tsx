import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Briefcase, Shield, BarChart3, ExternalLink, Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
function fmtPct(n: number, sign = true) {
  return `${sign && n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

const PERF_HISTORY = [
  { month: "Jun '25", roth: 48200, brokerage: 22100 },
  { month: "Aug '25", roth: 49800, brokerage: 23400 },
  { month: "Oct '25", roth: 51200, brokerage: 24100 },
  { month: "Dec '25", roth: 53800, brokerage: 25600 },
  { month: "Feb '26", roth: 55100, brokerage: 26900 },
  { month: "Apr '26", roth: 57430, brokerage: 28314 },
  { month: "May '26", roth: 57430, brokerage: 28314 },
];

const ALLOCATION = [
  { name: "US Stocks", value: 52, color: "#1A5C38" },
  { name: "Intl Stocks", value: 18, color: "#3b82f6" },
  { name: "Bonds", value: 20, color: "#22c55e" },
  { name: "REITs", value: 6, color: "#f59e0b" },
  { name: "Cash", value: 4, color: "#94a3b8" },
];

const HOLDINGS = [
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", shares: 120.42, price: 248.30, value: 29908.67, gain: 8.42, account: "Roth IRA" },
  { symbol: "VXUS", name: "Vanguard Total Intl Stock ETF", shares: 310.10, price: 61.84, value: 19175.78, gain: 4.21, account: "Roth IRA" },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", shares: 105.00, price: 75.14, value: 7889.70, gain: -1.02, account: "Roth IRA" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", shares: 42.50, price: 513.20, value: 21811.00, gain: 11.34, account: "Brokerage" },
  { symbol: "SCHD", name: "Schwab US Dividend Equity ETF", shares: 95.00, price: 68.12, value: 6471.40, gain: 3.88, account: "Brokerage" },
  { symbol: "SGOV", name: "iShares 0-3 Month Treasury Bond", shares: 32.00, price: 100.50, value: 3216.00, gain: 0.50, account: "Brokerage" },
];

const ACCOUNTS = [
  {
    id: "roth",
    name: "Roth IRA",
    icon: Shield,
    value: 57430.15,
    change: 2.64,
    changeAmt: 1480.15,
    ytdReturn: 6.18,
    contributions2026: 7000,
    limit2026: 7000,
    desc: "Tax-free growth. Contributions made with after-tax dollars.",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-100",
  },
  {
    id: "brokerage",
    name: "Taxable Brokerage",
    icon: Briefcase,
    value: 28314.10,
    change: -0.83,
    changeAmt: -236.44,
    ytdReturn: 9.22,
    contributions2026: null,
    limit2026: null,
    desc: "Flexible investing with no contribution limits.",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-100",
  },
];

const totalValue = ACCOUNTS.reduce((s, a) => s + a.value, 0);

export default function Investments() {
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Investments & Retirement</h1>
          <p className="text-muted-foreground mt-1">Managed through Heritage Wealth Management — powered by Vanguard.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <ExternalLink className="w-4 h-4" /> Open Full Platform
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-border bg-white sm:col-span-1">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-foreground">{fmt(totalValue)}</p>
            <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />+7.41% YTD</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border bg-white sm:col-span-2">
          <CardContent className="pt-4 h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PERF_HISTORY} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [fmt(v)]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="roth" stroke="#1A5C38" strokeWidth={2} dot={false} name="Roth IRA" />
                <Line type="monotone" dataKey="brokerage" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Brokerage" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ACCOUNTS.map(acct => {
          const Icon = acct.icon;
          const isUp = acct.change >= 0;
          return (
            <Card key={acct.id} className="shadow-sm border-border bg-white">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${acct.color}`} />
                  {acct.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">{fmt(acct.value)}</p>
                  <p className={`text-sm flex items-center gap-1 mt-0.5 ${isUp ? "text-green-600" : "text-red-500"}`}>
                    {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {isUp ? "+" : ""}{fmt(acct.changeAmt)} ({fmtPct(acct.change)}) today · {fmtPct(acct.ytdReturn)} YTD
                  </p>
                </div>
                {acct.contributions2026 !== null && acct.limit2026 !== null && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">2026 Contributions</span>
                      <span className="font-medium">{fmt(acct.contributions2026)} / {fmt(acct.limit2026)}</span>
                    </div>
                    <Progress value={(acct.contributions2026 / acct.limit2026) * 100} className="h-1.5" />
                    <p className="text-xs text-green-600">Annual limit reached!</p>
                  </div>
                )}
                <div className={`p-3 rounded-lg border text-xs ${acct.bg} ${acct.color}`}>
                  <Info className="inline w-3.5 h-3.5 mr-1" />
                  {acct.desc}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ALLOCATION} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                    {ALLOCATION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base">Top Holdings</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2">
              {HOLDINGS.slice(0, 5).map(h => (
                <div key={h.symbol} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-xs bg-slate-100 px-1.5 py-0.5 rounded">{h.symbol}</span>
                      <Badge variant="outline" className="text-xs py-0">{h.account}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5">{h.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-xs">{fmt(h.value)}</p>
                    <p className={`text-xs ${h.gain >= 0 ? "text-green-600" : "text-red-500"}`}>{fmtPct(h.gain)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Investment accounts are not FDIC insured · Not a deposit · May lose value · Not insured by any federal government agency.
        Data shown is for informational purposes. Prices as of market close May 12, 2026.
      </p>
    </div>
  );
}
