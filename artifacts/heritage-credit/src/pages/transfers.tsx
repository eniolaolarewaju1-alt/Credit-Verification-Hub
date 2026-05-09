import { useState } from "react";
import { useLocation } from "wouter";
import {
  useGetAccounts,
  useGetTransfers,
  useCreateTransfer,
  useGetExternalPayees,
  useGetExternalTransfers,
  useCreateExternalPayee,
  useCreateExternalTransfer,
  useVerifyExternalAccount,
  useDeleteExternalPayee,
  useGetValidateRouting,
  getGetTransfersQueryKey,
  getGetAccountsQueryKey,
  getGetExternalPayeesQueryKey,
  getGetExternalTransfersQueryKey,
  getGetRecentTransactionsQueryKey,
  getGetAccountSummaryQueryKey,
  getGetValidateRoutingQueryKey,
} from "@workspace/api-client-react";
import type { ExternalPayee } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Building2,
  Send,
  Plus,
  Trash2,
  AlertCircle,
  RotateCcw,
  Printer,
  FileText,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function scDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "reversed") {
    return (
      <Badge className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 gap-1">
        <RotateCcw className="w-2.5 h-2.5" /> Reversed
      </Badge>
    );
  }
  if (status === "pending_reversal") {
    return (
      <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 gap-1">
        <Clock className="w-2.5 h-2.5" /> Pending Reversal
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100 border-0 gap-1">
      <CheckCircle2 className="w-2.5 h-2.5" /> Completed
    </Badge>
  );
}

interface SuccessModal {
  referenceNumber: string;
  transferId: number;
  amount: number;
  fromName: string;
  toName: string;
}

