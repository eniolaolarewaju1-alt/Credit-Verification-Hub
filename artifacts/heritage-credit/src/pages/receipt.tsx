import { useParams, Link } from "wouter";
import { useGetTransferReceipt, getGetTransferReceiptQueryKey } from "@workspace/api-client-react";
import { Printer, CheckCircle2, RotateCcw, Clock, Repeat2, Download } from "lucide-react";

const CHASE_BLUE = "#117ACA";
const CHASE_DARK = "#0E4F8B";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function scDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ChaseOctagon({ className = "w-8 h-8" }: { className?: string }) {
  // Chase's signature octagon mark
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <polygon
        points="14,4 26,4 36,14 36,26 26,36 14,36 4,26 4,14"
        fill={CHASE_BLUE}
      />
      <polygon
        points="20,10 24,16 30,16 25,20 27,26 20,22 13,26 15,20 10,16 16,16"
        fill="white"
        opacity="0"
      />
      {/* Four white squares forming Chase's plus inside the octagon */}
      <rect x="11" y="11" width="8" height="8" fill="white" />
      <rect x="21" y="11" width="8" height="8" fill="white" />
      <rect x="11" y="21" width="8" height="8" fill="white" />
      <rect x="21" y="21" width="8" height="8" fill="white" />
      <rect x="19" y="11" width="2" height="18" fill={CHASE_BLUE} />
      <rect x="11" y="19" width="18" height="2" fill={CHASE_BLUE} />
    </svg>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "reversed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200">
        <RotateCcw className="w-3.5 h-3.5" /> Reversed
      </span>
    );
  }
  if (status === "pending_reversal") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold text-xs border border-amber-200">
        <Clock className="w-3.5 h-3.5" /> Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-semibold text-xs border border-green-200">
      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
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
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center py-8 px-4 print:bg-white print:py-0" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Action bar — hidden when printing */}
      <div className="w-full max-w-xl mb-5 flex gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
          style={{ backgroundColor: CHASE_BLUE }}
        >
          <Printer className="w-4 h-4" />
          Print receipt
        </button>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-md font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Receipt card */}
      <div className="bg-white w-full max-w-xl rounded-md shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:rounded-none print:border-0 print:max-w-full">
        {/* Top brand bar — Chase style: thin dark band + white header with octagon */}
        <div className="h-1.5" style={{ backgroundColor: CHASE_DARK }} />

        <div className="px-8 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ChaseOctagon className="w-9 h-9" />
            <div className="leading-tight">
              <p className="font-bold text-[22px] tracking-tight" style={{ color: CHASE_DARK }}>Heritage Credit Union</p>
              <p className="text-gray-500 text-[11px] tracking-wide">CHARLESTON, SC · MEMBER FDIC</p>
            </div>
          </div>
        </div>

        {/* "You sent" block — Chase confirmation style */}
        <div className="px-8 py-7">
          <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">You sent</p>
          <p className="text-[44px] font-bold leading-none mt-2 tracking-tight" style={{ color: CHASE_DARK }}>
            {fmt(receipt.amount)}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <StatusPill status={receipt.status} />
            <span className="text-gray-400 text-xs">·</span>
            <span className="text-gray-500 text-xs">{scDate(receipt.date)}</span>
          </div>
        </div>

        {/* Reference banner */}
        <div className="px-8 py-4 border-t border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Confirmation #</span>
          <span className="font-mono text-sm font-bold" style={{ color: CHASE_DARK }}>{receipt.referenceNumber}</span>
        </div>

        {/* Transfer details */}
        <div className="px-8 py-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4">Transfer details</p>
          <div className="space-y-0 divide-y divide-gray-100">
            <Row label="From">{receipt.fromAccount}</Row>
            <Row label="To">{receipt.toAccount}</Row>
            <Row label="Date">{scDate(receipt.date)}</Row>
            {receipt.memo && <Row label="Memo">{receipt.memo}</Row>}
            {receipt.reversedAt && (
              <Row label="Reversed">{scDateTime(receipt.reversedAt)}</Row>
            )}
            <Row label="Transaction ID">#{receipt.id}</Row>
          </div>
        </div>

        {/* Pending reversal notice */}
        {receipt.status === "pending_reversal" && (
          <div className="mx-8 mb-5 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
            <p className="text-amber-800 text-xs leading-relaxed">
              <span className="font-semibold">Demo portal notice —</span> This transfer will be automatically
              reversed shortly. No real funds have moved.
            </p>
          </div>
        )}

        {/* QR + actions block */}
        <div className="px-8 py-6 border-t border-gray-100 grid grid-cols-[auto_1fr] gap-5 items-center">
          <div className="bg-white border border-gray-200 rounded-md p-2 shadow-sm">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=0&data=${encodeURIComponent(`HCU-RECEIPT:${receipt.referenceNumber}|amount:${receipt.amount}|id:${receipt.id}`)}`}
              alt="Receipt QR code"
              width={110}
              height={110}
              className="block"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">Quick actions</p>
            <Link
              href="/transfers"
              className="flex items-center gap-2 text-sm font-semibold mb-2 hover:underline print:hidden"
              style={{ color: CHASE_BLUE }}
            >
              <Repeat2 className="w-4 h-4" /> Repeat this transfer
            </Link>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline print:hidden"
            >
              <Download className="w-4 h-4" /> Save as PDF
            </button>
            <p className="text-[10px] text-gray-400 mt-2 leading-snug">
              Scan the code to verify this receipt's reference number.
            </p>
          </div>
        </div>


        {/* Footer — Chase style fine print */}
        <div className="px-8 py-5 border-t border-gray-200 bg-gray-50">
          <p className="text-[11px] text-gray-500 leading-relaxed text-center">
            For questions about this transaction, call <span className="font-semibold text-gray-700">(843) 555-0100</span> Mon–Fri 8 a.m.–6 p.m. ET.
          </p>
          <p className="text-[10px] text-gray-400 text-center mt-2 tracking-wide">
            © {new Date().getFullYear()} Heritage Credit Union, N.A. Member FDIC. Equal Housing Lender.
          </p>
        </div>
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block text-center text-[10px] text-gray-400 mt-6">
        Printed {new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{children}</span>
    </div>
  );
}
