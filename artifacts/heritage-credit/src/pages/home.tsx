import { useState } from "react";
import {
  useGetMember,
  useGetAccounts,
  useGetAccountSummary,
  useGetRecentTransactions,
  useGetLoans,
  useGetTransactions,
} from "@workspace/api-client-react";
import type { Account } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRightLeft,
  Receipt,
  ChevronRight,
  Wifi,
  CreditCard,
  Building2,
  TrendingUp,
  TrendingDown,
  Coffee,
  ShoppingCart,
  Zap,
  Car,
  Monitor,
  X,
  Info,
  Landmark,
} from "lucide-react";
import { Link } from "wouter";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const ROUTING_NUMBER = "021000021";

const CATEGORY_COLORS: Record<string, string> = {
  Income: "#16a34a",
  Groceries: "#3b82f6",
  Dining: "#f59e0b",
  Gas: "#ef4444",
  Shopping: "#8b5cf6",
  Streaming: "#06b6d4",
  Utilities: "#f97316",
  Cash: "#6b7280",
  Transfer: "#64748b",
  Interest: "#22c55e",
};

const CATEGORY_ICONS: Record<string, typeof Coffee> = {
  Income: TrendingUp,
  Groceries: ShoppingCart,
  Dining: Coffee,
  Gas: Car,
  Shopping: CreditCard,
  Streaming: Monitor,
  Utilities: Zap,
  Transfer: ArrowRightLeft,
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function AccountDetailsModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const fullAccount = account.maskedNumber.replace(/[*• ]/g, "").trim();

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a2b5e]/10 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#1a2b5e]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{account.nickname}</h3>
              <p className="text-xs text-gray-500 capitalize">{account.type} Account</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.balance)}</p>
            <p className="text-xs text-gray-500 mt-1">Available: {formatCurrency(account.availableBalance)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Routing Number</p>
              <p className="font-mono font-semibold text-sm text-gray-800">{ROUTING_NUMBER}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Account Number</p>
              <p className="font-mono font-semibold text-sm text-gray-800">
                {fullAccount.length > 0 ? fullAccount : account.maskedNumber}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
              <p className="font-semibold text-sm text-gray-800">{(account.interestRate * 100).toFixed(2)}% APY</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <p className="font-semibold text-sm text-green-600 capitalize">{account.status}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-400">Heritage Credit Union · Charleston, SC 29401 · Member FDIC</p>
        </div>
      </div>
    </div>
  );
}

