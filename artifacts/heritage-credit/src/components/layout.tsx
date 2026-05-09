import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Building2,
  LayoutDashboard,
  ListOrdered,
  ArrowRightLeft,
  Receipt,
  Landmark,
  CreditCard,
  FileText,
  Settings,
  ShieldCheck,
  LogOut,
  Bell,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useGetMember, useGetRecentTransactions } from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function scDateTime() {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function NotificationsDropdown() {
  const { data: recentTx } = useGetRecentTransactions();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const notifications = (recentTx ?? []).slice(0, 5).map((tx) => ({
    id: tx.id,
    icon: tx.type === "credit" ? TrendingUp : TrendingDown,
    color: tx.type === "credit" ? "text-green-500" : "text-red-500",
    bg: tx.type === "credit" ? "bg-green-50" : "bg-red-50",
    title: tx.description,
    desc: `${tx.type === "credit" ? "+" : "-"}$${Math.abs(tx.amount).toFixed(2)} · ${new Date(tx.date).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" })}`,
  }));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        data-testid="button-notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700 shadow-sm"
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full border border-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">Recent Activity</span>
            <span className="text-xs text-gray-400">{notifications.length} alerts</span>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">No recent activity</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full ${n.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <n.icon className={`w-3.5 h-3.5 ${n.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-gray-100">
            <Link
              href="/transactions"
              onClick={() => setOpen(false)}
              className="text-xs text-[#1a2b5e] font-medium hover:underline"
            >
              View all transactions →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/transfers": "Transfers",
  "/bill-pay": "Bill Pay",
  "/loans": "Loans",
  "/cards": "Cards",
  "/statements": "Statements",
  "/settings": "Settings",
  "/security": "Security",
};

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: member, isLoading } = useGetMember();
  const { logout } = useAuth();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: ListOrdered },
    { href: "/transfers", label: "Transfers", icon: ArrowRightLeft },
    { href: "/bill-pay", label: "Bill Pay", icon: Receipt },
    { href: "/loans", label: "Loans", icon: Landmark },
    { href: "/cards", label: "Cards", icon: CreditCard },
    { href: "/statements", label: "Statements", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/security", label: "Security", icon: ShieldCheck },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full">
      {/* ── Sidebar ── */}
      <aside className="w-[200px] bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-50 overflow-y-auto">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-serif font-bold text-base text-white leading-none">Heritage</div>
            <div className="text-[10px] text-white/50 mt-0.5 tracking-wide">Credit Union</div>
          </div>
        </div>

        {/* Member info */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          {isLoading || !member ? (
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full bg-sidebar-accent" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-20 bg-sidebar-accent" />
                <Skeleton className="h-2.5 w-16 bg-sidebar-accent" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 border border-white/20 flex-shrink-0">
                <AvatarFallback className="bg-white/15 text-white text-xs font-semibold">
                  {member.firstName[0]}{member.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white leading-none truncate">
                  {member.firstName} {member.lastName}
                </p>
                <p className="text-[11px] text-white/50 mt-1">#{member.memberNumber}</p>
              </div>
            </div>
          )}
        </div>

        {/* Greeting */}
        {member && (
          <div className="px-4 py-3 border-b border-sidebar-border/50">
            <p className="text-[11px] text-white/40">{getGreeting()},</p>
            <p className="text-[12px] text-white/70 font-medium">{member.firstName}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-sidebar-border space-y-1">
          <button
            onClick={logout}
            data-testid="button-logout"
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <div className="px-3 pt-2 text-[10px] text-white/30 text-center leading-tight">
            South Carolina's Trusted<br />Credit Union
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 ml-[200px] flex flex-col min-h-[100dvh]">
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm px-8 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1a2b5e]">
              {PAGE_TITLES[location] ?? "Heritage Credit Union"}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{scDateTime()}</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            {member && (
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-[#1a2b5e] text-white text-xs font-semibold">
                    {member.firstName[0]}{member.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-gray-800 leading-none">{member.firstName} {member.lastName}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Member</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
