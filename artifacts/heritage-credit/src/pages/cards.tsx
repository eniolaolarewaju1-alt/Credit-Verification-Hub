import { useState } from "react";
import { useGetCards, getGetCardsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Currency } from "@/components/currency";
import { CreditCard as CardIcon, Lock, Settings2, Plane, Gift, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Cards() {
  const { data: cards, isLoading } = useGetCards();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadingCard, setLoadingCard] = useState<number | null>(null);

  const toggleFreeze = async (cardId: number, currentStatus: string) => {
    const newStatus = currentStatus === "frozen" ? "active" : "frozen";
    setLoadingCard(cardId);
    try {
      const r = await fetch(`/api/cards/${cardId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) throw new Error("Failed");
      await queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
      toast({
        title: newStatus === "frozen" ? "Card Frozen" : "Card Unfrozen",
        description: newStatus === "frozen"
          ? "Your card has been temporarily locked. No new transactions will be processed."
          : "Your card is now active and ready to use.",
      });
    } catch {
      toast({ title: "Error", description: "Could not update card status. Please try again.", variant: "destructive" });
    } finally {
      setLoadingCard(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A5C38]" data-testid="text-page-title">Cards</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your Heritage Bank credit and debit cards.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="shadow-sm border-border">
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full rounded-xl mb-6" />
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : cards && cards.length > 0 ? (
          cards.map(card => {
            const isFrozen = card.status === "frozen";
            const isCredit = card.type === "credit";
            const isUpdating = loadingCard === card.id;

            return (
              <div key={card.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" data-testid={`card-item-${card.id}`}>
                {/* Visual Card */}
                <div className={`m-5 h-48 rounded-xl p-5 relative overflow-hidden text-white flex flex-col justify-between ${isFrozen
                  ? "bg-gradient-to-br from-gray-400 to-gray-500"
                  : isCredit
                    ? "bg-gradient-to-br from-[#1A5C38] to-[#0F3522]"
                    : "bg-gradient-to-br from-[#2d6a4f] to-[#1b4332]"
                  } shadow-lg`}>
                  <div className="absolute inset-0">
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
                  </div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="font-bold text-base text-white/90 tracking-wide">Heritage</div>
                    <div className="flex items-center gap-2">
                      {isFrozen && (
                        <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-full text-xs backdrop-blur-sm">
                          <Lock className="w-3 h-3" /> Frozen
                        </div>
                      )}
                      <div className="w-9 h-6 rounded bg-gradient-to-r from-yellow-300/80 to-yellow-500/80" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-lg tracking-[0.18em] font-mono text-white/90 mb-3">
                      •••• •••• •••• {card.maskedNumber.slice(-4)}
                    </p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Card Holder</p>
                        <p className="text-sm font-medium tracking-wide uppercase">{card.cardholderName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Expires</p>
                        <p className="text-sm font-medium">{card.expiryDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 space-y-4">
                  {/* Balance info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Current Balance</p>
                      <p className="text-base font-bold text-gray-900"><Currency amount={card.currentBalance} /></p>
                    </div>
                    {isCredit && card.availableCredit !== null && (
                      <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                        <p className="text-xs text-green-600/70 mb-1">Available Credit</p>
                        <p className="text-base font-bold text-green-700"><Currency amount={card.availableCredit} /></p>
                      </div>
                    )}
                  </div>

                  {isCredit && card.rewardsPoints !== undefined && card.rewardsPoints !== null && (
                    <div className="flex items-center justify-between bg-gradient-to-r from-[#1A5C38]/5 to-[#1A5C38]/10 p-3 rounded-xl border border-[#1A5C38]/10">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-[#1A5C38]" />
                        <span className="text-sm font-medium text-[#1A5C38]">Rewards Points</span>
                      </div>
                      <span className="font-bold text-[#1A5C38]">{card.rewardsPoints.toLocaleString()} pts</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isFrozen ? "bg-blue-100" : "bg-gray-100"}`}>
                          {isFrozen ? <Unlock className="w-3.5 h-3.5 text-blue-600" /> : <Lock className="w-3.5 h-3.5 text-gray-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{isFrozen ? "Unfreeze Card" : "Freeze Card"}</p>
                          <p className="text-xs text-gray-400">
                            {isFrozen ? "Card is currently locked" : "Temporarily block new purchases"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isFrozen}
                        disabled={isUpdating}
                        onCheckedChange={() => toggleFreeze(card.id, card.status)}
                        data-testid={`switch-freeze-${card.id}`}
                      />
                    </div>

                    <button className="w-full flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Settings2 className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-800">Card Settings</p>
                        <p className="text-xs text-gray-400">PIN, alerts, and spending limits</p>
                      </div>
                    </button>

                    <button className="w-full flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Plane className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-800">Travel Notice</p>
                        <p className="text-xs text-gray-400">Prevent blocks while traveling abroad</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <CardIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No Cards Found</h3>
            <p className="text-sm text-gray-400 mt-1">No cards are associated with your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
