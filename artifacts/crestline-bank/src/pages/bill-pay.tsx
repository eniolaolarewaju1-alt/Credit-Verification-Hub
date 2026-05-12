import { useState } from "react";
import { useGetBills, useGetAccounts, usePayBill, getGetBillsQueryKey, getGetAccountsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Currency } from "@/components/currency";
import { Receipt, Calendar, CreditCard, Building2, Zap, Wifi, Phone, Home as HomeIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
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
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const handleOpenPayment = (bill: Bill) => {
    setSelectedBill(bill);
    setPayAmount(bill.amountDue.toFixed(2));
    setPayDate(new Date().toISOString().split("T")[0]);
    const checking = accounts?.find(a => a.type === "checking");
    setPayFromAccount(checking ? checking.id.toString() : "");
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !payAmount || !payFromAccount || !payDate) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    payBill.mutate({ data: { billId: selectedBill.id, amount: amt, fromAccountId: parseInt(payFromAccount), payDate } }, {
      onSuccess: () => {
        toast({ title: "Payment Scheduled", description: `Scheduled $${amt.toFixed(2)} to ${selectedBill.payeeName}.` });
        setSelectedBill(null);
        queryClient.invalidateQueries({ queryKey: getGetBillsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
      },
      onError: () => toast({ title: "Payment Failed", description: "An error occurred.", variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A5C38]" data-testid="text-page-title">Bill Pay</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and pay your bills securely.</p>
        </div>
        <Button className="bg-[#1A5C38] hover:bg-[#155E36]">Add Payee</Button>
      </div>

      <div className="space-y-3">
        {isLoadingBills ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : bills && bills.length > 0 ? (
          bills.map(bill => {
            const Icon = getPayeeIcon(bill.category);
            const daysUntilDue = Math.ceil((new Date(bill.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            const isOverdue = daysUntilDue < 0;
            const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;

            return (
              <div
                key={bill.id}
                data-testid={`bill-card-${bill.id}`}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${isOverdue ? "border-red-200 bg-red-50/30" : isDueSoon ? "border-amber-200 bg-amber-50/20" : "border-gray-100"}`}
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isOverdue ? "bg-red-100" : isDueSoon ? "bg-amber-100" : "bg-gray-100"}`}>
                    <Icon className={`w-5 h-5 ${isOverdue ? "text-red-500" : isDueSoon ? "text-amber-600" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{bill.payeeName}</h3>
                      {bill.autopay && <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 border-blue-100">Autopay</Badge>}
                      {isDueSoon && !isOverdue && <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Due soon</Badge>}
                      {isOverdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Acct: ••••{bill.accountNumber.slice(-4)}</p>
                    {bill.lastPaidDate && (
                      <p className="text-xs text-gray-400">
                        Last paid: <Currency amount={bill.lastPaidAmount ?? 0} /> on {new Date(bill.lastPaidDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-left md:text-right flex-1 md:flex-initial">
                    <p className="text-xs text-gray-400 mb-0.5">Due Date</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className={`w-3.5 h-3.5 ${isOverdue ? "text-red-500" : isDueSoon ? "text-amber-500" : "text-gray-400"}`} />
                      <span className={`text-sm font-medium ${isOverdue ? "text-red-600" : isDueSoon ? "text-amber-700" : "text-gray-700"}`}>
                        {new Date(bill.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                      {!isOverdue && daysUntilDue <= 14 && (
                        <span className="text-xs text-gray-400">({daysUntilDue}d)</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-1 md:flex-initial">
                    <p className="text-xs text-gray-400 mb-0.5">Amount Due</p>
                    <p className="text-xl font-bold text-gray-900"><Currency amount={bill.amountDue} /></p>
                  </div>

                  <Button
                    onClick={() => handleOpenPayment(bill)}
                    data-testid={`button-pay-${bill.id}`}
                    className="bg-[#1A5C38] hover:bg-[#155E36]"
                    disabled={isLoadingAccounts}
                  >
                    Pay Now
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No Bills Found</h3>
            <p className="text-sm text-gray-400 mt-1">You don't have any bills set up yet.</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedBill} onOpenChange={open => !open && setSelectedBill(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handlePay}>
            <DialogHeader>
              <DialogTitle>Pay Bill</DialogTitle>
              <DialogDescription>Schedule a payment to {selectedBill?.payeeName}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <Input id="amount" type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="pl-7" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Pay From</Label>
                <Select value={payFromAccount} onValueChange={setPayFromAccount} required>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts?.filter(a => a.type === "checking" || a.type === "savings").map(acc => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        {acc.nickname} — ${acc.availableBalance.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Payment Date</Label>
                <Input id="date" type="date" value={payDate} onChange={e => setPayDate(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedBill(null)}>Cancel</Button>
              <Button type="submit" disabled={payBill.isPending} className="bg-[#1A5C38] hover:bg-[#155E36]">
                {payBill.isPending ? "Processing..." : "Schedule Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
