import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Ticket, Search, Copy, RefreshCw, Percent, DollarSign, Calendar, Users, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatEUR } from "@/lib/formatEUR";

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "FG-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface CouponForm {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  perUserLimit: number;
  validFrom: string;
  validUntil: string;
  description: string;
}

const emptyForm: CouponForm = {
  code: "", type: "percentage", value: 10, minOrderAmount: 0, maxDiscount: 0,
  usageLimit: 0, perUserLimit: 1, validFrom: new Date().toISOString().slice(0, 16),
  validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16), description: "",
};

export function AdminCoupons() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: couponsList, isLoading } = trpc.coupons.list.useQuery();

  const createMut = trpc.coupons.create.useMutation({
    onSuccess: () => { toast.success("Kupon oluşturuldu"); utils.coupons.list.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.coupons.update.useMutation({
    onSuccess: () => { toast.success("Kupon güncellendi"); utils.coupons.list.invalidate(); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.coupons.delete.useMutation({
    onSuccess: () => { toast.success("Kupon silindi"); utils.coupons.list.invalidate(); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    if (!couponsList) return { total: 0, active: 0, expired: 0, totalUsage: 0 };
    const now = new Date();
    return {
      total: couponsList.length,
      active: couponsList.filter((c: any) => c.isActive && new Date(c.validUntil) > now).length,
      expired: couponsList.filter((c: any) => new Date(c.validUntil) <= now).length,
      totalUsage: couponsList.reduce((s: number, c: any) => s + (c.usageCount || 0), 0),
    };
  }, [couponsList]);

  const filtered = (couponsList || []).filter((c: any) => {
    if (!search) return true;
    return c.code.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      code: c.code, type: c.type, value: c.value,
      minOrderAmount: c.minOrderAmount || 0, maxDiscount: c.maxDiscount || 0,
      usageLimit: c.usageLimit || 0, perUserLimit: c.perUserLimit || 1,
      validFrom: new Date(c.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(c.validUntil).toISOString().slice(0, 16),
      description: c.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMut.mutate({
        id: editingId,
        isActive: true,
        usageLimit: form.usageLimit || undefined,
        validUntil: new Date(form.validUntil),
      });
    } else {
      createMut.mutate({
        code: form.code, type: form.type, value: form.value,
        minOrderAmount: form.minOrderAmount || undefined,
        maxDiscount: form.maxDiscount || undefined,
        usageLimit: form.usageLimit || undefined,
        perUserLimit: form.perUserLimit,
        validFrom: new Date(form.validFrom),
        validUntil: new Date(form.validUntil),
        description: form.description || undefined,
      });
    }
  };

  const resetForm = () => { setForm({ ...emptyForm, code: generateCode() }); setEditingId(null); };
  const isExpired = (c: any) => new Date(c.validUntil) <= new Date();
  const isLimitReached = (c: any) => c.usageLimit && c.usageCount >= c.usageLimit;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="w-7 h-7 text-orange-500" /> Kupon Yönetimi
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">İndirim kuponlarını oluşturun ve yönetin</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Yeni Kupon
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Ticket className="w-4 h-4 text-orange-600" /><span className="text-xs text-orange-600">Toplam</span></div><div className="text-2xl font-bold text-orange-700">{stats.total}</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-xs text-green-600">Aktif</span></div><div className="text-2xl font-bold text-green-700">{stats.active}</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-red-600" /><span className="text-xs text-red-600">Süresi Dolmuş</span></div><div className="text-2xl font-bold text-red-700">{stats.expired}</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><BarChart3 className="w-4 h-4 text-purple-600" /><span className="text-xs text-purple-600">Toplam Kullanım</span></div><div className="text-2xl font-bold text-purple-700">{stats.totalUsage}</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Kuponlar</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Kupon kodu ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-48 text-sm" />
              </div>
              <Button variant="outline" size="sm" onClick={() => utils.coupons.list.invalidate()} className="gap-1.5 h-9">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Kupon bulunamadı</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  <TableHead>Kupon Kodu</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Değer</TableHead>
                  <TableHead>Min. Sipariş</TableHead>
                  <TableHead>Kullanım</TableHead>
                  <TableHead>Geçerlilik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id} className={`hover:bg-gray-50/50 ${isExpired(c) ? "opacity-50" : ""}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm bg-orange-50 text-orange-700 px-2 py-0.5 rounded">{c.code}</span>
                        <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Kopyalandı"); }} className="text-gray-300 hover:text-gray-500">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {c.description && <p className="text-xs text-gray-400 mt-0.5 max-w-[150px] truncate">{c.description}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-xs">
                        {c.type === "percentage" ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                        {c.type === "percentage" ? "Yüzde" : "Sabit"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {c.type === "percentage" ? `%${c.value}` : formatEUR(c.value)}
                      {c.maxDiscount ? <span className="text-xs text-gray-400 block">Maks: {formatEUR(c.maxDiscount)}</span> : null}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {c.minOrderAmount ? formatEUR(c.minOrderAmount) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">{c.usageCount}</span>
                        <span className="text-gray-400 text-xs">/ {c.usageLimit || "∞"}</span>
                      </div>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${c.usageLimit ? Math.min(100, (c.usageCount / c.usageLimit) * 100) : 10}%` }} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(c.validFrom).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <span className="text-gray-300">→</span>
                          {new Date(c.validUntil).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isExpired(c) ? (
                        <Badge variant="secondary" className="text-xs">Süresi Dolmuş</Badge>
                      ) : isLimitReached(c) ? (
                        <Badge variant="secondary" className="text-xs bg-yellow-50 text-yellow-700">Limit Doldu</Badge>
                      ) : c.isActive ? (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Pasif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(c)} className="h-7 px-2"><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteId(c.id)} className="h-7 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Ticket className="w-5 h-5 text-orange-500" />{editingId ? "Kupon Düzenle" : "Yeni Kupon"}</DialogTitle>
            <DialogDescription>Kupon detaylarını girin</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Kupon Kodu *</Label>
                <div className="flex gap-1 mt-1">
                  <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="FG-XXXX" required disabled={!!editingId} />
                  {!editingId && <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, code: generateCode() })} className="px-2 shrink-0"><RefreshCw className="w-3.5 h-3.5" /></Button>}
                </div>
              </div>
              <div>
                <Label className="text-xs">Tip *</Label>
                <Select value={form.type} onValueChange={(v: "percentage" | "fixed") => setForm({ ...form, type: v })} disabled={!!editingId}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Yüzde (%)</SelectItem>
                    <SelectItem value="fixed">Sabit Tutar (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Değer *</Label>
                <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} className="mt-1" required disabled={!!editingId} />
                <span className="text-xs text-gray-400">{form.type === "percentage" ? "%" : "cent"}</span>
              </div>
              <div>
                <Label className="text-xs">Min. Sipariş (cent)</Label>
                <Input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })} className="mt-1" disabled={!!editingId} />
              </div>
              <div>
                <Label className="text-xs">Maks. İndirim (cent)</Label>
                <Input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })} className="mt-1" disabled={!!editingId} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Toplam Kullanım Limiti</Label>
                <Input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })} className="mt-1" placeholder="0 = sınırsız" />
              </div>
              <div>
                <Label className="text-xs">Kişi Başı Limit</Label>
                <Input type="number" value={form.perUserLimit} onChange={e => setForm({ ...form, perUserLimit: Number(e.target.value) })} className="mt-1" disabled={!!editingId} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Başlangıç *</Label>
                <Input type="datetime-local" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} className="mt-1" required disabled={!!editingId} />
              </div>
              <div>
                <Label className="text-xs">Bitiş *</Label>
                <Input type="datetime-local" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} className="mt-1" required />
              </div>
            </div>
            <div>
              <Label className="text-xs">Açıklama</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 resize-none" rows={2} placeholder="Kupon açıklaması..." disabled={!!editingId} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={createMut.isPending || updateMut.isPending}>
                {createMut.isPending || updateMut.isPending ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kuponu Sil</DialogTitle>
            <DialogDescription>Bu kupon kalıcı olarak silinecek. Emin misiniz?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>İptal</Button>
            <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteId && deleteMut.mutate({ id: deleteId })}>
              {deleteMut.isPending ? "Siliniyor..." : "Sil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
