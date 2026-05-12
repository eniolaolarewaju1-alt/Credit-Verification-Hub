import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, ChevronLeft, Pencil, CheckCheck, Clock, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Message = { from: "bank" | "member"; text: string; time: string };
type Thread = { id: number; subject: string; category: string; preview: string; date: string; unread: boolean; messages: Message[] };

const INITIAL_THREADS: Thread[] = [
  {
    id: 1,
    subject: "Welcome to Heritage Credit Union Online Banking",
    category: "General",
    preview: "We're glad you're here. This secure inbox lets you contact us anytime.",
    date: "Jan 3, 2026",
    unread: false,
    messages: [
      {
        from: "bank",
        text: "Welcome to Heritage Credit Union's secure online banking portal!\n\nThis inbox lets you send and receive messages directly with our member services team. All messages are encrypted and remain private.\n\nFeel free to reach out with any questions about your accounts, cards, loans, or any other banking needs. We typically respond within 1 business day.\n\nThank you for being a valued Heritage Credit Union member.\n\n— Crestline Bank Member Services",
        time: "Jan 3, 2026 · 9:00 AM",
      },
    ],
  },
  {
    id: 2,
    subject: "Your Auto Loan Payoff Quote",
    category: "Loans",
    preview: "Here is your 10-day payoff quote as requested.",
    date: "Mar 22, 2026",
    unread: false,
    messages: [
      { from: "member", text: "Hi, can I get a 10-day payoff quote for my auto loan? Account ending in 4821.", time: "Mar 21, 2026 · 2:14 PM" },
      {
        from: "bank",
        text: "Hello Dax,\n\nYour 10-day payoff quote for Auto Loan ••••4821 is:\n\nPayoff Amount: $14,382.76\nPer Diem: $4.19\nQuote Valid Through: April 1, 2026\n\nTo pay off your loan, you may transfer funds through Online Banking or visit any branch. Please note this quote includes interest accrued through the payoff date.\n\nLet us know if you have any questions!\n\n— Crestline Loan Services",
        time: "Mar 22, 2026 · 10:07 AM",
      },
    ],
  },
  {
    id: 3,
    subject: "Statement Request — January 2026",
    category: "Account",
    preview: "Your January 2026 statement is ready for download.",
    date: "Feb 4, 2026",
    unread: false,
    messages: [
      { from: "member", text: "Can you send me a copy of my January 2026 statement for my checking account?", time: "Feb 3, 2026 · 11:30 AM" },
      { from: "bank", text: "Hi Dax,\n\nYour January 2026 statement for Heritage Checking ••••7842 is now available in the Statements section of your online portal.\n\nYou can download it directly as a PDF at any time.\n\n— Crestline Bank", time: "Feb 4, 2026 · 8:45 AM" },
    ],
  },
  {
    id: 4,
    subject: "Suspicious Activity — Debit Card",
    category: "Cards",
    preview: "We reviewed the transaction you reported. No fraud detected.",
    date: "Apr 12, 2026",
    unread: true,
    messages: [
      { from: "member", text: "I saw a charge for $47.99 from 'CLOUDSVCS-482' on my debit card on April 10. I don't recognize it. Can you look into this?", time: "Apr 11, 2026 · 7:44 PM" },
      {
        from: "bank",
        text: "Hello Dax,\n\nThank you for contacting us. We reviewed the transaction from CLOUDSVCS-482 on April 10, 2026 for $47.99.\n\nOur records show this charge originated from a recurring subscription tied to a service registered in your name. This does not appear to be fraudulent activity.\n\nIf you still do not recognize this charge, we recommend:\n1. Checking your email for subscription confirmation receipts.\n2. Calling the merchant directly.\n3. If unresolved, we can open a formal dispute — just reply to this message.\n\nWe're here to help!\n— Crestline Fraud & Card Services",
        time: "Apr 12, 2026 · 9:15 AM",
      },
    ],
  },
];

const CATEGORIES = ["General", "Account", "Cards", "Loans", "Transfers", "Dispute", "Other"];

