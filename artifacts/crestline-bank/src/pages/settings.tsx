import { useState } from "react";
import { useGetMember, useGetNotificationPreferences, useUpdateNotificationPreferences, getGetNotificationPreferencesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, Building, Shield, Moon, Sun, DollarSign, Plus, Minus, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetAccounts, getGetAccountsQueryKey, getGetTransactionsQueryKey, getGetRecentTransactionsQueryKey, getGetAccountSummaryQueryKey } from "@workspace/api-client-react";

export default function Settings() {
  const { data: member, isLoading } = useGetMember();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const { data: accounts } = useGetAccounts();
  const [adjAccountId, setAdjAccountId] = useState<string>("");
  const [adjAmount, setAdjAmount] = useState<string>("");
  const [adjDescription, setAdjDescription] = useState<string>("");
  const [adjType, setAdjType] = useState<"credit" | "debit">("credit");
  const [adjLoading, setAdjLoading] = useState(false);

  async function submitAdjustment(e: React.FormEvent) {
    e.preventDefault();
    const accountId = parseInt(adjAccountId, 10);
    const amt = parseFloat(adjAmount);
    if (!accountId || !amt || amt <= 0) {
      toast({ title: "Invalid input", description: "Pick an account and enter a positive amount.", variant: "destructive" });
      return;
    }
    setAdjLoading(true);
    try {
      const r = await fetch("/api/admin/adjust-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          accountId,
          delta: adjType === "credit" ? amt : -amt,
          description: adjDescription || (adjType === "credit" ? "Deposit" : "Withdrawal"),
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      toast({
        title: adjType === "credit" ? "Funds added" : "Funds removed",
        description: `${data.nickname} new balance: $${data.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      });
      setAdjAmount("");
      setAdjDescription("");
      void queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getGetRecentTransactionsQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getGetAccountSummaryQueryKey() });
    } catch (err) {
      toast({ title: "Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setAdjLoading(false);
    }
  }
  const { data: notifPrefs, isLoading: loadingPrefs } = useGetNotificationPreferences();
  const { mutate: updatePrefs } = useUpdateNotificationPreferences({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetNotificationPreferencesQueryKey() });
        toast({ title: "Preferences saved" });
      },
    },
  });

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", String(next));
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-primary" data-testid="text-page-title">Settings & Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-lg font-medium text-foreground">Personal Info</h2>
          <p className="text-sm text-muted-foreground">Your core identity details associated with your Crestline Bank membership.</p>
        </div>
        
        <Card className="md:col-span-2 shadow-sm border-border bg-white">
          <CardContent className="p-6">
            {isLoading || !member ? (
              <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-border pb-6">
                  <div className="w-16 h-16 rounded-full bg-sidebar text-sidebar-foreground flex items-center justify-center text-xl font-bold">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">{member.firstName} {member.lastName}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Shield className="w-3.5 h-3.5" /> Member #{member.memberNumber}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Email Address</Label>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Mail className="w-4 h-4 text-muted-foreground" /> {member.email}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Phone Number</Label>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Phone className="w-4 h-4 text-muted-foreground" /> {member.phone}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Mailing Address</Label>
                    <div className="flex items-start gap-2 text-foreground font-medium">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p>{member.address}</p>
                        <p>{member.city}, {member.state} {member.zip}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Membership Status</Label>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Building className="w-4 h-4 text-muted-foreground" /> 
                        <span className="capitalize">{member.status} since {new Date(member.memberSince).getFullYear()}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Edit Profile</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="col-span-1 md:col-span-3 my-2" />

        <div className="md:col-span-1 space-y-2">
          <h2 className="text-lg font-medium text-foreground">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground">Control which email alerts you receive from Crestline Bank.</p>
        </div>

        <Card className="md:col-span-2 shadow-sm border-border bg-white">
          <CardContent className="p-0">
            {loadingPrefs ? (
              <div className="p-6 space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="divide-y divide-border">
                <div className="p-5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Login Alerts</Label>
                    <p className="text-xs text-muted-foreground">Email on every sign-in to your account.</p>
                  </div>
                  <Switch checked={notifPrefs?.loginAlerts ?? true} onCheckedChange={v => updatePrefs({ data: { loginAlerts: v } })} />
                </div>
                <div className="p-5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Transfer Alerts</Label>
                    <p className="text-xs text-muted-foreground">Email when transfers are initiated or completed.</p>
                  </div>
                  <Switch checked={notifPrefs?.transferAlerts ?? true} onCheckedChange={v => updatePrefs({ data: { transferAlerts: v } })} />
                </div>
                <div className="p-5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Bill Pay Alerts</Label>
                    <p className="text-xs text-muted-foreground">Email when a bill payment is processed.</p>
                  </div>
                  <Switch checked={notifPrefs?.billPayAlerts ?? true} onCheckedChange={v => updatePrefs({ data: { billPayAlerts: v } })} />
                </div>
                <div className="p-5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Low Balance Alerts</Label>
                    <p className="text-xs text-muted-foreground">Email when an account balance drops below a threshold.</p>
                  </div>
                  <Switch checked={notifPrefs?.lowBalanceAlerts ?? false} onCheckedChange={v => updatePrefs({ data: { lowBalanceAlerts: v } })} />
                </div>
                {notifPrefs?.lowBalanceAlerts && (
                  <div className="p-5 flex items-center justify-between bg-gray-50/60">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Low Balance Threshold</Label>
                      <p className="text-xs text-muted-foreground">Alert when balance falls below this amount.</p>
                    </div>
                    <div className="relative w-32">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <Input
                        type="number" min="0" step="50"
                        defaultValue={notifPrefs?.lowBalanceThreshold ?? 100}
                        className="pl-7 text-sm"
                        onBlur={e => updatePrefs({ data: { lowBalanceThreshold: Number(e.target.value) } })}
                      />
                    </div>
                  </div>
                )}
                <div className="p-5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Marketing Emails</Label>
                    <p className="text-xs text-muted-foreground">Updates on new loan rates and credit card offers.</p>
                  </div>
                  <Switch checked={notifPrefs?.marketingEmails ?? false} onCheckedChange={v => updatePrefs({ data: { marketingEmails: v } })} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="col-span-1 md:col-span-3 my-2" />

        <div className="md:col-span-1 space-y-2">
          <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[#1A5C38]" /> Quick Adjust
          </h2>
          <p className="text-sm text-muted-foreground">
            Add or remove funds from any account. Each adjustment writes a matching entry to your transaction history.
          </p>
        </div>

        <Card className="md:col-span-2 shadow-sm border-border bg-white">
          <CardContent className="p-6">
            <form onSubmit={submitAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjType("credit")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${adjType === "credit" ? "bg-green-50 border-green-300 text-green-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  <Plus className="w-4 h-4" /> Add funds
                </button>
                <button
                  type="button"
                  onClick={() => setAdjType("debit")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${adjType === "debit" ? "bg-red-50 border-red-300 text-red-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  <Minus className="w-4 h-4" /> Remove funds
                </button>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Account</Label>
                <select
                  value={adjAccountId}
                  onChange={e => setAdjAccountId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                  required
                >
                  <option value="">Choose an account…</option>
                  {accounts?.map(a => (
                    <option key={a.id} value={a.id}>{a.nickname} (···{a.maskedNumber.slice(-4)}) · ${a.availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={adjAmount}
                      onChange={e => setAdjAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-7 text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                  <Input
                    value={adjDescription}
                    onChange={e => setAdjDescription(e.target.value)}
                    placeholder={adjType === "credit" ? "e.g. Deposit" : "e.g. ATM Withdrawal"}
                    className="text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={adjLoading}
                className="w-full bg-[#1A5C38] hover:bg-[#155E36] text-white"
              >
                {adjLoading ? "Saving…" : adjType === "credit" ? "Add to account" : "Remove from account"}
              </Button>
              <p className="text-[11px] text-gray-400 text-center">
                Single-owner admin tool. Requires you to be signed in.
              </p>
            </form>
          </CardContent>
        </Card>

        <Separator className="col-span-1 md:col-span-3 my-2" />

        <div className="md:col-span-1 space-y-2">
          <h2 className="text-lg font-medium text-foreground">Appearance</h2>
          <p className="text-sm text-muted-foreground">Customize how the portal looks on your device.</p>
        </div>

        <Card className="md:col-span-2 shadow-sm border-border bg-white">
          <CardContent className="p-0">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-4 h-4 text-gray-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Switch between light and dark themes.</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDark} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
