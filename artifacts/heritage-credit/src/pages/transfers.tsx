import { useState } from "react";
import { useGetAccounts, useGetTransfers, useCreateTransfer, getGetTransfersQueryKey, getGetAccountsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Currency } from "@/components/currency";
import { ArrowRight, ArrowRightLeft, CheckCircle2, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Transfers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccounts();
  const { data: transfers, isLoading: isLoadingTransfers } = useGetTransfers();
  const createTransfer = useCreateTransfer();

  const [fromAccount, setFromAccount] = useState<string>("");
  const [toAccount, setToAccount] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [memo, setMemo] = useState<string>("");

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccount || !toAccount || !amount) return;

    if (fromAccount === toAccount) {
      toast({
        title: "Invalid Transfer",
        description: "From and To accounts cannot be the same.",
        variant: "destructive"
      });
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive"
      });
      return;
    }

    createTransfer.mutate({
      data: {
        fromAccountId: parseInt(fromAccount),
        toAccountId: parseInt(toAccount),
        amount: amt,
        memo: memo || undefined
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Transfer Successful",
          description: `Successfully transferred $${amt.toFixed(2)}.`,
        });
        setAmount("");
        setMemo("");
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: getGetTransfersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
      },
      onError: (err) => {
        toast({
          title: "Transfer Failed",
          description: "An error occurred while processing your transfer.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="text-page-title">Transfers</h1>
        <p className="text-muted-foreground mt-1">Move money between your Heritage Credit Union accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transfer Form */}
        <Card className="shadow-sm border-border bg-white h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Make a Transfer
            </CardTitle>
            <CardDescription>Funds are transferred immediately.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fromAccount">From Account</Label>
                {isLoadingAccounts ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={fromAccount} onValueChange={setFromAccount} required>
                    <SelectTrigger id="fromAccount" data-testid="select-from-account">
                      <SelectValue placeholder="Select account to transfer from" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.filter(a => a.type === 'checking' || a.type === 'savings').map(acc => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>
                          <div className="flex justify-between w-full min-w-[200px]">
                            <span>{acc.nickname || acc.type.replace('_', ' ')} (...{acc.maskedNumber})</span>
                            <span className="text-muted-foreground ml-4 text-xs mt-0.5">
                              ${acc.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="toAccount">To Account</Label>
                {isLoadingAccounts ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={toAccount} onValueChange={setToAccount} required>
                    <SelectTrigger id="toAccount" data-testid="select-to-account">
                      <SelectValue placeholder="Select account to transfer to" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.filter(a => a.type === 'checking' || a.type === 'savings').map(acc => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>
                          <div className="flex justify-between w-full min-w-[200px]">
                            <span>{acc.nickname || acc.type.replace('_', ' ')} (...{acc.maskedNumber})</span>
                            <span className="text-muted-foreground ml-4 text-xs mt-0.5">
                              ${acc.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input 
                    id="amount"
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    placeholder="0.00" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7 bg-gray-50 border-gray-200"
                    required
                    data-testid="input-transfer-amount"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">Memo (Optional)</Label>
                <Input 
                  id="memo"
                  placeholder="e.g. Rent, Groceries" 
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="bg-gray-50 border-gray-200"
                  data-testid="input-transfer-memo"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!fromAccount || !toAccount || !amount || createTransfer.isPending}
                data-testid="button-submit-transfer"
              >
                {createTransfer.isPending ? "Processing..." : "Transfer Funds"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Transfers */}
        <Card className="shadow-sm border-border bg-white h-fit">
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
            <CardDescription>Your latest internal transfer activity.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransfers || isLoadingAccounts ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : transfers && transfers.length > 0 ? (
              <div className="space-y-4">
                {transfers.slice(0, 5).map(transfer => {
                  const fromAcc = accounts?.find(a => a.id === transfer.fromAccountId);
                  const toAcc = accounts?.find(a => a.id === transfer.toAccountId);
                  
                  return (
                    <div key={transfer.id} className="p-4 rounded-lg border border-border bg-gray-50 flex items-center justify-between" data-testid={`transfer-card-${transfer.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center shrink-0">
                          {transfer.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : (
                            <Clock className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="truncate max-w-[100px]" title={fromAcc?.nickname || fromAcc?.type}>{fromAcc?.nickname || 'Account'} (...{fromAcc?.maskedNumber})</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="truncate max-w-[100px]" title={toAcc?.nickname || toAcc?.type}>{toAcc?.nickname || 'Account'} (...{toAcc?.maskedNumber})</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(transfer.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            {transfer.memo ? ` • ${transfer.memo}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          <Currency amount={transfer.amount} />
                        </p>
                        <p className="text-xs text-muted-foreground capitalize mt-1">{transfer.status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ArrowRightLeft className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p>No recent transfers.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
