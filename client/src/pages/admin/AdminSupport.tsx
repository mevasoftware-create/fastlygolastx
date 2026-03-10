import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LifeBuoy, Search, RefreshCw, MessageSquare, Clock, CheckCircle2, AlertCircle, User, Send, ChevronRight, Filter } from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Açık", color: "bg-blue-100 text-blue-700 border-blue-200", icon: AlertCircle },
  in_progress: { label: "İşleniyor", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  waiting_customer: { label: "Müşteri Bekleniyor", color: "bg-purple-100 text-purple-700 border-purple-200", icon: User },
  resolved: { label: "Çözüldü", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  closed: { label: "Kapatıldı", color: "bg-gray-100 text-gray-600 border-gray-200", icon: CheckCircle2 },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: "Düşük", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Orta", color: "bg-blue-100 text-blue-600" },
  high: { label: "Yüksek", color: "bg-orange-100 text-orange-600" },
  urgent: { label: "Acil", color: "bg-red-100 text-red-600" },
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
  const { data: tickets, isLoading } = trpc.admin.getSupportTickets.useQuery();

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
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: messages } = trpc.admin.getSupportTicketMessages.useQuery(
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
    updateStatusMut.mutate({ ticketId, status });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-orange-500" /> Destek Talepleri
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Müşteri destek taleplerini yönetin</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => utils.admin.getSupportTickets.invalidate()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Yenile
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4"><div className="text-2xl font-bold text-blue-700">{stats.total}</div><div className="text-xs text-blue-600 mt-0.5">Toplam Talep</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4"><div className="text-2xl font-bold text-orange-700">{stats.open}</div><div className="text-xs text-orange-600 mt-0.5">Açık</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4"><div className="text-2xl font-bold text-yellow-700">{stats.inProgress}</div><div className="text-xs text-yellow-600 mt-0.5">İşleniyor</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4"><div className="text-2xl font-bold text-green-700">{stats.resolved}</div><div className="text-xs text-green-600 mt-0.5">Çözüldü</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Talepler</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-40 text-sm"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="open">Açık</SelectItem>
                  <SelectItem value="in_progress">İşleniyor</SelectItem>
                  <SelectItem value="waiting_customer">Müşteri Bekleniyor</SelectItem>
                  <SelectItem value="resolved">Çözüldü</SelectItem>
                  <SelectItem value="closed">Kapatıldı</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-48 text-sm" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <LifeBuoy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Destek talebi bulunamadı</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  <TableHead>Talep No</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t: any) => {
                  const st = STATUS_MAP[t.status] || STATUS_MAP.open;
                  const pr = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium;
                  return (
                    <TableRow key={t.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelectedTicket(t)}>
                      <TableCell><span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{t.ticketNumber}</span></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">{t.userName?.charAt(0) || "?"}</div>
                          <div><div className="text-sm font-medium">{t.userName || "—"}</div><div className="text-xs text-gray-400">{t.userEmail}</div></div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]"><p className="text-sm font-medium truncate">{t.subject}</p></TableCell>
                      <TableCell><span className="text-xs text-gray-500">{CATEGORY_MAP[t.category] || t.category}</span></TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs ${pr.color}`}>{pr.label}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs gap-1 ${st.color}`}><st.icon className="w-3 h-3" />{st.label}</Badge></TableCell>
                      <TableCell className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" className="h-7 px-2"><ChevronRight className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                  {selectedTicket.ticketNumber} - {selectedTicket.subject}
                </DialogTitle>
                <DialogDescription>
                  {selectedTicket.userName} | {CATEGORY_MAP[selectedTicket.category]} | {new Date(selectedTicket.createdAt).toLocaleString("tr-TR")}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-2 py-2">
                <Label className="text-xs text-gray-500">Durum:</Label>
                <Select value={newStatus || selectedTicket.status} onValueChange={(v) => { setNewStatus(v); handleStatusChange(selectedTicket.id, v); }}>
                  <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label className="text-xs text-gray-500 ml-4">Öncelik:</Label>
                <Badge variant="outline" className={`text-xs ${PRIORITY_MAP[selectedTicket.priority]?.color}`}>
                  {PRIORITY_MAP[selectedTicket.priority]?.label}
                </Badge>
              </div>

              <div className="border rounded-lg p-3 bg-gray-50 text-sm text-gray-700">
                <p className="font-medium text-xs text-gray-500 mb-1">Açıklama:</p>
                {selectedTicket.description}
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded-lg p-3">
                <p className="font-medium text-xs text-gray-500">Mesajlar:</p>
                {!messages || messages.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Henüz mesaj yok</p>
                ) : (
                  messages.map((m: any) => (
                    <div key={m.id} className={`p-3 rounded-lg text-sm ${m.isInternal ? "bg-yellow-50 border border-yellow-200" : m.isAdmin ? "bg-orange-50 border border-orange-200" : "bg-white border"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs">{m.userName || "Kullanıcı"} {m.isInternal && <span className="text-yellow-600">(İç Not)</span>} {m.isAdmin && <span className="text-orange-600">(Admin)</span>}</span>
                        <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString("tr-TR")}</span>
                      </div>
                      <p className="text-gray-700">{m.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Yanıtınızı yazın..." className="resize-none" rows={2} />
                <Button onClick={handleReply} disabled={!replyText.trim() || replyMut.isPending} className="bg-orange-500 hover:bg-orange-600 self-end px-4">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
