import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Edit, Trash2, FolderOpen, Search, Globe, ChevronUp, ChevronDown,
  Eye, EyeOff, GripVertical, Loader2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const LANGS = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "mk", label: "Македонски", flag: "🇲🇰" },
  { code: "sq", label: "Shqip", flag: "🇦🇱" },
];

interface LangContent { title: string; subtitle: string; description: string; keywords: string; }
interface ShortNameContent { tr: string; en: string; mk: string; sq: string; }
interface CategoryFormData {
  slug: string; icon: string; shortName: ShortNameContent;
  seoMeta: Record<string, LangContent>; active: boolean; displayOrder: number;
}

const emptyLang: LangContent = { title: "", subtitle: "", description: "", keywords: "" };
const emptyForm: CategoryFormData = {
  slug: "", icon: "🚀",
  shortName: { tr: "", en: "", mk: "", sq: "" },
  seoMeta: { tr: { ...emptyLang }, en: { ...emptyLang }, mk: { ...emptyLang }, sq: { ...emptyLang } },
  active: true, displayOrder: 0,
};

function parseSafe(val: any, fallback: any) {
  if (typeof val === "object" && val !== null) return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function LangCompleteness({ data }: { data: LangContent }) {
  const filled = [data.title, data.description].filter(Boolean).length;
  const pct = Math.round((filled / 2) * 100);
  const color = pct === 100 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return <div className={`w-2 h-2 rounded-full ${color}`} title={`${pct}% tamamlandı`} />;
}

export function AdminCategories() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm);
  const [activeLang, setActiveLang] = useState("tr");
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.categories.listAll.useQuery();

  const invalidate = () => { utils.categories.listAll.invalidate(); utils.categories.list.invalidate(); };

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => { toast.success("Kategori oluşturuldu"); invalidate(); setSheetOpen(false); resetForm(); },
    onError: (e: any) => toast.error(`Hata: ${e.message}`),
  });
  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => { toast.success("Kategori güncellendi"); invalidate(); setSheetOpen(false); resetForm(); },
    onError: (e: any) => toast.error(`Hata: ${e.message}`),
  });
  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => { toast.success("Kategori silindi"); invalidate(); setDeleteConfirmId(null); },
    onError: (e: any) => toast.error(`Hata: ${e.message}`),
  });
  const toggleMutation = trpc.categories.update.useMutation({
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(`Hata: ${e.message}`),
  });

  const resetForm = useCallback(() => { setFormData(emptyForm); setEditingId(null); setActiveLang("tr"); }, []);

  const handleEdit = (cat: any) => {
    const sn = parseSafe(cat.shortName, {});
    const sm = parseSafe(cat.seoMeta, {});
    const fullSm: Record<string, LangContent> = {};
    LANGS.forEach(({ code }) => {
      fullSm[code] = { title: sm[code]?.title || "", subtitle: sm[code]?.subtitle || "", description: sm[code]?.description || "", keywords: sm[code]?.keywords || "" };
    });
    setEditingId(cat.id);
    setFormData({ slug: cat.slug, icon: cat.icon, shortName: { tr: sn.tr || "", en: sn.en || "", mk: sn.mk || "", sq: sn.sq || "" }, seoMeta: fullSm, active: cat.active, displayOrder: cat.displayOrder });
    setActiveLang("tr"); setSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, shortName: JSON.stringify(formData.shortName), seoMeta: JSON.stringify(formData.seoMeta) };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate(payload);
  };

  const setSeo = (lang: string, field: keyof LangContent, val: string) =>
    setFormData(p => ({ ...p, seoMeta: { ...p.seoMeta, [lang]: { ...p.seoMeta[lang], [field]: val } } }));
  const setSN = (lang: string, val: string) =>
    setFormData(p => ({ ...p, shortName: { ...p.shortName, [lang]: val } }));

  const sorted = [...(categories || [])].sort((a: any, b: any) => a.displayOrder - b.displayOrder);

  const moveOrder = (id: number, dir: "up" | "down") => {
    const idx = sorted.findIndex((c: any) => c.id === id);
    if (dir === "up" && idx > 0) {
      updateMutation.mutate({ id, displayOrder: sorted[idx - 1].displayOrder });
      updateMutation.mutate({ id: sorted[idx - 1].id, displayOrder: sorted[idx].displayOrder });
    } else if (dir === "down" && idx < sorted.length - 1) {
      updateMutation.mutate({ id, displayOrder: sorted[idx + 1].displayOrder });
      updateMutation.mutate({ id: sorted[idx + 1].id, displayOrder: sorted[idx].displayOrder });
    }
  };

  const filtered = sorted.filter((c: any) => {
    if (!search) return true;
    const sm = parseSafe(c.seoMeta, {});
    const name = sm.tr?.title || sm.en?.title || c.slug;
    return c.slug.includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kategori Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hizmet kategorilerini tüm dillerde yönetin</p>
        </div>
        <button onClick={() => { resetForm(); setSheetOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all shadow-sm shadow-orange-500/20">
          <Plus className="h-4 w-4" />Yeni Kategori
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-orange-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-orange-100">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><FolderOpen className="h-4 w-4 text-orange-600" /></div>
          <div><p className="text-xl font-bold text-orange-600">{categories?.length || 0}</p><p className="text-[11px] text-gray-500">Toplam</p></div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-emerald-100">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><Eye className="h-4 w-4 text-emerald-600" /></div>
          <div><p className="text-xl font-bold text-emerald-600">{categories?.filter((c: any) => c.active).length || 0}</p><p className="text-[11px] text-gray-500">Aktif</p></div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-gray-100">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><EyeOff className="h-4 w-4 text-gray-500" /></div>
          <div><p className="text-xl font-bold text-gray-600">{categories?.filter((c: any) => !c.active).length || 0}</p><p className="text-[11px] text-gray-500">Pasif</p></div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Kategori ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 text-sm border-gray-200 rounded-xl" />
        </div>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><FolderOpen className="h-8 w-8 opacity-30" /></div>
            <p className="text-sm font-medium">Kategori bulunamadı</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((cat: any, idx: number) => {
              const sm = parseSafe(cat.seoMeta, {});
              const sn = parseSafe(cat.shortName, {});
              return (
                <div key={cat.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                  {/* Order Controls */}
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => moveOrder(cat.id, "up")} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <span className="text-[10px] text-gray-400 font-mono">{cat.displayOrder}</span>
                    <button onClick={() => moveOrder(cat.id, "down")} disabled={idx === filtered.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center text-2xl ring-1 ring-orange-100 flex-shrink-0">
                    {cat.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{sn.tr || sm.tr?.title || cat.slug}</span>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{cat.slug}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {LANGS.map(({ code, flag }) => (
                        <div key={code} className="flex items-center gap-1">
                          <span className="text-[11px]">{flag}</span>
                          <LangCompleteness data={sm[code] || emptyLang} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <button onClick={() => toggleMutation.mutate({ id: cat.id, active: !cat.active })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1.5 ${
                      cat.active ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${cat.active ? "bg-emerald-400" : "bg-gray-400"}`} />
                    {cat.active ? "Aktif" : "Pasif"}
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(cat)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirmId(cat.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit/Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-gray-100">
            <SheetTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-500" />
              {editingId ? "Kategori Düzenle" : "Yeni Kategori"}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-5 py-5">
            {/* Basic Info */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Slug (URL)</Label>
                <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="food-delivery" className="mt-1.5 rounded-xl" required />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">İkon</Label>
                <Input value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="🍕" className="mt-1.5 rounded-xl text-2xl text-center" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Sıralama</Label>
                <Input type="number" value={formData.displayOrder} onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} className="mt-1.5 rounded-xl" />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 w-full ring-1 ring-gray-100">
                  <Switch id="active-sheet" checked={formData.active} onCheckedChange={c => setFormData({ ...formData, active: c })} />
                  <Label htmlFor="active-sheet" className="cursor-pointer text-sm font-medium">{formData.active ? "Aktif" : "Pasif"}</Label>
                </div>
              </div>
            </div>

            {/* Multi-language Content */}
            <div className="border-t border-gray-100 pt-4">
              <Tabs value={activeLang} onValueChange={setActiveLang}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">Çok Dilli İçerik</p>
                  <TabsList className="h-8 bg-gray-100 rounded-xl p-1">
                    {LANGS.map(({ code, flag }) => (
                      <TabsTrigger key={code} value={code} className="text-[11px] px-2.5 h-6 rounded-lg gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        {flag} {code.toUpperCase()}
                        <LangCompleteness data={formData.seoMeta[code] || emptyLang} />
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                {LANGS.map(({ code, label, flag }) => (
                  <TabsContent key={code} value={code} className="space-y-3 bg-gray-50 rounded-xl p-4 ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-700">{flag} {label}</p>
                    <div>
                      <Label className="text-[11px] text-gray-500">Kısa İsim</Label>
                      <Input value={formData.shortName[code as keyof ShortNameContent] || ""} onChange={e => setSN(code, e.target.value)} placeholder={`Kısa isim (${code.toUpperCase()})`} className="mt-1 rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-gray-500">SEO Başlık *</Label>
                      <Input value={formData.seoMeta[code]?.title || ""} onChange={e => setSeo(code, "title", e.target.value)} placeholder={`Başlık (${code.toUpperCase()})`} className="mt-1 rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-gray-500">Alt Başlık</Label>
                      <Input value={formData.seoMeta[code]?.subtitle || ""} onChange={e => setSeo(code, "subtitle", e.target.value)} placeholder={`Alt başlık (${code.toUpperCase()})`} className="mt-1 rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-gray-500">Meta Açıklama *</Label>
                      <Textarea value={formData.seoMeta[code]?.description || ""} onChange={e => setSeo(code, "description", e.target.value)} placeholder={`Açıklama (${code.toUpperCase()})`} className="mt-1 rounded-xl resize-none" rows={3} />
                      <p className="text-[11px] text-gray-400 mt-1">{(formData.seoMeta[code]?.description || "").length}/160</p>
                    </div>
                    <div>
                      <Label className="text-[11px] text-gray-500">Anahtar Kelimeler</Label>
                      <Input value={formData.seoMeta[code]?.keywords || ""} onChange={e => setSeo(code, "keywords", e.target.value)} placeholder="kelime1, kelime2" className="mt-1 rounded-xl" />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="flex-1 rounded-xl">İptal</Button>
              <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-xl" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Kaydediliyor...</> : editingId ? "Güncelle" : "Oluştur"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="h-6 w-6 text-red-500" /></div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Kategoriyi Sil</h3>
            <p className="text-sm text-gray-500 text-center mt-1">Bu işlem geri alınamaz. Emin misiniz?</p>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="flex-1 rounded-xl">İptal</Button>
              <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteConfirmId && deleteMutation.mutate({ id: deleteConfirmId })} className="flex-1 rounded-xl">
                {deleteMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
