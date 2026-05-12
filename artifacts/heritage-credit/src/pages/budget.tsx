import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useGetTransactions } from "@workspace/api-client-react";
import {
  ShoppingCart, Coffee, Car, Zap, Home, CreditCard, Utensils,
  Edit3, Save, AlertTriangle, CheckCircle2, DollarSign, PieChart,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Groceries: ShoppingCart, Dining: Coffee, Gas: Car, Utilities: Zap,
  Shopping: ShoppingCart, Housing: Home, Payment: CreditCard, Food: Utensils,
};

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: "#3b82f6", Dining: "#f59e0b", Gas: "#ef4444", Utilities: "#f97316",
  Shopping: "#8b5cf6", Housing: "#0ea5e9", Payment: "#ec4899", Other: "#94a3b8",
};

const DEFAULT_BUDGETS: Record<string, number> = {
  Groceries: 600,
  Dining: 300,
  Gas: 200,
  Utilities: 250,
  Shopping: 400,
  Housing: 1800,
  Payment: 500,
  Other: 200,
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function getStatus(spent: number, budget: number) {
  const pct = (spent / budget) * 100;
  if (pct >= 100) return { label: "Over Budget", color: "text-red-600", bg: "bg-red-50 border-red-100", icon: AlertTriangle, iconColor: "text-red-500" };
  if (pct >= 80) return { label: "Near Limit", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-100", icon: AlertTriangle, iconColor: "text-yellow-500" };
  return { label: "On Track", color: "text-green-600", bg: "bg-green-50 border-green-100", icon: CheckCircle2, iconColor: "text-green-500" };
}

function getProgressColor(pct: number) {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80) return "bg-yellow-500";
  return "bg-primary";
}

export default function Budget() {
  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const { data: transactions } = useGetTransactions({});

  const [budgets, setBudgets] = useState<Record<string, number>>(DEFAULT_BUDGETS);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const spent: Record<string, number> = {};
  (transactions ?? []).forEach(tx => {
    if (tx.type !== "debit") return;
    const txMonth = tx.date.substring(0, 7);
    if (txMonth !== monthKey) return;
    const cat = tx.category ?? "Other";
    spent[cat] = (spent[cat] ?? 0) + Number(tx.amount);
  });

  const categories = Object.keys(budgets);
  const totalBudget = categories.reduce((s, c) => s + budgets[c], 0);
  const totalSpent = categories.reduce((s, c) => s + (spent[c] ?? 0), 0);
  const totalPct = Math.min((totalSpent / totalBudget) * 100, 100);

  function startEdit(cat: string) {
    setEditing(cat);
    setEditVal(String(budgets[cat]));
  }

  function saveEdit(cat: string) {
    const val = Number(editVal);
    if (val > 0) setBudgets(prev => ({ ...prev, [cat]: val }));
    setEditing(null);
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary">Budget Manager</h1>
        <p className="text-muted-foreground mt-1">Set monthly limits and track your spending — {monthLabel}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-border bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Budget</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{fmt(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Spent This Month</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{fmt(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border bg-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</span>
            </div>
            <p className={`text-2xl font-bold ${totalSpent > totalBudget ? "text-red-600" : "text-green-600"}`}>{fmt(Math.max(totalBudget - totalSpent, 0))}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border bg-white">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Overall Budget</span>
            <span className="text-sm font-normal text-muted-foreground">{totalPct.toFixed(0)}% used</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${getProgressColor(totalPct)}`} style={{ width: `${totalPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>$0</span>
            <span>{fmt(totalBudget)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border bg-white">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Category Budgets</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-5">
          {categories.map(cat => {
            const Icon = CATEGORY_ICONS[cat] ?? DollarSign;
            const catSpent = spent[cat] ?? 0;
            const budget = budgets[cat];
            const pct = Math.min((catSpent / budget) * 100, 100);
            const status = getStatus(catSpent, budget);
            const StatusIcon = status.icon;

            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: (CATEGORY_COLORS[cat] ?? "#94a3b8") + "20" }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: CATEGORY_COLORS[cat] ?? "#94a3b8" }} />
                    </div>
                    <span className="font-medium text-foreground">{cat}</span>
                    <StatusIcon className={`w-3.5 h-3.5 ${status.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {editing === cat ? (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-xs">$</span>
                        <Input
                          type="number"
                          className="w-24 h-7 text-xs"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveEdit(cat); if (e.key === "Escape") setEditing(null); }}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveEdit(cat)}>
                          <Save className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-muted-foreground text-xs">{fmt(catSpent)} / {fmt(budget)}</span>
                        <Badge variant="outline" className={`text-xs ${status.color}`}>{status.label}</Badge>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(cat)}>
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">Budget resets on the 1st of each month. Click the pencil icon to edit any limit.</p>
    </div>
  );
}
