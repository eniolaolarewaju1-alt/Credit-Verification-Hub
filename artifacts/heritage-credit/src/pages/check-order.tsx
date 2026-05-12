import { useState } from "react";
import { useGetAccounts, useGetMember } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Package, Truck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CHECK_STYLES = [
  { id: "classic", name: "Classic Blue", price: 18.99, img: "🔵" },
  { id: "security", name: "High-Security Plus", price: 24.99, img: "🟢" },
  { id: "duplicate", name: "Duplicate Checks", price: 21.99, img: "🟡" },
  { id: "business", name: "Business Voucher", price: 29.99, img: "🟣" },
];

const QUANTITIES = [
  { value: "1", label: "1 box (150 checks) — standard" },
  { value: "2", label: "2 boxes (300 checks)" },
  { value: "4", label: "4 boxes (600 checks) — best value" },
];

export default function CheckOrder() {
  const { data: accounts } = useGetAccounts();
  const { data: member, isLoading } = useGetMember();
  const { toast } = useToast();

  const [selectedStyle, setSelectedStyle] = useState("classic");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [startingNumber, setStartingNumber] = useState("1001");
  const [submitted, setSubmitted] = useState(false);

  const checkingAccounts = accounts?.filter(a => a.type === "checking") ?? [];
  const style = CHECK_STYLES.find(s => s.id === selectedStyle)!;
  const qty = parseInt(quantity);
  const total = (style.price * qty).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      toast({ title: "Select an account", description: "Please choose which account to print checks for.", variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-6">Your checks have been ordered and will arrive within 7–10 business days. A confirmation has been sent to <span className="font-medium text-gray-700">{member?.email}</span>.</p>
        <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 border border-gray-100 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Style</span>
            <span className="font-medium text-gray-900">{style.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Quantity</span>
            <span className="font-medium text-gray-900">{qty} box{qty > 1 ? "es" : ""}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Starting #</span>
            <span className="font-medium text-gray-900">{startingNumber}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-3">
            <span>Total Charged</span>
            <span className="text-[#1A5C38]">${total}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-center text-sm text-gray-500">
          <Truck className="w-4 h-4" /> Estimated delivery: 7–10 business days
        </div>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-[#1A5C38] text-sm hover:underline font-medium"
        >
          Place another order
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary" data-testid="text-page-title">Order Checks</h1>
        <p className="text-sm text-gray-400 mt-1">Order personal or business checks for your Heritage Bank checking account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Check style */}
          <Card className="shadow-sm border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Choose Check Style</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {CHECK_STYLES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStyle(s.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedStyle === s.id
                      ? "border-[#1A5C38] bg-blue-50"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200"
                  }`}
                >
                  <div className="text-2xl mb-2">{s.img}</div>
                  <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">${s.price.toFixed(2)}/box</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Account + options */}
          <Card className="shadow-sm border-border bg-white">
            <CardHeader>
              <CardTitle className="text-base">Account & Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select checking account" />
                  </SelectTrigger>
                  <SelectContent>
                    {checkingAccounts.map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.nickname} (...{a.maskedNumber.slice(-4)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Quantity</Label>
                <Select value={quantity} onValueChange={setQuantity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUANTITIES.map(q => (
                      <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="starting" className="text-sm font-medium text-gray-700 mb-2 block">Starting Check Number</Label>
                <Input
                  id="starting"
                  value={startingNumber}
                  onChange={e => setStartingNumber(e.target.value)}
                  placeholder="1001"
                  className="w-36"
                />
              </div>

              {/* Name preview */}
              {!isLoading && member && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Printed Name</Label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 font-mono text-sm text-gray-700">
                    {member.firstName} {member.lastName}<br />
                    <span className="text-xs text-gray-400">{member.address} · {member.city}, {member.state} {member.zip}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Check orders are charged to your account and typically arrive within 7–10 business days via USPS.</p>
              </div>
            </CardContent>
          </Card>

          <button
            type="submit"
            className="w-full bg-[#1A5C38] hover:bg-[#155A2F] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Place Order — ${total}
          </button>
        </form>

        {/* Order summary sidebar */}
        <div className="space-y-4">
          <Card className="shadow-sm border-border bg-white sticky top-24">
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{style.name}</span>
                <span>${style.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantity</span>
                <span>× {qty}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-[#1A5C38]">${total}</span>
              </div>

              <div className="pt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Package className="w-3.5 h-3.5" /> Arrives in 7–10 business days
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Truck className="w-3.5 h-3.5" /> Free USPS First Class shipping
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> MICR-encoded & bank-approved
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