function FlipAccountCard({ account, onOpenModal }: { account: Account; onOpenModal: (a: Account) => void }) {
  const [flipped, setFlipped] = useState(false);
  const isChecking = account.type === "checking";

  const openedDate = new Date(account.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handleClick = () => {
    if (flipped) {
      onOpenModal(account);
    } else {
      setFlipped(true);
    }
  };

  return (
    <div
      className="relative h-44 cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={handleClick}
      data-testid={`card-account-${account.id}`}
      title="Click to flip · click again to open full details"
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 rounded-2xl p-5 overflow-hidden flex flex-col justify-between ${
            isChecking
              ? "bg-[#1a2b5e] text-white shadow-lg shadow-[#1a2b5e]/30"
              : "bg-white text-gray-900 border-2 border-gray-100 shadow-sm"
          }`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {isChecking && (
            <>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
            </>
          )}
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium uppercase tracking-wider ${isChecking ? "text-white/60" : "text-gray-400"}`}>
                {account.type.replace("_", " ")} Account
              </p>
              <p className={`text-sm font-mono mt-0.5 tracking-wider ${isChecking ? "text-white/80" : "text-gray-500"}`}>
                {account.maskedNumber}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isChecking ? "bg-white/15" : "bg-gray-100"}`}>
              {isChecking ? <Wifi className="w-4 h-4 text-white" /> : <CreditCard className="w-4 h-4 text-gray-500" />}
            </div>
          </div>
          <div className="relative z-10">
            <p className={`text-3xl font-bold tracking-tight ${isChecking ? "text-white" : "text-gray-900"}`}>
              {formatCurrency(account.balance)}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className={`text-xs ${isChecking ? "text-white/60" : "text-gray-400"}`}>
                Available: {formatCurrency(account.availableBalance)}
              </p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isChecking ? "bg-white/15 text-white/80" : "bg-[#1a2b5e]/10 text-[#1a2b5e]"}`}>
                {(account.interestRate * 100).toFixed(2)}% APY
              </span>
            </div>
            <p className={`text-[10px] mt-2 ${isChecking ? "text-white/30" : "text-gray-300"}`}>Tap for details →</p>
          </div>
        </div>

        {/* Back */}
        <div
          className={`absolute inset-0 rounded-2xl p-5 flex flex-col justify-between ${
            isChecking
              ? "bg-[#162450] text-white shadow-lg shadow-[#1a2b5e]/30"
              : "bg-gray-50 text-gray-900 border-2 border-gray-100 shadow-sm"
          }`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div>
            <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${isChecking ? "text-white/50" : "text-gray-400"}`}>
              Account Details
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isChecking ? "text-white/60" : "text-gray-500"}`}>Routing</span>
                <span className={`font-mono text-sm font-semibold ${isChecking ? "text-white" : "text-gray-900"}`}>{ROUTING_NUMBER}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isChecking ? "text-white/60" : "text-gray-500"}`}>Interest Rate</span>
                <span className={`text-sm font-semibold ${isChecking ? "text-white" : "text-gray-900"}`}>
                  {(account.interestRate * 100).toFixed(2)}% APY
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isChecking ? "text-white/60" : "text-gray-500"}`}>Opened</span>
                <span className={`text-sm font-semibold ${isChecking ? "text-white" : "text-gray-900"}`}>{openedDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isChecking ? "text-white/60" : "text-gray-500"}`}>Status</span>
                <span className="text-sm font-semibold text-green-400 capitalize">{account.status}</span>
              </div>
            </div>
          </div>
          <p className={`text-[10px] ${isChecking ? "text-white/30" : "text-gray-300"}`}>← Tap to flip back</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: member, isLoading: isLoadingMember } = useGetMember();
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccounts();
  const { data: summary, isLoading: isLoadingSummary } = useGetAccountSummary();
  const { data: recentTx, isLoading: isLoadingTx } = useGetRecentTransactions();
  const { data: loans } = useGetLoans();
  const { data: allTx } = useGetTransactions();
  const [detailAccount, setDetailAccount] = useState<Account | null>(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const spendingByCategory = (() => {
    if (!allTx) return [];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const debits = allTx.filter(t => t.type === "debit" && t.date >= startOfMonth);
    const map = new Map<string, number>();
    debits.forEach(t => {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  })();

  const nextLoan = loans?.find(l => l.status === "active");

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header with time-based greeting */}
      <div className="flex items-start justify-between">
        <div>
          {isLoadingMember ? (
            <Skeleton className="h-8 w-64 mb-2" />
          ) : (
            <>
              <p className="text-sm text-gray-400 font-medium">{getGreeting()}, {member?.firstName}.</p>
              <h1 className="text-2xl font-serif font-semibold text-[#1a2b5e] mt-0.5">
                Account Overview
              </h1>
            </>
          )}
          <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/transfers"
            data-testid="button-transfer"
            className="flex items-center gap-1.5 bg-[#1a2b5e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#162450] transition-colors shadow-sm"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
          </Link>
          <Link
            href="/bill-pay"
            data-testid="button-pay-bill"
            className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" /> Pay Bill
          </Link>
        </div>
      </div>

      {/* Account Cards — flip on click */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your Accounts</h2>
          <span className="text-xs text-gray-400">Click card to flip · double-click for full details</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isLoadingAccounts ? (
            <>
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </>
          ) : accounts?.map(account => (
            <FlipAccountCard key={account.id} account={account} onOpenModal={setDetailAccount} />
          ))}
        </div>
        {accounts && accounts.length > 0 && (
          <p className="text-center text-[11px] text-gray-300 mt-2">
            Single click flips the card · double-click opens full account details with routing number
          </p>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {isLoadingSummary ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : summary ? (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Balance</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalBalance)}</p>
              <p className="text-xs text-gray-400 mt-1">Across all accounts</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Deposits This Month</p>
              </div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(summary.monthlyDeposits)}</p>
              <p className="text-xs text-green-500/70 mt-1">Income received</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Spending This Month</p>
              </div>
              <p className="text-xl font-bold text-red-500">{formatCurrency(summary.monthlySpending)}</p>
              <p className="text-xs text-red-400/70 mt-1">Total outflow</p>
            </div>
          </>
        ) : null}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/transactions" className="flex items-center gap-1 text-xs font-medium text-[#1a2b5e] hover:underline">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {isLoadingTx ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="flex-1"><Skeleton className="h-3.5 w-40 mb-1.5" /><Skeleton className="h-3 w-24" /></div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : recentTx && recentTx.length > 0 ? (
              recentTx.slice(0, 7).map(tx => {
                const Icon = CATEGORY_ICONS[tx.category] ?? ArrowRightLeft;
                const color = CATEGORY_COLORS[tx.category] ?? "#6b7280";
                const isCredit = tx.type === "credit";
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors" data-testid={`tx-row-${tx.id}`}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tx.category} · {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                    <p className={`text-sm font-semibold tabular-nums ${isCredit ? "text-green-600" : "text-gray-800"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm">No recent transactions</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Spending Chart */}
          {spendingByCategory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h2 className="font-semibold text-gray-900 mb-3 text-sm">Spending by Category</h2>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {spendingByCategory.map(entry => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Spent"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {spendingByCategory.slice(0, 4).map(c => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.name] ?? "#94a3b8" }} />
                      <span className="text-xs text-gray-600">{c.name}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next loan payment */}
          {nextLoan && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h2 className="font-semibold text-gray-900 mb-3 text-sm">Upcoming Payment</h2>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{nextLoan.nickname ?? nextLoan.type}</p>
                  <p className="text-xs text-gray-400">Due {new Date(nextLoan.nextPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
                <p className="text-sm font-bold text-[#1a2b5e]">{formatCurrency(nextLoan.nextPaymentAmount)}</p>
              </div>
              <Link href="/loans" className="mt-3 flex items-center gap-1 text-xs text-[#1a2b5e] font-medium hover:underline">
                Manage loans <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Account Details Modal (for programmatic access still) */}
      {detailAccount && (
        <AccountDetailsModal account={detailAccount} onClose={() => setDetailAccount(null)} />
      )}
    </div>
  );
}
