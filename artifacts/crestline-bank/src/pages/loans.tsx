import { useGetLoans } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Currency } from "@/components/currency";
import { Car, Home as HomeIcon, GraduationCap, Coins, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const getLoanIcon = (type: string) => {
  switch (type) {
    case 'auto': return Car;
    case 'home': return HomeIcon;
    case 'student': return GraduationCap;
    default: return Coins;
  }
};

export default function Loans() {
  const { data: loans, isLoading } = useGetLoans();

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary" data-testid="text-page-title">Loans & Lines of Credit</h1>
        <p className="text-muted-foreground mt-1">Track your progress and manage payments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="shadow-sm border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : loans && loans.length > 0 ? (
          loans.map(loan => {
            const Icon = getLoanIcon(loan.type);
            const progress = ((loan.originalAmount - loan.currentBalance) / loan.originalAmount) * 100;
            
            return (
              <Card key={loan.id} className="shadow-sm border-border bg-white" data-testid={`loan-card-${loan.id}`}>
                <CardHeader className="pb-2 border-b border-border mb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sidebar/10 text-sidebar flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground font-medium">
                          {loan.nickname || `${loan.type.charAt(0).toUpperCase() + loan.type.slice(1)} Loan`}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Acct ending in {loan.id.toString().slice(-4)}</p>
                      </div>
                    </div>
                    <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className={loan.status === 'active' ? 'bg-success hover:bg-success/80' : ''}>
                      {loan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-semibold text-foreground">
                        <Currency amount={loan.currentBalance} />
                      </span>
                      <span className="text-sm text-muted-foreground mb-1">
                        / <Currency amount={loan.originalAmount} />
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{Math.round(progress)}% Paid off</span>
                      <span>{loan.termMonths} month term</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-border">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Interest Rate
                        <Tooltip>
                          <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent>Fixed Annual Percentage Rate</TooltipContent>
                        </Tooltip>
                      </p>
                      <p className="font-medium text-foreground mt-1">{loan.interestRate.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Next Payment</p>
                      <p className="font-medium text-foreground mt-1 text-primary">
                        <Currency amount={loan.nextPaymentAmount} />
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Due {new Date(loan.nextPaymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button className="w-full" variant="outline" data-testid={`button-pay-loan-${loan.id}`}>
                    Make a Payment
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-16 bg-white rounded-xl border border-dashed border-border">
            <Coins className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No Active Loans</h3>
            <p className="text-muted-foreground mt-1 mb-4">You don't have any loans with Crestline Bank.</p>
            <Button>Explore Loan Options</Button>
          </div>
        )}
      </div>
    </div>
  );
}
