import { useMemo } from "react";
import { useGetStatements, useGetAccounts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Statements() {
  const { data: statements, isLoading: isLoadingStatements } = useGetStatements();
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccounts();
  const { toast } = useToast();

  const groupedStatements = useMemo(() => {
    if (!statements || !accounts) return {};
    
    return statements.reduce((acc, statement) => {
      const account = accounts.find(a => a.id === statement.accountId);
      const accountKey = account ? `${account.nickname || account.type} (...${account.maskedNumber})` : `Account #${statement.accountId}`;
      
      if (!acc[accountKey]) acc[accountKey] = [];
      acc[accountKey].push(statement);
      return acc;
    }, {} as Record<string, typeof statements>);
  }, [statements, accounts]);

  const handleDownload = (pdfUrl: string, period: string) => {
    toast({
      title: "Downloading Statement",
      description: `Your statement for ${period} is being downloaded.`,
    });
    // Visual only - normally would window.open(pdfUrl)
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-primary" data-testid="text-page-title">Statements & Tax Forms</h1>
        <p className="text-muted-foreground mt-1">Access your monthly statements and annual tax documents.</p>
      </div>

      <div className="space-y-8">
        {isLoadingStatements || isLoadingAccounts ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : Object.keys(groupedStatements).length > 0 ? (
          Object.entries(groupedStatements).map(([accountName, accStatements]) => (
            <div key={accountName} className="space-y-4">
              <h2 className="text-lg font-medium text-foreground border-b border-border pb-2">{accountName}</h2>
              <div className="bg-white rounded-lg border border-border overflow-hidden">
                <div className="divide-y divide-border">
                  {accStatements.map(statement => (
                    <div key={statement.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-sidebar/10 text-sidebar flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{statement.period} Statement</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(statement.startDate).toLocaleDateString()} - {new Date(statement.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex gap-8 text-sm text-right px-8">
                        <div>
                          <p className="text-muted-foreground text-xs">Deposits</p>
                          <p className="font-medium text-success">${statement.totalCredits.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Withdrawals</p>
                          <p className="font-medium text-destructive">${statement.totalDebits.toLocaleString()}</p>
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDownload(statement.pdfUrl, statement.period)}
                        className="gap-2 text-primary"
                        data-testid={`btn-download-${statement.id}`}
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download PDF</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p>No statements available at this time.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
