import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetAccounts,
  useGetExternalPayees,
  useCreateExternalTransfer,
  getGetAccountsQueryKey,
  getGetTransactionsQueryKey,
  getGetRecentTransactionsQueryKey,
  getGetAccountSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Send, ChevronLeft, Search, Zap } from "lucide-react";

const CHASE_BLUE = "#1A5C38";
const CHASE_DARK = "#0E4F8B";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = ["#0E4F8B", "#1A5C38", "#16a34a", "#7c3aed", "#dc2626", "#ea580c", "#0891b2", "#db2777"];
function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function QuickSend() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: accounts } = useGetAccounts();
  const { data: payees, isLoading: loadingPayees } = useGetExternalPayees();

  const [step, setStep] = useState<"pick" | "amount">("pick");
  const [search, setSearch] = useState("");
  const [selectedPayeeId, setSelectedPayeeId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [fromAccountId, setFromAccountId] = useState<number | null>(null);

  const checking = useMemo(() => accounts?.find(a => a.type === "checking"), [accounts]);
  const defaultFromId = fromAccountId ?? checking?.id ?? accounts?.[0]?.id ?? null;
  const fromAcc = accounts?.find(a => a.id === defaultFromId);

  const filteredPayees = useMemo(() => {
    if (!payees) return [];
    if (!search.trim()) return payees;
    const s = search.toLowerCase();
    return payees.filter(p =>
      p.recipientName.toLowerCase().includes(s) ||
      p.bankName.toLowerCase().includes(s) ||
      p.nickname?.toLowerCase().includes(s)
    );
  }, [payees, search]);

  const selectedPayee = payees?.find(p => p.id === selectedPayeeId);

  const createMutation = useCreateExternalTransfer({
    mutation: {
      onSuccess: (transfer) => {
        void queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetRecentTransactionsQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetAccountSummaryQueryKey() });
        toast({
          title: "Sent!",
          description: `${fmt(Number(amount))} sent to ${selectedPayee?.recipientName}. New balance: ${fmt(transfer.newBalance ?? 0)}. Auto-reverses in 30 seconds.`,
        });
        navigate("/");
      },
      onError: (err: Error) => toast({ title: "Send failed", description: err.message, variant: "destructive" }),
    },
  });

  function handleSend() {
    const amt = parseFloat(amount);
    if (!selectedPayee || !defaultFromId || !amt || amt <= 0) {
      toast({ title: "Missing info", description: "Pick an amount greater than $0.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      data: {
        externalPayeeId: selectedPayee.id,
        fromAccountId: defaultFromId,
        amount: amt,
        memo: memo || undefined,
      },
    });
  }

  return (
    <div className="max-w-md mx-auto p-6" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {step === "amount" ? (
          <button onClick={() => setStep("pick")} className="text-gray-500 hover:text-gray-800">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link href="/" className="text-gray-500 hover:text-gray-800">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: CHASE_BLUE }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: CHASE_DARK }}>Quick Send</h1>
        </div>
      </div>

      {step === "pick" && (
        <>
          <p className="text-sm text-gray-500 mb-4">Send money instantly to anyone in your contacts. Recipients are auto-reversed after 30 seconds.</p>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts"
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ outlineColor: CHASE_BLUE }}
            />
          </div>

          <div className="space-y-2">
            {loadingPayees ? (
              <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
            ) : filteredPayees.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-500 mb-3">No contacts yet.</p>
                <Link href="/transfers" className="text-sm font-semibold hover:underline" style={{ color: CHASE_BLUE }}>
                  Add a recipient →
                </Link>
              </div>
            ) : (
              filteredPayees.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPayeeId(p.id); setStep("amount"); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: avatarColor(p.recipientName) }}
                  >
                    {initials(p.recipientName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.nickname || p.recipientName}</p>
                    <p className="text-xs text-gray-500 truncate">{p.bankName} · ···{p.accountNumber.slice(-4)}</p>
                  </div>
                  <Send className="w-4 h-4 text-gray-300" />
                </button>
              ))
            )}
          </div>
        </>
      )}

      {step === "amount" && selectedPayee && (
        <>
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3"
              style={{ backgroundColor: avatarColor(selectedPayee.recipientName) }}
            >
              {initials(selectedPayee.recipientName)}
            </div>
            <p className="text-base font-semibold text-gray-900">{selectedPayee.recipientName}</p>
            <p className="text-xs text-gray-500">{selectedPayee.bankName} · ···{selectedPayee.accountNumber.slice(-4)}</p>
          </div>

          <div className="text-center mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Amount</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-light text-gray-400">$</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="text-5xl font-bold w-44 text-center border-0 focus:outline-none tracking-tight"
                style={{ color: CHASE_DARK }}
              />
            </div>
            {fromAcc && (
              <p className="text-xs text-gray-400 mt-2">
                From {fromAcc.nickname} · Available {fmt(fromAcc.availableBalance)}
              </p>
            )}
          </div>

          {accounts && accounts.length > 1 && (
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-2">From account</label>
              <select
                value={defaultFromId ?? ""}
                onChange={e => setFromAccountId(parseInt(e.target.value, 10))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.nickname} ({fmt(a.availableBalance)})</option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-6">
            <label className="text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-2">Memo (optional)</label>
            <input
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="What's it for?"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={createMutation.isPending || !amount || parseFloat(amount) <= 0}
            className="w-full text-white py-3.5 rounded-lg font-semibold text-sm shadow-sm hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            style={{ backgroundColor: CHASE_BLUE }}
          >
            <Send className="w-4 h-4" />
            {createMutation.isPending ? "Sending…" : `Send ${amount ? fmt(parseFloat(amount) || 0) : ""}`}
          </button>

          <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
            Demo portal — funds move only inside this app and auto-reverse after 30 seconds with an email confirmation.
          </p>
        </>
      )}
    </div>
  );
}
