import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeBuoy, Search, RefreshCw, MessageSquare, Clock, CheckCircle2, AlertCircle, User, Send, ChevronRight, Filter, Loader2, Inbox } from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Açık", color: "border-blue-200 bg-blue-50 text-blue-700", icon: AlertCircle },
  in_progress: { label: "İşleniyor", color: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  waiting_customer: { label: "Müşteri Bekleniyor", color: "border-purple-200 bg-purple-50 text-purple-700", icon: User },
  resolved: { label: "Çözüldü", color: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  closed: { label: "Kapatıldı", color: "border-gray-200 bg-gray-100 text-gray-600", icon: CheckCircle2 },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: "Düşük", color: "border-gray-200 bg-gray-100 text-gray-600" },
  medium: { label: "Orta", color: "border-blue-200 bg-blue-50 text-blue-700" },
  high: { label: "Yüksek", color: "border-orange-200 bg-orange-50 text-orange-700" },
  urgent: { label: "Acil", color: "border-red-200 bg-red-50 text-red-700" },
};

const CATEGORY_MAP: Record<string, string> = {
  order: "Sipariş", payment: "Ödeme", account: "Hesap", technical: "Teknik", other: "Diğer",
};

export function AdminSupport() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const utils = trpc.useUtils();
  const { data: tickets, isLoading, isRefetching } = trpc.admin.getSupportTickets.useQuery();

  const replyMut = trpc.admin.replySupportTicket.useMutation({
    onSuccess: () => {
      toast.success("Yanıt gönderildi");
      utils.admin.getSupportTickets.invalidate();
      utils.admin.getSupportTicketMessages.invalidate({ ticketId: selectedTicket?.id });
      setReplyText("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatusMut = trpc.admin.updateSupportTicketStatus.useMutation({
    onSuccess: () => {
      toast.success("Durum güncellendi");
      utils.admin.getSupportTickets.invalidate();
      setSelectedTicket((prev: any) => prev ? { ...prev, status: newStatus } : null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: messages, isLoading: isLoadingMessages } = trpc.admin.getSupportTicketMessages.useQuery(
    { ticketId: selectedTicket?.id || 0 },
    { enabled: !!selectedTicket }
  );

  const stats = useMemo(() => {
    if (!tickets) return { total: 0, open: 0, inProgress: 0, resolved: 0 };
    return {
      total: tickets.length,
      open: tickets.filter((t: any) => t.status === "open").length,
      inProgress: tickets.filter((t: any) => t.status === "in_progress").length,
      resolved: tickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length,
    };
  }, [tickets]);

  const filtered = (tickets || []).filter((t: any) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (!search) return true;
    return t.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.userName?.toLowerCase().includes(search.toLowerCase());
  });

  const handleReply = () => {
    if (!replyText.trim() || !selectedTicket) return;
    replyMut.mutate({ ticketId: selectedTicket.id, message: replyText });
  };

  const handleStatusChange = (ticketId: number, status: string) => {
    setNewStatus(status);
    updateStatusMut.mutate({ ticketId, status });
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) => (
    <div className={`bg-${color}-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-${color}-100`}>
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
        <Icon className={`w-5 h-5 text-${color}-500`} />
      </div>
      <div>
        <div className={`text-2xl font-bold text-${color}-700`}>{value}</div>
        <div className={`text-xs text-${color}-600 mt-0.5`}>{title}</div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Destek Talepleri</h1>
          <p className="text-sm text-gray-500 mt-0.5">Müşteri destek taleplerini yönetin ve çözümleyin.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => utils.admin.getSupportTickets.invalidate()} className="gap-1.5 rounded-xl">
          {isRefetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} 
          Yenile
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Toplam Talep" value={stats.total} icon={LifeBuoy} color="blue" />
        <StatCard title="Açık" value={stats.open} icon={AlertCircle} color="orange" />
        <StatCard title="İşleniyor" value={stats.inProgress} icon={Clock} color="amber" />
        <StatCard title="Çözüldü" value={stats.resolved} icon={CheckCircle2} color="emerald" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-3 flex items-center justify-between border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Talep no, konu, kullanıcı..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 w-64 rounded-xl bg-gray-50 border-gray-100" />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 rounded-xl w-48 text-sm bg-gray-50 border-gray-100"><Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {Object.entries(STATUS_MAP).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">Destek talebi bulunamadı</p>
            <p className="text-xs text-gray-400 mt-1">Filtreleri değiştirmeyi veya yeni talepleri kontrol etmeyi deneyin.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((t: any) => {
              const st = STATUS_MAP[t.status] || STATUS_MAP.open;
              const pr = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium;
              return (
                <div key={t.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors group cursor-pointer grid grid-cols-12 items-center gap-4" onClick={() => setSelectedTicket(t)}>
                  <div className="col-span-2 lg:col-span-1 font-mono text-xs font-semibold text-gray-600">#{t.ticketNumber}</div>
                  <div className="col-span-10 lg:col-span-3">
                    <p className="text-sm font-semibold text-gray-800 truncate">{t.subject}</p>
                    <p className="text-xs text-gray-500">{t.userName || "-"}</p>
                  </div>
                  <div className="col-span-4 lg:col-span-2"><span className="text-xs text-gray-500 font-medium">{CATEGORY_MAP[t.category] || t.category}</span></div>
                  <div className="col-span-4 lg:col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${pr.color}`}>{pr.label}</span>
                  </div>
                  <div className="col-span-4 lg:col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${st.color}`}><st.icon className="w-3 h-3" />{st.label}</span>
                  </div>
                  <div className="col-span-12 lg:col-span-2 flex items-center justify-end gap-4">
                    <span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString("tr-TR")}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedTicket && (
            <>
              <SheetHeader className="pr-12">
                <SheetTitle className="text-lg font-bold text-gray-900 tracking-tight">{selectedTicket.subject}</SheetTitle>
                <SheetDescription className="text-xs text-gray-500">
                  <span className="font-mono">#{selectedTicket.ticketNumber}</span> | {selectedTicket.userName} | {new Date(selectedTicket.createdAt).toLocaleString("tr-TR")}
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Durum</Label>
                    <Select value={newStatus || selectedTicket.status} onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}>
                      <SelectTrigger className="h-8 w-40 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Öncelik</Label>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${PRIORITY_MAP[selectedTicket.priority]?.color}`}>
                      {PRIORITY_MAP[selectedTicket.priority]?.label}
                    </span>
                  </div>
                </div>

                <div className="border rounded-xl p-4 bg-gray-50/80 text-sm text-gray-800 space-y-2">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Açıklama</p>
                  <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Mesajlar</h3>
                  {isLoadingMessages ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
                  ) : (
                    <div className="space-y-4">
                      {messages?.map((msg: any, idx: number) => (
                        <div key={idx} className={`flex gap-3 ${msg.isFromAdmin ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${msg.isFromAdmin ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            {msg.isFromAdmin ? 'A' : selectedTicket.userName?.charAt(0)}
                          </div>
                          <div className={`p-3 rounded-xl max-w-md ${msg.isFromAdmin ? 'bg-orange-50 text-orange-900 rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-right text-[10px] mt-2 ${msg.isFromAdmin ? 'text-orange-400' : 'text-gray-400'}`}>{new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="reply" className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Yanıt Yaz</Label>
                  <Textarea id="reply" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Müşteriye yanıtınızı buraya yazın..." className="rounded-xl min-h-[100px]" />
                  <div className="flex justify-end">
                    <Button onClick={handleReply} disabled={replyMut.isPending || !replyText.trim()} className="rounded-xl bg-orange-500 hover:bg-orange-600 gap-2">
                      {replyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Yanıtı Gönder
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
