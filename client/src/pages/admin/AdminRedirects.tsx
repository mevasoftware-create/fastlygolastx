import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Plus, Edit, Trash2, Search, RefreshCw, ExternalLink, ArrowRight, BarChart3, Loader2, PackageX } from "lucide-react";
import { toast } from "sonner";

interface RedirectForm {
  sourceUrl: string;
  targetUrl: string;
  redirectType: "301" | "302";
  description: string;
}

const emptyForm: RedirectForm = { sourceUrl: "", targetUrl: "", redirectType: "301", description: "" };

export function AdminRedirects() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RedirectForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: redirectsList, isLoading } = trpc.admin.getAllRedirects.useQuery();

  const createMut = trpc.admin.createRedirect.useMutation({
    onSuccess: () => { toast.success("Yönlendirme oluşturuldu"); utils.admin.getAllRedirects.invalidate(); setSheetOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMut = trpc.admin.updateRedirect.useMutation({
    onSuccess: () => { toast.success("Yönlendirme güncellendi"); utils.admin.getAllRedirects.invalidate(); setSheetOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = trpc.admin.deleteRedirect.useMutation({
    onSuccess: () => { toast.success("Yönlendirme silindi"); utils.admin.getAllRedirects.invalidate(); setDeleteId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    if (!redirectsList) return { total: 0, active: 0, totalHits: 0 };
    return {
      total: redirectsList.length,
      active: redirectsList.filter((r: any) => r.isActive).length,
      totalHits: redirectsList.reduce((s: number, r: any) => s + (r.hitCount || 0), 0),
    };
  }, [redirectsList]);

  const filtered = (redirectsList || []).filter((r: any) => {
    if (!search) return true;
    return r.sourceUrl?.toLowerCase().includes(search.toLowerCase()) || r.targetUrl?.toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = (r: any) => {
    setEditingId(r.id);
    setForm({ sourceUrl: r.sourceUrl, targetUrl: r.targetUrl, redirectType: r.redirectType, description: r.description || "" });
    setSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMut.mutate({ id: editingId, ...form });
    } else {
      createMut.mutate({ ...form, description: form.description || undefined });
    }
  };

  const toggleActive = (r: any) => {
    updateMut.mutate({ id: r.id, isActive: !r.isActive });
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">URL Yönlendirmeleri</h1>
        <p className="text-sm text-gray-500 mt-0.5">URL yönlendirmelerini yönetin (301/302)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-blue-100">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><ArrowRightLeft className="w-5 h-5 text-blue-500" /></div>
            <div>
                <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                <div className="text-xs text-blue-600">Toplam Yönlendirme</div>
            </div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-emerald-100">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><RefreshCw className="w-5 h-5 text-emerald-500" /></div>
            <div>
                <div className="text-2xl font-bold text-emerald-700">{stats.active}</div>
                <div className="text-xs text-emerald-600">Aktif Yönlendirme</div>
            </div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-amber-100">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><BarChart3 className="w-5 h-5 text-amber-500" /></div>
            <div>
                <div className="text-2xl font-bold text-amber-700">{stats.totalHits}</div>
                <div className="text-xs text-amber-600">Toplam Hit</div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-4 flex items-center justify-between">
            <div className="relative w-full max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="URL ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl w-full text-sm" />
            </div>
            <Button onClick={() => { setForm(emptyForm); setEditingId(null); setSheetOpen(true); }} className="rounded-xl bg-orange-500 hover:bg-orange-600 gap-2">
                <Plus className="w-4 h-4" /> Yeni Yönlendirme
            </Button>
        </div>

        {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="mt-3 text-sm font-medium">Yönlendirmeler yükleniyor...</p>
            </div>
        ) : filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                    <PackageX className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">Yönlendirme bulunamadı</p>
                <p className="text-xs text-gray-500 mt-1">Arama kriterlerinizi değiştirmeyi deneyin veya yeni bir tane oluşturun.</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-100">
                {filtered.map((r: any) => (
                    <div key={r.id} className={`px-5 py-3.5 hover:bg-gray-50/50 transition-colors group flex items-center justify-between ${!r.isActive ? "opacity-40" : ""}`}>
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Switch checked={r.isActive} onCheckedChange={() => toggleActive(r)} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 truncate">{r.sourceUrl}</span>
                                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                    <a href={r.targetUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs bg-emerald-50 px-2 py-1 rounded text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 transition-colors truncate flex items-center gap-1.5">
                                        {r.targetUrl}
                                        <ExternalLink className="w-3 h-3"/>
                                    </a>
                                </div>
                                {r.description && <p className="text-xs text-gray-400 mt-1 max-w-md truncate">{r.description}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-blue-50 text-blue-600 border-blue-200">
                                {r.redirectType}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 w-16">
                                <BarChart3 className="w-4 h-4 text-gray-400" />
                                {r.hitCount || 0}
                            </div>
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="outline" size="icon" onClick={() => handleEdit(r)} className="h-8 w-8 rounded-lg"><Edit className="w-4 h-4" /></Button>
                                <Button variant="destructive" size="icon" onClick={() => setDeleteId(r.id)} className="h-8 w-8 rounded-lg"><Trash2 className="w-4 h-4" /></Button>
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
            <SheetTitle>{editingId ? "Yönlendirme Düzenle" : "Yeni Yönlendirme"}</SheetTitle>
            <SheetDescription>URL yönlendirme kuralı tanımlayın. Kaynak URL'den hedef URL'ye yönlendirme yapılacaktır.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-6">
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Kaynak URL *</label>
              <Input value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} className="mt-1 font-mono text-sm rounded-xl" placeholder="/eski-sayfa" required />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Hedef URL *</label>
              <Input value={form.targetUrl} onChange={e => setForm({ ...form, targetUrl: e.target.value })} className="mt-1 font-mono text-sm rounded-xl" placeholder="/yeni-sayfa" required />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Yönlendirme Tipi</label>
              <Select value={form.redirectType} onValueChange={(v: "301" | "302") => setForm({ ...form, redirectType: v })}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 - Kalıcı (Permanent)</SelectItem>
                  <SelectItem value="302">302 - Geçici (Temporary)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Açıklama</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 resize-none rounded-xl" rows={3} placeholder="Bu yönlendirmenin nedeni..." />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="rounded-xl">İptal</Button>
              <Button type="submit" className="rounded-xl bg-orange-500 hover:bg-orange-600" disabled={createMut.isPending || updateMut.isPending}>
                {createMut.isPending || updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : editingId ? "Değişiklikleri Kaydet" : "Yönlendirme Oluştur"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 max-w-sm shadow-2xl w-full mx-4">
                <h3 className="text-lg font-bold">Yönlendirmeyi Sil</h3>
                <p className="text-sm text-gray-500 mt-1">Bu yönlendirmeyi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">İptal</Button>
                    <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteId && deleteMut.mutate({ id: deleteId })} className="rounded-xl">
                        {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Evet, Sil"}
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
