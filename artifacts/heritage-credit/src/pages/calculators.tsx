import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home as HomeIcon, Car, TrendingUp, PiggyBank, Calculator } from "lucide-react";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: decimals });
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between py-2.5 border-b border-border last:border-0 text-sm ${highlight ? "font-semibold" : ""}`}>
      <span className={highlight ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={highlight ? "text-primary text-base" : "text-foreground"}>{value}</span>
    </div>
  );
}

function MortgageCalc() {
  const [price, setPrice] = useState("350000");
  const [down, setDown] = useState("70000");
  const [rate, setRate] = useState("6.85");
  const [term, setTerm] = useState("30");
  const [result, setResult] = useState<null | { monthly: number; totalPaid: number; totalInterest: number; loanAmt: number }>(null);

  function calculate() {
    const P = Number(price) - Number(down);
    const r = Number(rate) / 100 / 12;
    const n = Number(term) * 12;
    const monthly = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPaid = monthly * n;
    setResult({ monthly, totalPaid, totalInterest: totalPaid - P, loanAmt: P });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Home Price</Label>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" className="pl-6" value={price} onChange={e => setPrice(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>Down Payment</Label>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" className="pl-6" value={down} onChange={e => setDown(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>Interest Rate (%)</Label>
          <Input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Loan Term</Label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 years</SelectItem>
              <SelectItem value="15">15 years</SelectItem>
              <SelectItem value="20">20 years</SelectItem>
              <SelectItem value="30">30 years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={calculate} className="w-full bg-primary hover:bg-primary/90 gap-2">
        <Calculator className="w-4 h-4" /> Calculate
      </Button>
      {result && (
        <div className="bg-slate-50 rounded-xl border border-border p-4 space-y-0.5">
          <ResultRow label="Loan Amount" value={fmt(result.loanAmt)} />
          <ResultRow label="Monthly Payment" value={fmt(result.monthly)} highlight />
          <ResultRow label="Total Interest Paid" value={fmt(result.totalInterest)} />
          <ResultRow label="Total Amount Paid" value={fmt(result.totalPaid)} />
          <ResultRow label="Down Payment %" value={`${((Number(down) / Number(price)) * 100).toFixed(1)}%`} />
        </div>
      )}
      <p className="text-xs text-muted-foreground">Principal and interest only. Does not include property taxes, homeowners insurance, or PMI.</p>
    </div>
  );
}

function AutoCalc() {
  const [loanAmt, setLoanAmt] = useState("28000");
  const [rate, setRate] = useState("5.99");
  const [term, setTerm] = useState("60");
  const [result, setResult] = useState<null | { monthly: number; totalPaid: number; totalInterest: number }>(null);

  function calculate() {
    const P = Number(loanAmt);
    const r = Number(rate) / 100 / 12;
    const n = Number(term);
    const monthly = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPaid = monthly * n;
    setResult({ monthly, totalPaid, totalInterest: totalPaid - P });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Loan Amount</Label>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" className="pl-6" value={loanAmt} onChange={e => setLoanAmt(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>Interest Rate (%)</Label>
          <Input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Loan Term</Label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24 months (2 yr)</SelectItem>
              <SelectItem value="36">36 months (3 yr)</SelectItem>
              <SelectItem value="48">48 months (4 yr)</SelectItem>
              <SelectItem value="60">60 months (5 yr)</SelectItem>
              <SelectItem value="72">72 months (6 yr)</SelectItem>
              <SelectItem value="84">84 months (7 yr)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={calculate} className="w-full bg-primary hover:bg-primary/90 gap-2">
        <Calculator className="w-4 h-4" /> Calculate
      </Button>
      {result && (
        <div className="bg-slate-50 rounded-xl border border-border p-4">
          <ResultRow label="Monthly Payment" value={fmt(result.monthly)} highlight />
          <ResultRow label="Total Interest" value={fmt(result.totalInterest)} />
          <ResultRow label="Total Cost" value={fmt(result.totalPaid)} />
        </div>
      )}
    </div>
  );
}

function SavingsCalc() {
  const [initial, setInitial] = useState("1000");
  const [monthly, setMonthly] = useState("200");
  const [rate, setRate] = useState("4.50");
  const [years, setYears] = useState("10");
  const [result, setResult] = useState<null | { future: number; contributed: number; earned: number }>(null);

  function calculate() {
    const P = Number(initial);
    const PMT = Number(monthly);
    const r = Number(rate) / 100 / 12;
    const n = Number(years) * 12;
    const futureP = P * Math.pow(1 + r, n);
    const futurePMT = PMT * ((Math.pow(1 + r, n) - 1) / r);
    const future = futureP + futurePMT;
    const contributed = P + PMT * n;
    setResult({ future, contributed, earned: future - contributed });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Initial Deposit</Label>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" className="pl-6" value={initial} onChange={e => setInitial(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>Monthly Contribution</Label>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" className="pl-6" value={monthly} onChange={e => setMonthly(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>Annual Interest Rate (%)</Label>
          <Input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Time Period (years)</Label>
          <Input type="number" min="1" max="50" value={years} onChange={e => setYears(e.target.value)} />
        </div>
      </div>
      <Button onClick={calculate} className="w-full bg-primary hover:bg-primary/90 gap-2">
        <Calculator className="w-4 h-4" /> Calculate
      </Button>
      {result && (
        <div className="bg-slate-50 rounded-xl border border-border p-4">
          <ResultRow label="Total Contributed" value={fmt(result.contributed)} />
          <ResultRow label="Interest Earned" value={fmt(result.earned)} />
          <ResultRow label="Future Balance" value={fmt(result.future)} highlight />
        </div>
      )}
    </div>
  );
}

function CDCalc() {
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("4.85");
  const [term, setTerm] = useState("12");
  const [compound, setCompound] = useState("monthly");
  const [result, setResult] = useState<null | { maturity: number; interest: number; apy: number }>(null);

  function calculate() {
    const P = Number(principal);
    const r = Number(rate) / 100;
    const n = compound === "daily" ? 365 : compound === "monthly" ? 12 : compound === "quarterly" ? 4 : 1;
    const t = Number(term) / 12;
    const maturity = P * Math.pow(1 + r / n, n * t);
    const apy = (Math.pow(1 + r / n, n) - 1) * 100;
    setResult({ maturity, interest: maturity - P, apy });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Principal</Label>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" className="pl-6" value={principal} onChange={e => setPrincipal(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>APR (%)</Label>
          <Input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Term (months)</Label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["3","6","9","12","18","24","36","48","60"].map(t => <SelectItem key={t} value={t}>{t} months</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Compounding</Label>
          <Select value={compound} onValueChange={setCompound}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={calculate} className="w-full bg-primary hover:bg-primary/90 gap-2">
        <Calculator className="w-4 h-4" /> Calculate
      </Button>
      {result && (
        <div className="bg-slate-50 rounded-xl border border-border p-4">
          <ResultRow label="APY" value={`${result.apy.toFixed(3)}%`} />
          <ResultRow label="Interest Earned" value={fmt(result.interest)} />
          <ResultRow label="Maturity Value" value={fmt(result.maturity)} highlight />
        </div>
      )}
      <p className="text-xs text-muted-foreground">Contact us to open a CD. Early withdrawal penalties may apply.</p>
    </div>
  );
}

export default function Calculators() {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary">Financial Calculators</h1>
        <p className="text-muted-foreground mt-1">Plan ahead with our free member calculators.</p>
      </div>

      <Card className="shadow-sm border-border bg-white">
        <CardContent className="pt-6">
          <Tabs defaultValue="mortgage">
            <TabsList className="grid grid-cols-4 w-full mb-6">
              <TabsTrigger value="mortgage" className="gap-1.5 text-xs"><HomeIcon className="w-3.5 h-3.5" />Mortgage</TabsTrigger>
              <TabsTrigger value="auto" className="gap-1.5 text-xs"><Car className="w-3.5 h-3.5" />Auto Loan</TabsTrigger>
              <TabsTrigger value="savings" className="gap-1.5 text-xs"><PiggyBank className="w-3.5 h-3.5" />Savings</TabsTrigger>
              <TabsTrigger value="cd" className="gap-1.5 text-xs"><TrendingUp className="w-3.5 h-3.5" />CD</TabsTrigger>
            </TabsList>
            <TabsContent value="mortgage"><MortgageCalc /></TabsContent>
            <TabsContent value="auto"><AutoCalc /></TabsContent>
            <TabsContent value="savings"><SavingsCalc /></TabsContent>
            <TabsContent value="cd"><CDCalc /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border bg-white">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Current Heritage Rates</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "30-yr Mortgage", rate: "6.85%" },
              { label: "15-yr Mortgage", rate: "6.12%" },
              { label: "Auto (New)", rate: "5.49%" },
              { label: "Auto (Used)", rate: "5.99%" },
              { label: "12-mo CD", rate: "4.85% APY" },
              { label: "HY Savings", rate: "4.50% APY" },
            ].map(r => (
              <div key={r.label} className="bg-slate-50 rounded-lg p-3 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-0.5">{r.label}</p>
                <p className="text-lg font-bold text-primary">{r.rate}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Rates as of May 2026. Subject to change. APY assumes no withdrawals. Contact a member advisor for personalized rates.</p>
        </CardContent>
      </Card>
    </div>
  );
}
