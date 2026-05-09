import { useMemo, useState } from "react";
import { useGetTransactions, useGetAccounts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, ShoppingCart, Coffee, Car, Zap, Home, Send, CreditCard, Building2, HelpCircle } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Income: "#16a34a", Groceries: "#3b82f6", Dining: "#f59e0b", Gas: "#ef4444",
  Shopping: "#8b5cf6", Streaming: "#06b6d4", Utilities: "#f97316",
  Transfer: "#64748b", Interest: "#22c55e", Payment: "#ec4899", Other: "#94a3b8",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Groceries: ShoppingCart, Dining: Coffee, Gas: Car,
  Utilities: Zap, Shopping: ShoppingCart, Income: TrendingUp,
  Transfer: Send, Payment: CreditCard, Interest: Building2,
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function getMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getMonthKey(date: string) {
  return date.substring(0, 7); // YYYY-MM
}

export default function Insights() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const { data: accounts } = useGetAccounts();
  const { data: transactions, isLoading } = useGetTransactions(
    selectedAccountId !== "all" ? { accountId: Number(selectedAccountId) } : {}
  );

  const now = new Date();
  const months = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({ year: d.getFullYear(), month: d.getMonth(), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` });
    }
    return result;
  }, []);

  const { monthlyData, categorySpending, topMerchants, netByMonth } = useMemo(() => {
    if (!transactions) return { monthlyData: [], categorySpending: [], topMerchants: [], netByMonth: [] };

    const monthKeys = new Set(months.map(m => m.key));
    const relevant = transactions.filter(t => monthKeys.has(getMonthKey(t.date)));

    const monthly: Record<string, { income: number; spending: number }> = {};
    months.forEach(m => { monthly[m.key] = { income: 0, spending: 0 }; });

    const catMap: Record<string, number> = {};
    const merchantMap: Record<string, number> = {};

    relevant.forEach(t => {
      const mk = getMonthKey(t.date);
      if (!monthly[mk]) return;
      if (t.type === "credit") {
        monthly[mk]!.income += t.amount;
      } else {
        monthly[mk]!.spending += t.amount;
        catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
        if (t.merchant) {
          merchantMap[t.merchant] = (merchantMap[t.merchant] ?? 0) + t.amount;
        }
      }
    });

    const monthlyData = months.map(m => ({
      label: getMonthLabel(m.year, m.month),
      income: Math.round(monthly[m.key]!.income * 100) / 100,
      spending: Math.round(monthly[m.key]!.spending * 100) / 100,
    }));

    const categorySpending = Object.entries(catMap)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const topMerchants = Object.entries(merchantMap)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const netByMonth = monthlyData.map(m => ({
      label: m.label,
      net: Math.round((m.income - m.spending) * 100) / 100,
    }));

    return { monthlyData, categorySpending, topMerchants, netByMonth };
  }, [transactions, months]);

  const currentMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const spendingChange = currentMonth && prevMonth && prevMonth.spending > 0
    ? ((currentMonth.spending - prevMonth.spending) / prevMonth.spending) * 100
    : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary" data-testid="text-page-title">Spending Insights</h1>
          <p className="text-sm text-gray-400 mt-1">A breakdown of your income and spending over the last 6 months.</p>
        </div>
        <div className="w-56">
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts?.map(a => (
                <SelectItem key={a.id} value={String(a.id)}>{a.nickname} (...{a.maskedNumber})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : currentMonth && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-border bg-white">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">This Month Income</p>
              <p className="text-xl font-bold text-green-600">{fmt(currentMonth.income)}</p>
              {prevMonth && <p className="text-xs text-gray-400 mt-1">vs {fmt(prevMonth.income)} last month</p>}
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border bg-white">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">This Month Spending</p>
              <p className="text-xl font-bold text-red-500">{fmt(currentMonth.spending)}</p>
              {spendingChange !== null && (
                <div className="flex items-center gap-1 mt-1">
                  {spendingChange > 0 ? <TrendingUp className="w-3 h-3 text-red-400" /> : <TrendingDown className="w-3 h-3 text-green-500" />}
                  <span className={`text-xs ${spendingChange > 0 ? "text-red-400" : "text-green-500"}`}>
                    {Math.abs(spendingChange).toFixed(0)}% vs last month
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border bg-white">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">This Month Net</p>
              <p className={`text-xl font-bold ${(currentMonth.income - currentMonth.spending) >= 0 ? "text-[#117ACA]" : "text-red-500"}`}>
                {fmt(currentMonth.income - currentMonth.spending)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Income minus spending</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border bg-white">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Top Category</p>
              <p className="text-xl font-bold text-gray-900">{categorySpending[0]?.name ?? "—"}</p>
              <p className="text-xs text-gray-400 mt-1">{categorySpending[0] ? fmt(categorySpending[0].value) : "No data"}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Spending Bar Chart */}
        <Card className="shadow-sm border-border bg-white">
          <CardHeader>
            <CardTitle className="text-base">Income vs. Spending (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `$${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e5e7eb" }} />
                  <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spending" name="Spending" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Spending by category pie */}
        <Card className="shadow-sm border-border bg-white">
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full rounded-lg" />
            ) : categorySpending.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={categorySpending} cx="40%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                    {categorySpending.map(entry => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e5e7eb" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-300 text-sm">No spending data</div>
            )}
          </CardContent>
        </Card>

        {/* Net savings per month */}
        <Card className="shadow-sm border-border bg-white">
          <CardHeader>
            <CardTitle className="text-base">Monthly Net Savings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={netByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `$${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="net" name="Net" radius={[4, 4, 0, 0]}
                    fill="#117ACA"
                    label={false}
                  >
                    {netByMonth.map((entry, i) => (
                      <Cell key={i} fill={entry.net >= 0 ? "#117ACA" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top merchants */}
        <Card className="shadow-sm border-border bg-white">
          <CardHeader>
            <CardTitle className="text-base">Top Merchants (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
            ) : topMerchants.length > 0 ? (
              <div className="space-y-3">
                {topMerchants.map((m, i) => {
                  const maxVal = topMerchants[0]?.value ?? 1;
                  const pct = (m.value / maxVal) * 100;
                  return (
                    <div key={m.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-400 w-4">#{i + 1}</span>
                          <span className="text-sm font-medium text-gray-800">{m.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{fmt(m.value)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#117ACA] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-300 text-sm">No merchant data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
