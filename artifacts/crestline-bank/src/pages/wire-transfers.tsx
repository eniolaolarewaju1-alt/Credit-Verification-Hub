import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetAccounts } from "@workspace/api-client-react";
import { Landmark, Globe, Clock, AlertTriangle, CheckCircle2, Info, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WIRE_HISTORY = [
  { id: 1, date: "Apr 28, 2026", to: "First National Bank — Marcus Reeves", amount: 3500.00, type: "domestic", status: "Completed", ref: "WR-20260428-4412" },
  { id: 2, date: "Mar 15, 2026", to: "HSBC London — J. Clarke", amount: 1200.00, type: "international", status: "Completed", ref: "WR-20260315-3801" },
  { id: 3, date: "Feb 02, 2026", to: "Regions Bank — Sandra Owens", amount: 8750.00, type: "domestic", status: "Completed", ref: "WR-20260202-3120" },
];

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function DomesticForm({ accounts }: { accounts: { id: number; name: string; balance: string }[] }) {
  const [fromId, setFromId] = useState("");
  const [bankName, setBankName] = useState("");
  const [routing, setRouting] = useState("");
  const [account, setAccount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("confirm");
  }

  function handleConfirm() {
    setStep("done");
    toast({ title: "Wire submitted", description: `Domestic wire of ${fmt(Number(amount))} has been queued for processing.` });
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center py-12 gap-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Wire Submitted</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Your domestic wire transfer of {fmt(Number(amount))} to <strong>{recipient}</strong> has been submitted and will be processed within 1 business day.
        </p>
        <p className="text-xs text-muted-foreground">A $25.00 fee will be deducted from your account.</p>
        <Button variant="outline" className="mt-2" onClick={() => { setStep("form"); setAmount(""); setRecipient(""); setBankName(""); setRouting(""); setAccount(""); setMemo(""); }}>
          Send Another Wire
        </Button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-4 py-4">
        <h3 className="font-semibold text-foreground">Review Wire Details</h3>
        <div className="bg-slate-50 rounded-xl border border-border p-4 space-y-3 text-sm">
          <Row label="From" value={accounts.find(a => String(a.id) === fromId)?.name ?? fromId} />
          <Row label="Recipient" value={recipient} />
          <Row label="Bank" value={bankName} />
          <Row label="Routing" value={routing} />
          <Row label="Account" value={`••••${account.slice(-4)}`} />
          <Row label="Amount" value={fmt(Number(amount))} />
          <Row label="Wire Fee" value="$25.00" />
          <Row label="Memo" value={memo || "—"} />
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Total Deducted</span>
            <span>{fmt(Number(amount) + 25)}</span>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          Wire transfers cannot be recalled once processed. Please verify all details carefully.
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Edit</Button>
          <Button onClick={handleConfirm} className="flex-1 bg-primary hover:bg-primary/90">Confirm Wire</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>From Account</Label>
          <Select value={fromId} onValueChange={setFromId} required>
            <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              {accounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name} · {a.balance}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" min="1" step="0.01" className="pl-6" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Recipient Full Name</Label>
          <Input placeholder="Jane Doe" value={recipient} onChange={e => setRecipient(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Recipient Bank Name</Label>
          <Input placeholder="Wells Fargo" value={bankName} onChange={e => setBankName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>ABA Routing Number</Label>
          <Input placeholder="9-digit routing" maxLength={9} value={routing} onChange={e => setRouting(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Account Number</Label>
          <Input placeholder="Recipient account" value={account} onChange={e => setAccount(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Wire Memo <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input placeholder="Purpose of wire" value={memo} onChange={e => setMemo(e.target.value)} />
      </div>
      <FeeBox type="domestic" />
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 gap-2">
        Review Wire <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}

function InternationalForm({ accounts }: { accounts: { id: number; name: string; balance: string }[] }) {
  const [fromId, setFromId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [bankName, setBankName] = useState("");
  const [swift, setSwift] = useState("");
  const [iban, setIban] = useState("");
  const [country, setCountry] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); setStep("confirm"); }
  function handleConfirm() {
    setStep("done");
    toast({ title: "International wire submitted", description: "Your wire will be processed within 2–5 business days." });
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center py-12 gap-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">International Wire Submitted</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Your wire of ${amount} USD to <strong>{recipient}</strong> has been submitted. Processing takes 2–5 business days.
        </p>
        <p className="text-xs text-muted-foreground">A $45.00 fee will be deducted from your account.</p>
        <Button variant="outline" className="mt-2" onClick={() => { setStep("form"); setAmount(""); setRecipient(""); }}>Send Another</Button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-4 py-4">
        <h3 className="font-semibold text-foreground">Review International Wire</h3>
        <div className="bg-slate-50 rounded-xl border border-border p-4 space-y-3 text-sm">
          <Row label="From" value={accounts.find(a => String(a.id) === fromId)?.name ?? fromId} />
          <Row label="Recipient" value={recipient} />
          <Row label="Bank" value={bankName} />
          <Row label="Country" value={country} />
          <Row label="SWIFT/BIC" value={swift} />
          <Row label="IBAN" value={iban || "N/A"} />
          <Row label="Amount" value={`$${amount} USD`} />
          <Row label="Currency" value={currency} />
          <Row label="Wire Fee" value="$45.00" />
        </div>
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          International wires cannot be recalled once sent. Exchange rates are set at time of processing.
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Edit</Button>
          <Button onClick={handleConfirm} className="flex-1 bg-primary hover:bg-primary/90">Confirm Wire</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>From Account</Label>
          <Select value={fromId} onValueChange={setFromId} required>
            <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
            <SelectContent>
              {accounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name} · {a.balance}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Send Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["EUR","GBP","CAD","AUD","JPY","MXN","CHF","CNY","INR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Amount (USD)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" min="1" className="pl-6" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Recipient Country</Label>
          <Input placeholder="United Kingdom" value={country} onChange={e => setCountry(e.target.value)} required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Recipient Full Name / Company</Label>
          <Input placeholder="Jane Doe" value={recipient} onChange={e => setRecipient(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Recipient Bank Name</Label>
          <Input placeholder="Barclays Bank" value={bankName} onChange={e => setBankName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>SWIFT / BIC Code</Label>
          <Input placeholder="BARCGB22" value={swift} onChange={e => setSwift(e.target.value)} required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>IBAN <span className="text-muted-foreground font-normal">(if applicable)</span></Label>
          <Input placeholder="GB29NWBK60161331926819" value={iban} onChange={e => setIban(e.target.value)} />
        </div>
      </div>
      <FeeBox type="international" />
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 gap-2">
        Review Wire <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function FeeBox({ type }: { type: "domestic" | "international" }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>
        <strong>Fee:</strong> {type === "domestic" ? "$25.00 domestic wire fee" : "$45.00 international wire fee"}.{" "}
        {type === "domestic" ? "Funds arrive within 1 business day." : "Allow 2–5 business days for processing."}
      </div>
    </div>
  );
}

export default function WireTransfers() {
  const { data: rawAccounts } = useGetAccounts();
  const accounts = (rawAccounts ?? []).map(a => ({
    id: a.id,
    name: `${a.nickname} ••••${a.maskedNumber.slice(-4)}`,
    balance: Number(a.balance).toLocaleString("en-US", { style: "currency", currency: "USD" }),
  }));

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary">Wire Transfers</h1>
        <p className="text-muted-foreground mt-1">Send funds domestically or internationally via bank wire.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Clock, title: "Domestic", desc: "1 business day", color: "text-blue-600" },
          { icon: Globe, title: "International", desc: "2–5 business days", color: "text-purple-600" },
          { icon: Landmark, title: "Secure & Insured", desc: "FDIC protected", color: "text-green-600" },
        ].map(s => (
          <Card key={s.title} className="shadow-sm border-border bg-white text-center py-4">
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-xs font-semibold">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm border-border bg-white">
        <CardContent className="pt-6">
          <Tabs defaultValue="domestic">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="domestic" className="flex-1 gap-2"><Landmark className="w-4 h-4" />Domestic Wire</TabsTrigger>
              <TabsTrigger value="international" className="flex-1 gap-2"><Globe className="w-4 h-4" />International Wire</TabsTrigger>
            </TabsList>
            <TabsContent value="domestic"><DomesticForm accounts={accounts} /></TabsContent>
            <TabsContent value="international"><InternationalForm accounts={accounts} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border bg-white">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Recent Wire History</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {WIRE_HISTORY.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No wire transfers yet.</p>
          ) : (
            <div className="space-y-3">
              {WIRE_HISTORY.map(w => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{w.to}</p>
                    <p className="text-xs text-muted-foreground">{w.date} · {w.ref}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{fmt(w.amount)}</p>
                    <Badge variant="outline" className={`text-xs ${w.type === "international" ? "border-purple-200 text-purple-700" : "border-blue-200 text-blue-700"}`}>
                      {w.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
