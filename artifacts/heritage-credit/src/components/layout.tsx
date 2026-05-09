import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Building2, 
  Home, 
  ListOrdered, 
  ArrowRightLeft, 
  Receipt, 
  Landmark, 
  CreditCard, 
  FileText, 
  Settings, 
  ShieldCheck,
  LogOut
} from "lucide-react";
import { useGetMember } from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: member, isLoading } = useGetMember();

  const navItems = [
    { href: "/", label: "Overview", icon: Home },
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
      <aside className="w-[180px] bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-50 overflow-y-auto">
        <div className="p-4 flex items-center gap-2 font-serif font-bold text-lg text-sidebar-primary border-b border-sidebar-border">
          <Building2 className="w-5 h-5 text-sidebar-primary" />
          <span>Heritage</span>
        </div>
        
        <div className="p-4 border-b border-sidebar-border">
          {isLoading || !member ? (
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full bg-sidebar-accent" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20 bg-sidebar-accent" />
                <Skeleton className="h-3 w-16 bg-sidebar-accent" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-sidebar-border">
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">
                  {member.firstName[0]}{member.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{member.firstName} {member.lastName}</span>
                <span className="text-xs text-sidebar-primary mt-1">Member</span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <div className="mt-4 text-[10px] text-center text-sidebar-foreground/60 leading-tight">
            South Carolina's Trusted<br/>Credit Union
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-[180px] bg-background">
        {children}
      </main>
    </div>
  );
}
