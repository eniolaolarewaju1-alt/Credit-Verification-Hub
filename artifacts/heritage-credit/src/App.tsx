import { Layout } from "./components/layout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import Transactions from "@/pages/transactions";
import Transfers from "@/pages/transfers";
import BillPay from "@/pages/bill-pay";
import Loans from "@/pages/loans";
import Cards from "@/pages/cards";
import Statements from "@/pages/statements";
import Settings from "@/pages/settings";
import Security from "@/pages/security";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
