import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, CheckCircle2, Info, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TAX_DOCS = [
  {
    year: 2025,
    docs: [
      { id: "1099-int-2025", type: "1099-INT", desc: "Interest Income", amount: "$318.42", date: "Jan 31, 2026", status: "Available" },
      { id: "stmt-2025", type: "Year-End Statement", desc: "Account Activity Summary", amount: null, date: "Jan 15, 2026", status: "Available" },
      { id: "escrow-2025", type: "Escrow Analysis", desc: "Mortgage Escrow Statement", amount: null, date: "Feb 01, 2026", status: "Available" },
    ],
  },
  {
    year: 2024,
    docs: [
      { id: "1099-int-2024", type: "1099-INT", desc: "Interest Income", amount: "$274.11", date: "Jan 31, 2025", status: "Available" },
      { id: "stmt-2024", type: "Year-End Statement", desc: "Account Activity Summary", amount: null, date: "Jan 15, 2025", status: "Available" },
      { id: "1098-2024", type: "1098", desc: "Mortgage Interest Statement", amount: "$12,440.00", date: "Jan 31, 2025", status: "Available" },
      { id: "escrow-2024", type: "Escrow Analysis", desc: "Mortgage Escrow Statement", amount: null, date: "Feb 01, 2025", status: "Available" },
    ],
  },
  {
    year: 2023,
    docs: [
      { id: "1099-int-2023", type: "1099-INT", desc: "Interest Income", amount: "$198.65", date: "Jan 31, 2024", status: "Available" },
      { id: "stmt-2023", type: "Year-End Statement", desc: "Account Activity Summary", amount: null, date: "Jan 15, 2024", status: "Available" },
      { id: "1098-2023", type: "1098", desc: "Mortgage Interest Statement", amount: "$13,102.80", date: "Jan 31, 2024", status: "Available" },
    ],
  },
];

const ICONS: Record<string, React.ElementType> = {
  "1099-INT": FileText,
  "Year-End Statement": FileText,
  "1098": FileText,
  "Escrow Analysis": FileText,
};

export default function TaxDocuments() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const years = TAX_DOCS.map(y => y.year);
  const filtered = selectedYear === "all" ? TAX_DOCS : TAX_DOCS.filter(y => y.year === Number(selectedYear));

  function handleDownload(id: string, type: string, year: number) {
    setDownloaded(prev => new Set([...prev, id]));
    toast({
      title: `${type} Downloaded`,
      description: `Your ${year} ${type} has been saved as a PDF.`,
    });
  }

  function handleEmailAll() {
    toast({
      title: "Documents Emailed",
      description: "All available tax documents have been sent to daxemry5855@gmail.com.",
    });
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Tax Documents</h1>
          <p className="text-muted-foreground mt-1">Download your annual tax forms and account statements.</p>
        </div>
        <Button variant="outline" onClick={handleEmailAll} className="gap-2">
          <Mail className="w-4 h-4" /> Email All to Me
        </Button>
      </div>

      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0" />
        Tax documents are typically available by January 31st of the following year. Contact us if you believe a document is missing.
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">Filter by year:</span>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.map(({ year, docs }) => (
        <Card key={year} className="shadow-sm border-border bg-white">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Tax Year {year}
              <Badge variant="secondary" className="ml-auto text-xs">{docs.length} document{docs.length !== 1 ? "s" : ""}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {docs.map(doc => {
                const Icon = ICONS[doc.type] ?? FileText;
                const isDone = downloaded.has(doc.id);
                return (
                  <div key={doc.id} className="flex items-center gap-4 py-4">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{doc.type}</p>
                      <p className="text-xs text-muted-foreground">{doc.desc}{doc.amount ? ` · ${doc.amount}` : ""}</p>
                      <p className="text-xs text-muted-foreground">Available since {doc.date}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">{doc.status}</Badge>
                      <Button
                        size="sm"
                        variant={isDone ? "outline" : "default"}
                        className={`gap-1.5 text-xs ${isDone ? "text-green-700 border-green-300" : "bg-primary hover:bg-primary/90"}`}
                        onClick={() => handleDownload(doc.id, doc.type, year)}
                      >
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                        {isDone ? "Saved" : "Download PDF"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="shadow-sm border-border bg-white">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base">Delivery Preferences</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p>You are enrolled in <strong className="text-foreground">paperless delivery</strong>. Tax documents are available online only.</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p>Email notifications are sent to <strong className="text-foreground">daxemry5855@gmail.com</strong> when documents become available.</p>
          </div>
          <Button variant="outline" size="sm" className="mt-1">Change Delivery Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
}
