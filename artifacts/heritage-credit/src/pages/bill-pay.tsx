import { useState } from "react";
import { useGetBills, useGetAccounts, usePayBill, getGetBillsQueryKey, getGetAccountsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Currency } from "@/components/currency";
import { Receipt, Calendar, CreditCard, Building2, Zap, Wifi, Phone, Home as HomeIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Bill } from "@workspace/api-client-react";

const getPayeeIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("utility") || cat.includes("electric")) return Zap;
  if (cat.includes("internet") || cat.includes("cable")) return Wifi;
  if (cat.includes("phone") || cat.includes("mobile")) return Phone;
  if (cat.includes("rent") || cat.includes("mortgage")) return HomeIcon;
  if (cat.includes("credit")) return CreditCard;
  return Building2;
};

export default function BillPay() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: bills, isLoading: isLoadingBills } = useGetBills();
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccounts();
  const payBill = usePayBill();

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payFromAccount, setPayFromAccount] = useState<string>("");
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleOpenPayment = (bill: Bill) => {
    setSelectedBill(bill);
    setPayAmount(bill.amountDue.toString());
    setPayDate(new Date().toISOString().split('T')[0]);
    
    // Select first checking account by default
    const checking = accounts?.find(a => a.type === 'checking');
    if (checking) {
      setPayFromAccount(checking.id.toString());
    } else {
      setPayFromAccount("");
    }
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !payAmount || !payFromAccount || !payDate) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    payBill.mutate({
      data: {
        billId: selectedBill.id,
        amount: amt,
        fromAccountId: parseInt(payFromAccount),
        payDate: new Date(payDate).toISOString()
      }
    }, {
      onSuccess: () => {
        toast({ title: "Payment Scheduled", description: `Successfully scheduled payment of $${amt.toFixed(2)} to ${selectedBill.payeeName}.` });
        setSelectedBill(null);
        queryClient.invalidateQueries({ queryKey: getGetBillsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
      },
      onError: () => {
        toast({ title: "Payment Failed", description: "An error occurred while scheduling your payment.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="text-page-title">Bill Pay</h1>
          <p className="text-muted-foreground mt-1">Manage and pay your bills securely.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">Add Payee</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoadingBills ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm border-border bg-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex gap-8">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : bills && bills.length > 0 ? (
          bills.map(bill => {
            const Icon = getPayeeIcon(bill.category);
            const isOverdue = new Date(bill.dueDate) < new Date();
            const daysUntilDue = Math.ceil((new Date(bill.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            
            return (
              <Card key={bill.id} className="shadow-sm border-border bg-white" data-testid={`bill-card-${bill.id}`}>
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                        {bill.payeeName}
                        {bill.autopay && <Badge variant="secondary" className="text-[10px] uppercase">Autopay</Badge>}
                      </h3>
                      <p className="text-sm text-muted-foreground">Acct: ••••{bill.accountNumber.slice(-4)}</p>
                      {bill.lastPaidDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last paid: ${bill.lastPaidAmount} on {new Date(bill.lastPaidDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="text-right flex-1 md:flex-initial">
                      <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className={`w-4 h-4 ${isOverdue ? 'text-destructive' : daysUntilDue <= 3 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        <span className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                          {new Date(bill.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right flex-1 md:flex-initial">
                      <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
                      <p className="text-xl font-bold text-foreground">
                        <Currency amount={bill.amountDue} />
                      </p>
                    </div>

                    <Button onClick={() => handleOpenPayment(bill)} data-testid={`button-pay-${bill.id}`}>
                      Pay Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-border">
            <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No Bills Found</h3>
            <p className="text-muted-foreground mt-1">You don't have any bills set up yet.</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handlePay}>
            <DialogHeader>
              <DialogTitle>Pay Bill</DialogTitle>
              <DialogDescription>
                Schedule a payment to {selectedBill?.payeeName}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-6">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <div className="col-span-3 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input 
                    id="amount" 
                    type="number" 
                    step="0.01" 
                    value={payAmount} 
                    onChange={e => setPayAmount(e.target.value)} 
                    className="pl-7"
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="account" className="text-right">From</Label>
                <div className="col-span-3">
                  <Select value={payFromAccount} onValueChange={setPayFromAccount} required>
                    <SelectTrigger id="account">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.filter(a => a.type === 'checking' || a.type === 'savings').map(acc => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>
                          {acc.nickname || acc.type.replace('_', ' ')} (...{acc.maskedNumber}) - ${acc.availableBalance}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <div className="col-span-3">
                  <Input 
                    id="date" 
                    type="date" 
                    value={payDate} 
                    onChange={e => setPayDate(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedBill(null)}>Cancel</Button>
              <Button type="submit" disabled={payBill.isPending}>
                {payBill.isPending ? "Processing..." : "Schedule Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
