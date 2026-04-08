import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Ticket, Search, Copy, RefreshCw, Percent, DollarSign, Calendar, Users, BarChart3, Clock, Loader2, X } from "lucide-react";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: couponsList, isLoading } = trpc.coupons.list.useQuery();

  const createMut = trpc.coupons.create.useMutation({
    onSuccess: () => { toast.success("Kupon oluşturuldu"); utils.coupons.list.invalidate(); setSheetOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.coupons.update.useMutation({
    onSuccess: () => { toast.success("Kupon güncellendi"); utils.coupons.list.invalidate(); setSheetOpen(false); },
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
    setSheetOpen(true);
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

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number | string, color: string }) => (
    <div className={`bg-${color}-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-${color}-100`}>
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
        <Icon className={`w-5 h-5 text-${color}-500`} />
      </div>
      <div>
        <div className={`text-sm font-medium text-${color}-600`}>{label}</div>
        <div className={`text-2xl font-bold text-${color}-800`}>{value}</div>
      </div>
    </div>
  );

  const StatusBadge = ({ coupon }: { coupon: any }) => {
    if (isExpired(coupon)) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-gray-50 text-gray-600 border-gray-200">Süresi Dolmuş</span>;
    if (isLimitReached(coupon)) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200">Limit Doldu</span>;
    if (coupon.isActive) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">Aktif</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-gray-100 text-gray-500 border-gray-200">Pasif</span>;
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kupon Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">İndirim kuponlarını oluşturun ve yönetin.</p>
        </div>
        <Button onClick={() => { resetForm(); setSheetOpen(true); }} className="rounded-xl bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Yeni Kupon
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Ticket} label="Toplam Kupon" value={stats.total} color="orange" />
        <StatCard icon={Clock} label="Aktif Kupon" value={stats.active} color="emerald" />
        <StatCard icon={Users} label="Süresi Dolmuş" value={stats.expired} color="red" />
        <StatCard icon={BarChart3} label="Toplam Kullanım" value={stats.totalUsage} color="blue" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Tüm Kuponlar</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Kupon kodu ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 w-56 text-sm rounded-xl" />
              </div>
            </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 mx-auto">
                <Ticket className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">Aramanızla eşleşen kupon bulunamadı.</p>
            <p className="text-xs text-gray-400 mt-1">Farklı bir anahtar kelime deneyin.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(c => (
              <div key={c.id} className={`px-5 py-3.5 hover:bg-gray-50/50 transition-colors group ${isExpired(c) ? "opacity-60" : ""}`}>
                <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3">
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md">{c.code}</span>
                            <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Kopyalandı"); }} className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        {c.description && <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{c.description}</p>}
                    </div>
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            {c.type === "percentage" ? <Percent className="w-4 h-4 text-gray-400" /> : <DollarSign className="w-4 h-4 text-gray-400" />}
                            <span className="font-medium">{c.type === "percentage" ? `%${c.value}` : formatEUR(c.value)}</span>
                            {(c.maxDiscount ?? 0) > 0 && <span className="text-xs text-gray-400">(Maks: {formatEUR(c.maxDiscount ?? 0)})</span>}
                        </div>
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">
                        <span className="text-gray-400">Min: </span> {(c.minOrderAmount ?? 0) > 0 ? formatEUR(c.minOrderAmount ?? 0) : "—"}
                    </div>
                    <div className="col-span-2">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{c.usageCount} / {c.usageLimit || "∞"}</span>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full">
                                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${c.usageLimit ? Math.min(100, (c.usageCount / c.usageLimit) * 100) : 0}%` }} />
                            </div>
                        </div>
                    </div>
                    <div className="col-span-1">
                        <StatusBadge coupon={c} />
                    </div>
                    <div className="col-span-2 flex justify-end items-center gap-2">
                        <div className="text-xs text-gray-500 text-right">
                            <div>{new Date(c.validFrom).toLocaleDateString("tr-TR")}</div>
                            <div>{new Date(c.validUntil).toLocaleDateString("tr-TR")}</div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(c)} className="h-8 w-8 rounded-lg"><Edit className="w-4 h-4" /></Button>
                            <Button variant="outline" size="icon" onClick={() => setDeleteId(c.id)} className="h-8 w-8 rounded-lg border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">{editingId ? "Kupon Düzenle" : "Yeni Kupon Oluştur"}</SheetTitle>
            <SheetDescription>Kuponun özelliklerini, limitlerini ve geçerlilik tarihlerini belirleyin.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Kupon Kodu *</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="FG-XXXX" required disabled={!!editingId} className="rounded-xl" />
                  {!editingId && <Button type="button" variant="outline" size="icon" onClick={() => setForm({ ...form, code: generateCode() })} className="rounded-xl shrink-0"><RefreshCw className="w-4 h-4" /></Button>}
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Tip *</Label>
                <Select value={form.type} onValueChange={(v: "percentage" | "fixed") => setForm({ ...form, type: v })} disabled={!!editingId}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Yüzde (%)</SelectItem>
                    <SelectItem value="fixed">Sabit Tutar (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Değer *</Label>
                <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} className="mt-1.5 rounded-xl" required disabled={!!editingId} />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Min. Sipariş (cent)</Label>
                <Input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })} className="mt-1.5 rounded-xl" disabled={!!editingId} />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Maks. İndirim (cent)</Label>
                <Input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })} className="mt-1.5 rounded-xl" disabled={!!editingId} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Toplam Kullanım Limiti</Label>
                <Input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })} className="mt-1.5 rounded-xl" placeholder="0 = sınırsız" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Kişi Başı Limit</Label>
                <Input type="number" value={form.perUserLimit} onChange={e => setForm({ ...form, perUserLimit: Number(e.target.value) })} className="mt-1.5 rounded-xl" disabled={!!editingId} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Başlangıç *</Label>
                <Input type="datetime-local" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} className="mt-1.5 rounded-xl" required disabled={!!editingId} />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Bitiş *</Label>
                <Input type="datetime-local" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} className="mt-1.5 rounded-xl" required />
              </div>
            </div>
            <div>
              <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Açıklama</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1.5 resize-none rounded-xl" rows={3} placeholder="Kupon açıklaması..." disabled={!!editingId} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="rounded-xl">İptal</Button>
              <Button type="submit" className="rounded-xl bg-orange-500 hover:bg-orange-600" disabled={createMut.isPending || updateMut.isPending}>
                {createMut.isPending || updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Değişiklikleri Kaydet" : "Kupon Oluştur"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 max-w-sm shadow-2xl w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900">Kuponu Sil</h3>
                <p className="text-sm text-gray-500 mt-1">Bu kupon kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?</p>
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">İptal</Button>
                    <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteId && deleteMut.mutate({ id: deleteId })} className="rounded-xl bg-red-500 hover:bg-red-600">
                        {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Evet, Sil"}
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
