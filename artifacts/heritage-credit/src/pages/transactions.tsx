import { useState, useMemo } from "react";
import { useGetTransactions, useGetAccounts } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Currency } from "@/components/currency";
import { Search, ShoppingCart, Coffee, Car, Home as HomeIcon, Zap, Send, CreditCard, Building2, HelpCircle, Download, AlertTriangle, X, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function DisputeModal({ transactionId, description, onClose }: { transactionId: number; description: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`/api/transactions/${transactionId}/dispute`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!r.ok) throw new Error("Failed to file dispute");
      await queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      toast({ title: "Dispute filed", description: "We'll investigate this transaction within 3–5 business days." });
      onClose();
    } catch {
      toast({ title: "Error", description: "Could not file dispute. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-900">Dispute Transaction</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-700 font-medium">Transaction: {description}</p>
        </div>
        <form onSubmit={handleDispute} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for dispute</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#117ACA] resize-none"
              rows={3} required minLength={10}
              placeholder="Describe why you're disputing this transaction..."
              value={reason} onChange={e => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading || reason.length < 10}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
              {loading ? "Filing..." : "File Dispute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  const [disputeTx, setDisputeTx] = useState<{ id: number; description: string } | null>(null);
  const { toast } = useToast();

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
            
            <div className="flex items-center gap-3">
              <div className="w-full sm:w-[200px]">
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
              <a
                href={`/api/transactions/export${selectedAccountId !== "all" ? `?accountId=${selectedAccountId}` : ""}`}
                download="transactions.csv"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" /> Export CSV
              </a>
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
                  <th className="px-4 py-3"></th>
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
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors group" data-testid={`row-transaction-${tx.id}`}>
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
                        <td className="px-4 py-4 text-right">
                          {tx.disputed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Flag className="w-3 h-3" /> Disputed
                            </span>
                          ) : (
                            <button
                              onClick={() => setDisputeTx({ id: tx.id, description: tx.description })}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              Dispute
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {disputeTx && (
        <DisputeModal
          transactionId={disputeTx.id}
          description={disputeTx.description}
          onClose={() => setDisputeTx(null)}
        />
      )}
    </div>
  );
}
