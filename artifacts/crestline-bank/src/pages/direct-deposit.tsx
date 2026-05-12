import { useGetAccounts, useGetMember } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, Copy, CheckCircle2, Info, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">{value}</p>
      </div>
      <button
        onClick={copy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function DirectDeposit() {
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccounts();
  const { data: member, isLoading: isLoadingMember } = useGetMember();

  const BANK_ROUTING = "061000104"; // Crestline Bank routing number (Columbia, SC)
  const checkingAccount = accounts?.find(a => a.type === "checking");
  const savingsAccount = accounts?.find(a => a.type === "savings");

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary" data-testid="text-page-title">Direct Deposit Setup</h1>
        <p className="text-sm text-gray-400 mt-1">Share these details with your employer or benefits provider to set up direct deposit.</p>
      </div>

      {/* Bank info banner */}
      <div className="bg-[#1A5C38] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg leading-none">Crestline Bank</p>
            <p className="text-white/60 text-xs mt-0.5">Columbia, SC 29201 · Member FDIC</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white/60 text-xs uppercase tracking-wide font-medium mb-1">Bank Routing Number</p>
            <p className="text-2xl font-mono font-bold tracking-wider">{BANK_ROUTING}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white/60 text-xs uppercase tracking-wide font-medium mb-1">Member Name</p>
            {isLoadingMember ? (
              <Skeleton className="h-7 w-40 bg-white/20" />
            ) : (
              <p className="text-2xl font-bold">{member?.firstName} {member?.lastName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Checking */}
        <Card className="shadow-sm border-border bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Checking Account</CardTitle>
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">Recommended</Badge>
            </div>
            <p className="text-xs text-gray-400">Best for payroll and recurring deposits</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingAccounts ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : checkingAccount ? (
              <>
                <CopyField label="Routing Number" value={BANK_ROUTING} />
                <CopyField label="Account Number" value={checkingAccount.maskedNumber.replace(/[•·]/g, "0").replace(/\s/g, "")} />
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">Contact support at (803) 555-0100 to get your full account number if needed.</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No checking account found.</p>
            )}
          </CardContent>
        </Card>

        {/* Savings */}
        <Card className="shadow-sm border-border bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Savings Account</CardTitle>
            <p className="text-xs text-gray-400">For deposits directly to savings</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingAccounts ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : savingsAccount ? (
              <>
                <CopyField label="Routing Number" value={BANK_ROUTING} />
                <CopyField label="Account Number" value={savingsAccount.maskedNumber.replace(/[•·]/g, "0").replace(/\s/g, "")} />
              </>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No savings account found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Download form */}
      <Card className="shadow-sm border-border bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Direct Deposit Authorization Form</h3>
              <p className="text-sm text-gray-400 mt-0.5">Some employers require a signed authorization form. Download and complete ours.</p>
            </div>
            <button className="flex items-center gap-2 bg-[#1A5C38] hover:bg-[#155E36] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              <Download className="w-4 h-4" />
              Download Form (PDF)
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="shadow-sm border-border bg-white">
        <CardHeader>
          <CardTitle className="text-base">How to Set Up Direct Deposit</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {[
              { step: "1", title: "Get your account details", desc: "Copy your routing and account numbers above." },
              { step: "2", title: "Contact your employer or payer", desc: "Provide them with your routing number, account number, and account type (checking or savings)." },
              { step: "3", title: "Complete any forms", desc: "Download our authorization form if your employer requires one. Fill it out and return it to HR or payroll." },
              { step: "4", title: "Wait for activation", desc: "Direct deposit typically takes 1–2 pay cycles to activate. Your first deposit may arrive as a paper check." },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1A5C38] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{step}</div>
                <div>
                  <p className="font-medium text-gray-900">{title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