function TransferSuccessModal({ modal, onClose }: { modal: SuccessModal; onClose: () => void }) {
  const [, navigate] = useLocation();
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#1a2b5e] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-400/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <p className="font-semibold text-base">Transfer Initiated</p>
                <p className="text-white/60 text-xs">Demo portal — reversal in ~5 min</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1a2b5e]">{fmt(modal.amount)}</p>
            <p className="text-sm text-gray-500 mt-1">{modal.fromName} → {modal.toName}</p>
          </div>

          <div className="bg-[#f0f4ff] rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Reference Number</p>
            <p className="font-mono text-lg font-bold text-[#1a2b5e] tracking-wider">{modal.referenceNumber}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <strong>Demo Notice:</strong> This transfer will be automatically reversed in approximately 5 minutes and your balance will be restored. A Gmail confirmation will be sent to <strong>daxemry5855@gmail.com</strong>.
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-[#1a2b5e] hover:bg-[#162450]"
              onClick={() => {
                onClose();
                navigate(`/receipt/${modal.transferId}`);
              }}
            >
              <FileText className="w-4 h-4 mr-2" /> View Receipt
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-[#1a2b5e] text-[#1a2b5e]"
              onClick={() => {
                onClose();
                window.open(`/receipt/${modal.transferId}`, "_blank");
              }}
            >
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>

          <button
            onClick={onClose}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

type Tab = "internal" | "external" | "payees";

export default function Transfers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("internal");
  const [successModal, setSuccessModal] = useState<SuccessModal | null>(null);

  // Internal transfer state
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  // External transfer state
  const [extFromAccount, setExtFromAccount] = useState("");
  const [selectedPayeeId, setSelectedPayeeId] = useState("");
  const [extAmount, setExtAmount] = useState("");
  const [extMemo, setExtMemo] = useState("");

  // New payee / verify state (My Payees tab)
  const [showAddPayee, setShowAddPayee] = useState(false);
  const [routingNum, setRoutingNum] = useState("");
  const [accountNum, setAccountNum] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [payeeNickname, setPayeeNickname] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; bankName: string; message?: string } | null>(null);

  // Direct "Send to Someone" form state
  const [directRouting, setDirectRouting] = useState("");
  const [directAccount, setDirectAccount] = useState("");
  const [directRecipientName, setDirectRecipientName] = useState("");

  const { data: accounts, isLoading: loadingAccounts } = useGetAccounts();
  const { data: transfers, isLoading: loadingTransfers } = useGetTransfers();
  const { data: externalPayees, isLoading: loadingPayees } = useGetExternalPayees();
  const { data: externalTransfers, isLoading: loadingExtTransfers } = useGetExternalTransfers();

  const createTransfer = useCreateTransfer();
  const createExternalTransfer = useCreateExternalTransfer();
  const verifyAccount = useVerifyExternalAccount();
  const createPayee = useCreateExternalPayee();
  const deletePayee = useDeleteExternalPayee();

  const { data: routingLookup } = useGetValidateRouting(directRouting, {
    query: {
      queryKey: getGetValidateRoutingQueryKey(directRouting),
      enabled: directRouting.length === 9,
    },
  });

  const eligibleAccounts = accounts?.filter(a => a.type === "checking" || a.type === "savings") ?? [];

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: getGetTransfersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAccountSummaryQueryKey() });
  }

  // ── Internal Transfer ──────────────────────────────────────────────
  function handleInternalTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (fromAccount === toAccount) {
      toast({ title: "Same account", description: "Please choose different accounts.", variant: "destructive" });
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    const fromAcc = accounts?.find(a => a.id === parseInt(fromAccount));
    const toAcc = accounts?.find(a => a.id === parseInt(toAccount));

    createTransfer.mutate({
      data: { fromAccountId: parseInt(fromAccount), toAccountId: parseInt(toAccount), amount: amt, memo: memo || undefined },
    }, {
      onSuccess: (transfer) => {
        setAmount(""); setMemo("");
        invalidateAll();
        setSuccessModal({
          referenceNumber: transfer.referenceNumber,
          transferId: transfer.id,
          amount: transfer.amount,
          fromName: fromAcc?.nickname ?? "Account",
          toName: toAcc?.nickname ?? "Account",
        });
      },
      onError: (err: Error) => toast({ title: "Transfer Failed", description: err.message, variant: "destructive" }),
    });
  }

  // ── Verify Account ─────────────────────────────────────────────────
  function handleVerify() {
    if (routingNum.length !== 9 || !accountNum) return;
    verifyAccount.mutate({ data: { routingNumber: routingNum, accountNumber: accountNum } }, {
      onSuccess: (result) => setVerifyResult(result),
      onError: () => setVerifyResult({ verified: false, bankName: "", message: "Verification failed. Check the routing and account numbers." }),
    });
  }

  // ── Save Payee ─────────────────────────────────────────────────────
  function handleSavePayee(e: React.FormEvent) {
    e.preventDefault();
    if (!verifyResult?.verified || !recipientName || !payeeNickname) return;
    createPayee.mutate({
      data: {
        nickname: payeeNickname,
        recipientName,
        routingNumber: routingNum,
        accountNumber: accountNum,
        bankName: verifyResult.bankName,
        accountType: "checking",
      },
    }, {
      onSuccess: () => {
        toast({ title: "Payee Saved", description: `${recipientName} added to your payees.` });
        setShowAddPayee(false);
        setRoutingNum(""); setAccountNum(""); setRecipientName(""); setPayeeNickname(""); setVerifyResult(null);
        queryClient.invalidateQueries({ queryKey: getGetExternalPayeesQueryKey() });
      },
      onError: () => toast({ title: "Failed to save payee", variant: "destructive" }),
    });
  }

  // ── External Transfer (saved payee) ───────────────────────────────
  function handleExternalTransfer(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(extAmount);
    if (!extFromAccount || !selectedPayeeId || isNaN(amt) || amt <= 0) return;
    createExternalTransfer.mutate({
      data: { fromAccountId: parseInt(extFromAccount), externalPayeeId: parseInt(selectedPayeeId), amount: amt, memo: extMemo || undefined },
    }, {
      onSuccess: () => {
        toast({ title: "Transfer Initiated", description: `${fmt(amt)} is being sent. You'll receive a Gmail confirmation.` });
        setExtAmount(""); setExtMemo(""); setSelectedPayeeId("");
        queryClient.invalidateQueries({ queryKey: getGetExternalTransfersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAccountSummaryQueryKey() });
      },
      onError: (err: Error) => toast({ title: "Transfer Failed", description: err.message, variant: "destructive" }),
    });
  }

  // ── Direct External Send (routing + account entry) ─────────────────
  async function handleDirectExternalTransfer(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(extAmount);
    if (!extFromAccount || directRouting.length !== 9 || directAccount.length < 8 || !directRecipientName || isNaN(amt) || amt <= 0) return;
    try {
      const payee = await createPayee.mutateAsync({
        data: {
          nickname: directRecipientName,
          recipientName: directRecipientName,
          routingNumber: directRouting,
          accountNumber: directAccount,
          bankName: routingLookup?.bankName ?? "Financial Institution",
          accountType: "checking",
        },
      });
      await createExternalTransfer.mutateAsync({
        data: { fromAccountId: parseInt(extFromAccount), externalPayeeId: payee.id, amount: amt, memo: extMemo || undefined },
      });
      toast({ title: "Transfer Initiated", description: `${fmt(amt)} is being sent to ${directRecipientName}. You'll receive a Gmail confirmation.` });
      setDirectRouting(""); setDirectAccount(""); setDirectRecipientName(""); setExtAmount(""); setExtMemo("");
      queryClient.invalidateQueries({ queryKey: getGetExternalTransfersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAccountSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetExternalPayeesQueryKey() });
    } catch (err) {
      toast({ title: "Transfer Failed", description: (err as Error).message, variant: "destructive" });
    }
  }

  function handleDeletePayee(id: number, name: string) {
    deletePayee.mutate({ payeeId: id }, {
      onSuccess: () => {
        toast({ title: "Payee removed", description: `${name} has been removed.` });
        queryClient.invalidateQueries({ queryKey: getGetExternalPayeesQueryKey() });
      },
    });
  }

  const tabs: { id: Tab; label: string; icon: typeof ArrowRightLeft }[] = [
    { id: "internal", label: "Between My Accounts", icon: ArrowRightLeft },
    { id: "external", label: "Send to Someone", icon: Send },
    { id: "payees", label: "My Payees", icon: Building2 },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {successModal && (
        <TransferSuccessModal modal={successModal} onClose={() => setSuccessModal(null)} />
      )}

      <div>
        <h1 className="text-3xl font-serif text-[#1a2b5e]">Transfers</h1>
        <p className="text-gray-500 mt-1 text-sm">Move money between accounts or send to another bank.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white text-[#1a2b5e] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Internal Transfer ── */}
      {tab === "internal" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1a2b5e]">
                <ArrowRightLeft className="w-5 h-5" /> Move Money
              </CardTitle>
              <CardDescription>Transfer instantly between your Heritage accounts. Funds will be automatically reversed within 5 minutes (demo portal).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInternalTransfer} className="space-y-5">
                <div className="space-y-2">
                  <Label>From Account</Label>
                  {loadingAccounts ? <Skeleton className="h-10 w-full" /> : (
                    <Select value={fromAccount} onValueChange={setFromAccount} required>
                      <SelectTrigger><SelectValue placeholder="Select source account" /></SelectTrigger>
                      <SelectContent>
                        {eligibleAccounts.map(a => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.nickname} — {fmt(a.availableBalance)} available
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>To Account</Label>
                  {loadingAccounts ? <Skeleton className="h-10 w-full" /> : (
                    <Select value={toAccount} onValueChange={setToAccount} required>
                      <SelectTrigger><SelectValue placeholder="Select destination account" /></SelectTrigger>
                      <SelectContent>
                        {eligibleAccounts.map(a => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.nickname} (···{a.maskedNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="pl-7" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Memo <span className="text-gray-400 text-xs">(optional)</span></Label>
                  <Input placeholder="e.g. Savings deposit" value={memo} onChange={e => setMemo(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-[#1a2b5e] hover:bg-[#162450]" disabled={!fromAccount || !toAccount || !amount || createTransfer.isPending}>
                  {createTransfer.isPending ? "Processing..." : "Transfer Now"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent transfers */}
          <Card className="shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-[#1a2b5e]">Transfer History</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTransfers ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : transfers && transfers.length > 0 ? (
                <div className="space-y-2">
                  {transfers.slice(0, 8).map(t => {
                    const from = accounts?.find(a => a.id === t.fromAccountId);
                    const to = accounts?.find(a => a.id === t.toAccountId);
                    return (
                      <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center flex-shrink-0 mt-0.5">
                          {t.status === "reversed" ? (
                            <RotateCcw className="w-4 h-4 text-blue-500" />
                          ) : t.status === "pending_reversal" ? (
                            <Clock className="w-4 h-4 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-sm font-medium text-gray-800 truncate">
                            <span className="truncate">{from?.nickname ?? "Account"}</span>
                            <ArrowRight className="w-3 h-3 flex-shrink-0 text-gray-400" />
                            <span className="truncate">{to?.nickname ?? "Account"}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <StatusBadge status={t.status} />
                            {t.referenceNumber && (
                              <span className="text-[10px] text-gray-400 font-mono">{t.referenceNumber}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{scDate(t.date)}{t.memo ? ` · ${t.memo}` : ""}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-sm font-semibold text-[#1a2b5e]">{fmt(t.amount)}</span>
                          <a
                            href={`/receipt/${t.id}`}
                            className="text-[10px] text-[#1a2b5e] hover:underline flex items-center gap-0.5"
                            onClick={e => { e.preventDefault(); window.location.href = `/receipt/${t.id}`; }}
                          >
                            <FileText className="w-2.5 h-2.5" /> Receipt
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No transfers yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── External / Send to Someone ── */}
      {tab === "external" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1a2b5e]">
                  <Send className="w-5 h-5" /> Send Money
                </CardTitle>
                <CardDescription>Enter the recipient's routing and account number to send funds directly to another bank.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDirectExternalTransfer} className="space-y-4">
                  {/* From Account */}
                  <div className="space-y-2">
                    <Label>From Account</Label>
                    {loadingAccounts ? <Skeleton className="h-10 w-full" /> : (
                      <Select value={extFromAccount} onValueChange={setExtFromAccount} required>
                        <SelectTrigger><SelectValue placeholder="Select source account" /></SelectTrigger>
                        <SelectContent>
                          {eligibleAccounts.map(a => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.nickname} — {fmt(a.availableBalance)} available
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Routing Number with live ABA lookup */}
                  <div className="space-y-1.5">
                    <Label>Routing Number (ABA)</Label>
                    <Input
                      placeholder="9-digit routing number"
                      value={directRouting}
                      maxLength={9}
                      onChange={e => setDirectRouting(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    />
                    {directRouting.length === 9 && (
                      routingLookup === undefined ? (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Checking routing number…
                        </p>
                      ) : routingLookup.valid ? (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {routingLookup.bankName ?? "Valid routing number"}
                        </p>
                      ) : (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Invalid routing number
                        </p>
                      )
                    )}
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1.5">
                    <Label>Account Number</Label>
                    <Input
                      placeholder="8–17 digit account number"
                      value={directAccount}
                      onChange={e => setDirectAccount(e.target.value.replace(/\D/g, "").slice(0, 17))}
                    />
                    {directAccount.length > 0 && directAccount.length < 8 && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Account number must be 8–17 digits
                      </p>
                    )}
                    {directAccount.length >= 8 && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Account number format is valid
                      </p>
                    )}
                  </div>

                  {/* Recipient Name */}
                  <div className="space-y-1.5">
                    <Label>Recipient Name</Label>
                    <Input
                      placeholder="Full name of recipient"
                      value={directRecipientName}
                      onChange={e => setDirectRecipientName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <Label>Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                      <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={extAmount} onChange={e => setExtAmount(e.target.value)} className="pl-7" required />
                    </div>
                  </div>

                  {/* Memo */}
                  <div className="space-y-1.5">
                    <Label>Memo <span className="text-gray-400 text-xs">(optional)</span></Label>
                    <Input placeholder="e.g. Rent for June" value={extMemo} onChange={e => setExtMemo(e.target.value)} />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">External transfers typically process in 1–3 business days. You'll receive a Gmail confirmation at <strong>daxemry5855@gmail.com</strong>.</p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#1a2b5e] hover:bg-[#162450]"
                    disabled={
                      !extFromAccount ||
                      directRouting.length !== 9 ||
                      !routingLookup?.valid ||
                      directAccount.length < 8 ||
                      !directRecipientName.trim() ||
                      !extAmount ||
                      createExternalTransfer.isPending ||
                      createPayee.isPending
                    }
                  >
                    {(createExternalTransfer.isPending || createPayee.isPending) ? "Sending…" : "Send Money"}
                  </Button>

                  <p className="text-xs text-center text-gray-400">
                    Want to reuse this recipient?{" "}
                    <button type="button" className="text-[#1a2b5e] hover:underline" onClick={() => { setTab("payees"); setShowAddPayee(true); }}>
                      Save them as a payee
                    </button>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* External transfer history */}
          <Card className="shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-[#1a2b5e]">External Transfer History</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingExtTransfers ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : externalTransfers && externalTransfers.length > 0 ? (
                <div className="space-y-3">
                  {externalTransfers.slice(0, 6).map(t => {
                    const payee = externalPayees?.find((p: ExternalPayee) => p.id === t.externalPayeeId);
                    return (
                      <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center flex-shrink-0">
                          {t.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{payee?.recipientName ?? "External Payee"}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{payee?.bankName} · {scDate(t.date)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-[#1a2b5e]">{fmt(t.amount)}</p>
                          <Badge variant="outline" className="text-[10px] mt-0.5 capitalize">{t.status}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Send className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No external transfers yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── My Payees ── */}
      {tab === "payees" && (
        <div className="space-y-4">
          <Card className="shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#1a2b5e]">
                  <Building2 className="w-5 h-5" /> Add External Payee
                </CardTitle>
                <CardDescription>Enter routing and account numbers to verify and save a recipient.</CardDescription>
              </div>
              {!showAddPayee && (
                <Button onClick={() => setShowAddPayee(true)} size="sm" className="bg-[#1a2b5e] hover:bg-[#162450]">
                  <Plus className="w-4 h-4 mr-1" /> Add Payee
                </Button>
              )}
            </CardHeader>
            {showAddPayee && (
              <CardContent>
                <div className="space-y-4 mb-6">
                  <p className="text-sm font-medium text-gray-700">Step 1 — Verify account</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Routing Number</Label>
                      <Input
                        placeholder="9-digit ABA routing"
                        value={routingNum}
                        maxLength={9}
                        onChange={e => { setRoutingNum(e.target.value.replace(/\D/g, "")); setVerifyResult(null); }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Account Number</Label>
                      <Input
                        placeholder="8–17 digits"
                        value={accountNum}
                        onChange={e => { setAccountNum(e.target.value.replace(/\D/g, "")); setVerifyResult(null); }}
                      />
                    </div>
                  </div>

                  {verifyResult && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${verifyResult.verified ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      {verifyResult.verified ? (
                        <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Account verified at <strong>{verifyResult.bankName}</strong></>
                      ) : (
                        <><AlertCircle className="w-4 h-4 flex-shrink-0" /> {verifyResult.message ?? "Invalid routing or account number"}</>
                      )}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#1a2b5e] text-[#1a2b5e]"
                    onClick={handleVerify}
                    disabled={routingNum.length !== 9 || accountNum.length < 8 || verifyAccount.isPending}
                  >
                    {verifyAccount.isPending ? "Verifying…" : "Verify Account"}
                  </Button>
                </div>

                {verifyResult?.verified && (
                  <form onSubmit={handleSavePayee} className="space-y-4 border-t pt-4">
                    <p className="text-sm font-medium text-gray-700">Step 2 — Save recipient</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Recipient Full Name</Label>
                        <Input placeholder="e.g. John Smith" value={recipientName} onChange={e => setRecipientName(e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Nickname</Label>
                        <Input placeholder="e.g. My Brother" value={payeeNickname} onChange={e => setPayeeNickname(e.target.value)} required />
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                      <strong>Bank:</strong> {verifyResult.bankName} &nbsp;·&nbsp; <strong>Routing:</strong> {routingNum} &nbsp;·&nbsp; <strong>Account:</strong> •••••{accountNum.slice(-4)}
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => { setShowAddPayee(false); setVerifyResult(null); setRoutingNum(""); setAccountNum(""); }}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#1a2b5e] hover:bg-[#162450]" disabled={!recipientName || !payeeNickname || createPayee.isPending}>
                        {createPayee.isPending ? "Saving..." : "Save Payee"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            )}
          </Card>

          {/* Saved payees list */}
          <Card className="shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-[#1a2b5e]">Saved Payees</CardTitle>
              <CardDescription>Recipients you've verified and saved for future transfers.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayees ? (
                <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : externalPayees && externalPayees.length > 0 ? (
                <div className="space-y-3">
                  {externalPayees.map((p: ExternalPayee) => (
                    <div key={p.id} className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-[#1a2b5e]/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-[#1a2b5e]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{p.nickname}</p>
                          <Badge variant="outline" className="text-[10px]">{p.accountType}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{p.recipientName} · {p.bankName}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">Routing: {p.routingNumber} · Acct: •••••{p.accountNumber.slice(-4)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => { setSelectedPayeeId(String(p.id)); setTab("external"); }}
                          className="bg-[#1a2b5e] hover:bg-[#162450] text-xs h-8"
                        >
                          <Send className="w-3 h-3 mr-1" /> Send
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePayee(p.id, p.nickname)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No payees saved yet.</p>
                  <p className="text-xs mt-1">Add a payee above to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
