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
  Menu,
  X,
  Moon,
  Sun,
  BarChart2,
  Target,
  MapPin,
  Printer,
  Wallet,
  MessageCircle,
  Building,
} from "lucide-react";
import { useGetMember, useGetRecentTransactions } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
              className="text-xs text-[#117ACA] font-medium hover:underline"
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

function SidebarContent({
  member,
  isLoading,
  location,
  navItems,
  logout,
  onNavClick,
}: {
  member: { firstName: string; lastName: string; memberNumber: string } | undefined;
  isLoading: boolean;
  location: string;
  navItems: { href: string; label: string; icon: React.ElementType }[];
  logout: () => void;
  onNavClick?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-base text-white leading-none">Heritage</div>
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
              <AvatarImage src="/avatar.jpeg" alt="Dax Brooks" className="object-cover" />
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
              onClick={onNavClick}
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
    </>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: member, isLoading } = useGetMember();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: ListOrdered },
    { href: "/transfers", label: "Transfers", icon: ArrowRightLeft },
    { href: "/bill-pay", label: "Bill Pay", icon: Receipt },
    { href: "/loans", label: "Loans", icon: Landmark },
    { href: "/cards", label: "Cards", icon: CreditCard },
    { href: "/statements", label: "Statements", icon: FileText },
    { href: "/insights", label: "Insights", icon: BarChart2 },
    { href: "/savings-goals", label: "Goals", icon: Target },
    { href: "/direct-deposit", label: "Direct Deposit", icon: Building },
    { href: "/atm-locator", label: "ATM Locator", icon: MapPin },
    { href: "/check-order", label: "Order Checks", icon: Printer },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/security", label: "Security", icon: ShieldCheck },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-[100dvh] w-full">

      {/* ── Mobile overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar — desktop: always visible · mobile: slide-in overlay ── */}
      <aside
        className={`
          w-[220px] bg-sidebar text-sidebar-foreground flex flex-col
          fixed inset-y-0 left-0 z-50 overflow-y-auto
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 lg:hidden w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>

        <SidebarContent
          member={member}
          isLoading={isLoading}
          location={location}
          navItems={navItems}
          logout={logout}
          onNavClick={closeSidebar}
        />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-[220px] flex flex-col min-h-[100dvh]">

        {/* Top header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm px-4 sm:px-8 py-3 flex items-center justify-between gap-3">

          {/* Hamburger — mobile only */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-600 shadow-sm flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[#117ACA] truncate">
                {PAGE_TITLES[location] ?? "Heritage Credit Union"}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">{scDateTime()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setDarkMode(d => !d)}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700 shadow-sm"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationsDropdown />
            {member && (
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/avatar.jpeg" alt="Dax Brooks" className="object-cover" />
                  <AvatarFallback className="bg-[#117ACA] text-white text-xs font-semibold">
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

      {/* Live Chat Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 overflow-hidden">
            <div className="bg-[#117ACA] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-white text-sm font-semibold">Heritage Credit Union Support</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 h-48 flex flex-col items-center justify-center text-center">
              <MessageCircle className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-700">Our team is available</p>
              <p className="text-xs text-gray-400 mt-1">Mon – Fri, 8 AM – 6 PM ET</p>
              <a
                href="tel:+18435550100"
                className="mt-4 bg-[#117ACA] hover:bg-[#0D6DAD] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Call (843) 555-0100
              </a>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">In-app messaging coming soon</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setChatOpen(c => !c)}
          className="w-14 h-14 rounded-full bg-[#117ACA] hover:bg-[#0D6DAD] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          title="Live Support Chat"
        >
          {chatOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
