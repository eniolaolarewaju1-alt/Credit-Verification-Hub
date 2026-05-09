import { useGetMember, useGetAccounts, useGetAccountSummary, useGetRecentTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Currency } from "@/components/currency";
import { ArrowRightLeft, Receipt, Send, ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: member, isLoading: isLoadingMember } = useGetMember();
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccounts();
  const { data: summary, isLoading: isLoadingSummary } = useGetAccountSummary();
  const { data: recentTx, isLoading: isLoadingTx } = useGetRecentTransactions();

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-primary">
            {isLoadingMember ? <Skeleton className="h-9 w-64" /> : `Welcome back, ${member?.firstName}.`}
          </h1>
          <p className="text-muted-foreground mt-1">Here is your financial snapshot for today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/transfers" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
            <ArrowRightLeft className="w-4 h-4" /> Transfer
          </Link>
          <Link href="/bill-pay" className="bg-white border border-border text-foreground hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Receipt className="w-4 h-4" /> Pay Bill
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 shadow-sm border-border bg-white">
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoadingAccounts ? (
              <>
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </>
            ) : accounts?.map((account) => (
              <div 
                key={account.id} 
                className={`p-5 rounded-xl border flex flex-col justify-between ${
                  account.type === 'checking' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-white text-foreground border-border shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{account.nickname || account.type.replace('_', ' ')}</h3>
                    <p className={`text-xs mt-1 ${account.type === 'checking' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {account.maskedNumber}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="text-2xl font-semibold">
                    <Currency amount={account.balance} />
                  </div>
                  <p className={`text-xs mt-1 ${account.type === 'checking' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    Available Balance: ${account.availableBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingSummary ? (
              <Skeleton className="h-40 w-full" />
            ) : summary ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                  <p className="text-3xl font-semibold text-foreground"><Currency amount={summary.totalBalance} /></p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">In</p>
                    <p className="text-lg font-medium text-success"><Currency amount={summary.monthlyDeposits} /></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Out</p>
                    <p className="text-lg font-medium text-destructive"><Currency amount={-summary.monthlySpending} /></p>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between py-5">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/transactions" className="text-sm text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {isLoadingTx ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentTx && recentTx.length > 0 ? (
              <div className="space-y-0 divide-y divide-border">
                {recentTx.slice(0, 5).map(tx => (
                  <div key={tx.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        <Currency amount={tx.type === 'debit' ? -tx.amount : tx.amount} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent transactions
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-[#f8fafc]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShieldAlert className="w-5 h-5" /> Security Tip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground mb-4">
              Heritage Credit Union will never call or text you asking for your password, secure access code, or PIN.
            </p>
            <Link href="/security" className="text-sm font-medium text-primary hover:underline">
              Security Center &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
