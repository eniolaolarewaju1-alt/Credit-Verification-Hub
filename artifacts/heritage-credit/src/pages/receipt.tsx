import { useParams } from "wouter";
import { useGetTransferReceipt, getGetTransferReceiptQueryKey } from "@workspace/api-client-react";
import { Printer, Building2, CheckCircle2, RotateCcw, Clock } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function scDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function scDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "reversed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
        <RotateCcw className="w-4 h-4" /> Reversed
      </span>
    );
  }
  if (status === "pending_reversal") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm">
        <Clock className="w-4 h-4" /> Pending Reversal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
      <CheckCircle2 className="w-4 h-4" /> Completed
    </span>
  );
}

export default function Receipt() {
  const params = useParams<{ transferId: string }>();
  const transferId = parseInt(params.transferId ?? "", 10);
  const { data: receipt, isLoading, isError } = useGetTransferReceipt(transferId, {
    query: { queryKey: getGetTransferReceiptQueryKey(transferId), enabled: !isNaN(transferId) },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading receipt…</p>
      </div>
    );
  }

  if (isError || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500 text-sm">Receipt not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 print:bg-white print:py-0">
      {/* Print button — hidden when printing */}
      <div className="mb-6 flex gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#117ACA] text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#0D6DAD] transition-colors shadow"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Receipt card */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-full">
        {/* Header */}
        <div className="bg-[#117ACA] px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-xl leading-none">Heritage Credit Union</p>
              <p className="text-white/60 text-xs mt-0.5">Charleston, SC 29401 · Member FDIC</p>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-white/60 text-xs uppercase tracking-widest font-medium">Transfer Receipt</p>
            <p className="text-3xl font-bold mt-1">{fmt(receipt.amount)}</p>
          </div>
        </div>

        {/* Reference block */}
        <div className="px-8 py-5 bg-[#f0f4ff] border-b border-blue-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Reference Number</p>
          <p className="font-mono text-lg font-bold text-[#117ACA] tracking-wider">{receipt.referenceNumber}</p>
        </div>

        {/* Details */}
        <div className="px-8 py-6 space-y-0 divide-y divide-gray-100">
          <Row label="Status">
            <StatusBadge status={receipt.status} />
          </Row>
          <Row label="Date">{scDate(receipt.date)}</Row>
          <Row label="From Account">{receipt.fromAccount}</Row>
          <Row label="To Account">{receipt.toAccount}</Row>
          {receipt.memo && <Row label="Memo">{receipt.memo}</Row>}
          {receipt.reversedAt && (
            <Row label="Reversed At">{scDateTime(receipt.reversedAt)}</Row>
          )}
          <Row label="Transfer ID">#{receipt.id}</Row>
        </div>

        {/* Demo note */}
        {receipt.status === "pending_reversal" && (
          <div className="mx-8 mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-xs font-medium">
              Demo Portal Notice — This transfer will be automatically reversed within 5 minutes.
              No real funds have moved. Your balance will be restored shortly.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            This is an official transfer receipt from Heritage Credit Union.<br />
            Questions? Call us at (843) 555-0100 · Mon–Fri 8am–6pm ET
          </p>
          <p className="text-xs text-gray-300 text-center mt-2">
            © {new Date().getFullYear()} Heritage Credit Union · South Carolina's Trusted Credit Union
          </p>
        </div>
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block text-center text-xs text-gray-400 mt-6">
        Printed {new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3.5 gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0 w-32">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{children}</span>
    </div>
  );
}