export default function Messages() {
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [composing, setComposing] = useState(false);
  const [reply, setReply] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newBody, setNewBody] = useState("");
  const { toast } = useToast();

  function openThread(t: Thread) {
    setThreads(prev => prev.map(th => th.id === t.id ? { ...th, unread: false } : th));
    setSelected({ ...t, unread: false });
    setComposing(false);
    setReply("");
  }

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    const newMsg: Message = { from: "member", text: reply.trim(), time: "Just now" };
    const updated = { ...selected, messages: [...selected.messages, newMsg], preview: reply.trim(), date: "Just now" };
    setSelected(updated);
    setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
    setReply("");
    toast({ title: "Reply sent", description: "We'll respond within 1 business day." });
  }

  function handleNewMessage(e: React.FormEvent) {
    e.preventDefault();
    const newThread: Thread = {
      id: Date.now(),
      subject: newSubject,
      category: newCategory,
      preview: newBody.trim(),
      date: "Just now",
      unread: false,
      messages: [{ from: "member", text: newBody.trim(), time: "Just now" }],
    };
    setThreads(prev => [newThread, ...prev]);
    setComposing(false);
    setNewSubject("");
    setNewBody("");
    setNewCategory("General");
    toast({ title: "Message sent", description: "We'll respond within 1 business day." });
    setSelected(newThread);
  }

  const unreadCount = threads.filter(t => t.unread).length;

  if (composing) {
    return (
      <div className="max-w-3xl mx-auto p-8 space-y-4">
        <button onClick={() => setComposing(false)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ChevronLeft className="w-4 h-4" /> Back to Inbox
        </button>
        <h2 className="text-xl font-semibold text-foreground">New Message</h2>
        <Card className="shadow-sm border-border bg-white">
          <CardContent className="pt-6">
            <form onSubmit={handleNewMessage} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input placeholder="What is your message about?" value={newSubject} onChange={e => setNewSubject(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea rows={6} placeholder="Describe your question or concern..." value={newBody} onChange={e => setNewBody(e.target.value)} required />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setComposing(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 gap-2"><Send className="w-4 h-4" />Send</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto p-8 space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-1">
          <ChevronLeft className="w-4 h-4" /> Back to Inbox
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{selected.subject}</h2>
            <Badge variant="secondary" className="mt-1 text-xs">{selected.category}</Badge>
          </div>
        </div>
        <Card className="shadow-sm border-border bg-white">
          <CardContent className="pt-6 space-y-5">
            {selected.messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.from === "member" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.from === "bank" ? "bg-primary text-white" : "bg-slate-200 text-slate-700"}`}>
                  {m.from === "bank" ? "HCU" : "ME"}
                </div>
                <div className={`flex-1 max-w-[85%] ${m.from === "member" ? "items-end flex flex-col" : ""}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.from === "bank" ? "bg-slate-100 text-foreground" : "bg-primary text-white"}`}>
                    {m.text}
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 flex items-center gap-1 ${m.from === "member" ? "justify-end" : ""}`}>
                    {m.from === "bank" ? <Clock className="w-3 h-3" /> : <CheckCheck className="w-3 h-3" />}
                    {m.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <form onSubmit={handleReply} className="flex gap-2">
          <Textarea
            rows={2}
            className="flex-1 resize-none"
            placeholder="Write your reply…"
            value={reply}
            onChange={e => setReply(e.target.value)}
          />
          <Button type="submit" className="bg-primary hover:bg-primary/90 self-end gap-1.5">
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" />Messages are encrypted and visible only to you and Heritage Credit Union.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-primary flex items-center gap-2">
            Secure Messages
            {unreadCount > 0 && <Badge className="bg-primary text-white text-xs">{unreadCount} new</Badge>}
          </h1>
          <p className="text-muted-foreground mt-1">Communicate directly with Heritage Credit Union.</p>
        </div>
        <Button onClick={() => setComposing(true)} className="bg-primary hover:bg-primary/90 gap-2">
          <Pencil className="w-4 h-4" /> New Message
        </Button>
      </div>

      <Card className="shadow-sm border-border bg-white">
        <CardContent className="pt-0 divide-y divide-border">
          {threads.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No messages yet.</p>
            </div>
          ) : (
            threads.map(t => (
              <button key={t.id} onClick={() => openThread(t)} className="w-full text-left flex items-start gap-4 py-4 px-2 hover:bg-slate-50 transition-colors rounded-lg">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${t.unread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>{t.subject}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{t.date}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs py-0">{t.category}</Badge>
                    <p className="text-xs text-muted-foreground truncate">{t.preview}</p>
                  </div>
                </div>
                {t.unread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
        <Lock className="w-3 h-3" /> All messages are encrypted end-to-end. We respond within 1 business day.
      </p>
    </div>
  );
}
