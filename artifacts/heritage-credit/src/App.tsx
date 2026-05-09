import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useCallback } from "react";

import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Transactions from "@/pages/transactions";
import Transfers from "@/pages/transfers";
import BillPay from "@/pages/bill-pay";
import Loans from "@/pages/loans";
import Cards from "@/pages/cards";
import Statements from "@/pages/statements";
import Settings from "@/pages/settings";
import Security from "@/pages/security";
import NotFound from "@/pages/not-found";
import Receipt from "@/pages/receipt";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: true,
      staleTime: 15_000,
    },
  },
});

function SessionTimeoutModal({ onDismiss, onLogout }: { onDismiss: () => void; onLogout: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-amber-600 text-lg">⏱</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Session Expiring Soon</h2>
            <p className="text-sm text-gray-500">You will be signed out in 2 minutes</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          For your security, inactive sessions are automatically signed out. Do you want to stay signed in?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Sign Out
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 bg-[#117ACA] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#0D6DAD] transition-colors"
          >
            Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [location] = useLocation();

  const handleTimeout = useCallback(async () => {
    await logout();
    window.location.href = "/login";
  }, [logout]);

  const { showWarning, dismissWarning } = useSessionTimeout(handleTimeout);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A2240] flex items-center justify-center">
        <div className="text-white/60 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated && location !== "/login") {
    return <Redirect to="/login" />;
  }

  if (isAuthenticated && location === "/login") {
    return <Redirect to="/" />;
  }

  return (
    <>
      {children}
      {showWarning && isAuthenticated && (
        <SessionTimeoutModal onDismiss={dismissWarning} onLogout={handleTimeout} />
      )}
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        <AuthGuard>
          <Switch>
            <Route path="/receipt/:transferId" component={Receipt} />
            <Route>
              <Layout>
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/transactions" component={Transactions} />
                  <Route path="/transfers" component={Transfers} />
                  <Route path="/bill-pay" component={BillPay} />
                  <Route path="/loans" component={Loans} />
                  <Route path="/cards" component={Cards} />
                  <Route path="/statements" component={Statements} />
                  <Route path="/settings" component={Settings} />
                  <Route path="/security" component={Security} />
                  <Route component={NotFound} />
                </Switch>
              </Layout>
            </Route>
          </Switch>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
