import { useState, useMemo } from "react";
import { useGetTransactions, useGetAccounts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Currency } from "@/components/currency";
import { Search, ShoppingCart, Coffee, Car, Home as HomeIcon, Zap, Send, CreditCard, Building2, HelpCircle } from "lucide-react";

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("food") || cat.includes("dining") || cat.includes("restaurant") || cat.includes("coffee")) return Coffee;
  if (cat.includes("shopping") || cat.includes("retail") || cat.includes("merchandise") || cat.includes("grocery")) return ShoppingCart;
  if (cat.includes("auto") || cat.includes("gas") || cat.includes("transport")) return Car;
  if (cat.includes("home") || cat.includes("housing") || cat.includes("rent") || cat.includes("mortgage")) return HomeIcon;
  if (cat.includes("utility") || cat.includes("electric") || cat.includes("water") || cat.includes("internet")) return Zap;
  if (cat.includes("transfer") || cat.includes("zelle") || cat.includes("venmo")) return Send;
  if (cat.includes("payment") || cat.includes("credit card")) return CreditCard;
  if (cat.includes("deposit") || cat.includes("salary") || cat.includes("payroll")) return Building2;
  return HelpCircle;
};

export default function Transactions() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [search, setSearch] = useState("");

  const accountIdParam = selectedAccountId === "all" ? undefined : Number(selectedAccountId);
  
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccounts();
  const { data: transactions, isLoading: isLoadingTransactions } = useGetTransactions(
    accountIdParam ? { accountId: accountIdParam } : {}
  );

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!search.trim()) return transactions;
    
    const lowerSearch = search.toLowerCase();
    return transactions.filter(tx => 
      tx.description.toLowerCase().includes(lowerSearch) || 
      (tx.merchant && tx.merchant.toLowerCase().includes(lowerSearch)) ||
      tx.category.toLowerCase().includes(lowerSearch)
    );
  }, [transactions, search]);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary" data-testid="text-page-title">Transactions</h1>
        <p className="text-muted-foreground mt-1">Review your recent account activity.</p>
      </div>

      <Card className="shadow-sm border-border bg-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search transactions..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-[250px]">
              {isLoadingAccounts ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger data-testid="select-account">
                    <SelectValue placeholder="All Accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts?.map(acc => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        {acc.nickname || acc.type.replace('_', ' ')} (...{acc.maskedNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {isLoadingTransactions ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map(tx => {
                    const Icon = getCategoryIcon(tx.category);
                    const isCredit = tx.type === 'credit';
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors" data-testid={`row-transaction-${tx.id}`}>
                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{tx.merchant || tx.description}</p>
                              {tx.merchant && <p className="text-xs text-muted-foreground">{tx.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground capitalize">
                          {tx.category}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                          <Currency amount={isCredit ? tx.amount : -tx.amount} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-muted-foreground">
                          ${tx.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
