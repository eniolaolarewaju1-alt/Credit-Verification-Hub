import { useState } from "react";
import { useGetCards } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Currency } from "@/components/currency";
import { CreditCard as CardIcon, Lock, Settings2, Plane, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Cards() {
  const { data: cards, isLoading } = useGetCards();
  const { toast } = useToast();
  
  // Local state just for UI demonstration of toggling freeze
  const [frozenCards, setFrozenCards] = useState<Record<number, boolean>>({});

  const toggleFreeze = (cardId: number, currentFrozen: boolean) => {
    const willBeFrozen = !currentFrozen;
    setFrozenCards(prev => ({ ...prev, [cardId]: willBeFrozen }));
    
    toast({
      title: willBeFrozen ? "Card Frozen" : "Card Unfrozen",
      description: willBeFrozen ? "Your card has been temporarily locked." : "Your card is now active and ready to use.",
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="text-page-title">Cards</h1>
        <p className="text-muted-foreground mt-1">Manage your Heritage Credit Union credit and debit cards.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            const isFrozen = frozenCards[card.id] !== undefined ? frozenCards[card.id] : card.status === 'frozen';
            const isCredit = card.type === 'credit';

            return (
              <Card key={card.id} className="shadow-sm border-border bg-white overflow-hidden" data-testid={`card-item-${card.id}`}>
                <CardContent className="p-0">
                  {/* Visual Card Representation */}
                  <div className={`m-6 h-48 rounded-xl p-6 relative overflow-hidden text-white flex flex-col justify-between ${
                    isFrozen ? 'bg-gray-400' : isCredit ? 'bg-gradient-to-br from-primary to-blue-800 shadow-xl' : 'bg-gradient-to-br from-sidebar to-sidebar-accent shadow-lg'
                  }`}>
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <div className="font-serif font-bold text-lg tracking-wider opacity-90">Heritage</div>
                      {isFrozen && (
                        <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-md text-xs backdrop-blur-sm">
                          <Lock className="w-3 h-3" /> Locked
                        </div>
                      )}
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                      <div className="text-xl tracking-[0.2em] font-mono">
                        •••• •••• •••• {card.maskedNumber.slice(-4)}
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="uppercase text-sm font-medium tracking-widest opacity-80">
                          {card.cardholderName}
                        </div>
                        <div className="text-sm font-medium">
                          {card.expiryDate}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 space-y-6">
                    {/* Card Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                        <p className="text-lg font-semibold text-foreground"><Currency amount={card.currentBalance} /></p>
                      </div>
                      {isCredit && card.availableCredit !== null && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Available Credit</p>
                          <p className="text-lg font-semibold text-success"><Currency amount={card.availableCredit} /></p>
                        </div>
                      )}
                    </div>

                    {isCredit && card.rewardsPoints !== undefined && card.rewardsPoints !== null && (
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-white">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Rewards Balance</span>
                        </div>
                        <span className="font-semibold text-primary">{card.rewardsPoints.toLocaleString()} pts</span>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isFrozen ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Freeze Card</p>
                            <p className="text-xs text-muted-foreground">Temporarily block new purchases</p>
                          </div>
                        </div>
                        <Switch 
                          checked={isFrozen} 
                          onCheckedChange={() => toggleFreeze(card.id, isFrozen)}
                          data-testid={`switch-freeze-${card.id}`}
                        />
                      </div>
                      
                      <button className="w-full flex items-center justify-between p-3 border border-border rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                            <Settings2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Card Settings</p>
                            <p className="text-xs text-muted-foreground">PIN, alerts, and limits</p>
                          </div>
                        </div>
                      </button>

                      <button className="w-full flex items-center justify-between p-3 border border-border rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                            <Plane className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Travel Notice</p>
                            <p className="text-xs text-muted-foreground">Prevent blocks while traveling</p>
                          </div>
                        </div>
                      </button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-16 bg-white rounded-xl border border-dashed border-border">
            <CardIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No Cards Found</h3>
            <p className="text-muted-foreground mt-1 mb-4">We couldn't find any cards associated with your profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
