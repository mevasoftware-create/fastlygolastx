import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, MapPinned, Search, Globe, ChevronUp, ChevronDown, MapPin, Loader2, PackageOpen, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const LANGS = [
  { code: "tr", label: "🇹🇷 Türkçe" },
  { code: "en", label: "🇬🇧 English" },
  { code: "mk", label: "🇲🇰 Македонски" },
  { code: "sq", label: "🇦🇱 Shqip" },
];

interface LangContent {
  name: string;
  title: string;
  subtitle: string;
  description: string;
  keywords: string;
  badge?: string;
}

interface AreaFormData {
  slug: string;
  seoMeta: Record<string, LangContent>;
  active: boolean;
  displayOrder: number;
  lat: string;
  lng: string;
}

const emptyLang: LangContent = { name: "", title: "", subtitle: "", description: "", keywords: "", badge: "" };
const emptyForm: AreaFormData = {
  slug: "",
  seoMeta: { tr: { ...emptyLang }, en: { ...emptyLang }, mk: { ...emptyLang }, sq: { ...emptyLang } },
  active: true,
  displayOrder: 0,
  lat: "",
  lng: "",
};

function parseSafe(val: any, fallback: any) {
  if (typeof val === "object" && val !== null) return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function LangBadge({ data }: { data: LangContent }) {
  const pct = Math.round(([data.name, data.title, data.description].filter(Boolean).length / 3) * 100);
  const colorClasses = pct === 100 ? "bg-emerald-50 text-emerald-600 border-emerald-200"
    : pct >= 50 ? "bg-amber-50 text-amber-600 border-amber-200"
    : "bg-red-50 text-red-600 border-red-200";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${colorClasses}`}>
      {pct}%
    </span>
  );
}

export function AdminAreas() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AreaFormData>(emptyForm);
  const [activeLang, setActiveLang] = useState("tr");
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: areas, isLoading } = trpc.areas.listAll.useQuery();

  const invalidate = () => { utils.areas.listAll.invalidate(); utils.areas.list.invalidate(); };

  const createMutation = trpc.areas.create.useMutation({
    onSuccess: () => { toast.success("Bölge oluşturuldu"); invalidate(); setSheetOpen(false); resetForm(); },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });
  const updateMutation = trpc.areas.update.useMutation({
    onSuccess: () => { toast.success("Bölge güncellendi"); invalidate(); setSheetOpen(false); resetForm(); },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });
  const deleteMutation = trpc.areas.delete.useMutation({
    onSuccess: () => { toast.success("Bölge silindi"); invalidate(); setDeleteConfirmId(null); },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });
  const toggleMutation = trpc.areas.update.useMutation({
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });

  const resetForm = useCallback(() => { setFormData(emptyForm); setEditingId(null); setActiveLang("tr"); }, []);

  const handleEdit = (area: any) => {
    const sm = parseSafe(area.seoMeta, {});
    const fullSm: Record<string, LangContent> = {};
    LANGS.forEach(({ code }) => {
      fullSm[code] = {
        name: sm[code]?.name || "",
        title: sm[code]?.title || "",
        subtitle: sm[code]?.subtitle || "",
        description: sm[code]?.description || "",
        keywords: sm[code]?.keywords || "",
        badge: sm[code]?.badge || "",
      };
    });
    setEditingId(area.id);
    setFormData({
      slug: area.slug,
      seoMeta: fullSm,
      active: area.active,
      displayOrder: area.displayOrder,
      lat: area.lat?.toString() || "",
      lng: area.lng?.toString() || "",
    });
    setActiveLang("tr"); setSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      slug: formData.slug,
      seoMeta: JSON.stringify(formData.seoMeta),
      translations: JSON.stringify(formData.seoMeta),
      active: formData.active,
      displayOrder: formData.displayOrder,
      lat: formData.lat ? parseFloat(formData.lat) : undefined,
      lng: formData.lng ? parseFloat(formData.lng) : undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate(payload);
  };

  const setSeo = (lang: string, field: keyof LangContent, val: string) =>
    setFormData(p => ({ ...p, seoMeta: { ...p.seoMeta, [lang]: { ...p.seoMeta[lang], [field]: val } } }));

  const sorted = [...(areas || [])].sort((a, b) => a.displayOrder - b.displayOrder);

  const moveOrder = (id: number, dir: "up" | "down") => {
    const idx = sorted.findIndex(a => a.id === id);
    if (dir === "up" && idx > 0) {
      const prev = sorted[idx - 1];
      updateMutation.mutate({ id, displayOrder: prev.displayOrder });
      updateMutation.mutate({ id: prev.id, displayOrder: sorted[idx].displayOrder });
    } else if (dir === "down" && idx < sorted.length - 1) {
      const next = sorted[idx + 1];
      updateMutation.mutate({ id, displayOrder: next.displayOrder });
      updateMutation.mutate({ id: next.id, displayOrder: sorted[idx].displayOrder });
    }
  };

  const filtered = sorted.filter(a => {
    if (!search) return true;
    const sm = parseSafe(a.seoMeta, {});
    const name = sm.tr?.name || sm.en?.name || a.slug;
    return a.slug.includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bölge Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hizmet bölgelerini tüm dillerde yönetin</p>
        </div>
        <Button onClick={() => { resetForm(); setSheetOpen(true); }} className="bg-orange-500 hover:bg-orange-600 gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Yeni Bölge
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-orange-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-orange-100">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><MapPinned className="w-5 h-5 text-orange-500"/></div>
            <div>
                <div className="text-2xl font-bold text-orange-900">{areas?.length || 0}</div>
                <div className="text-xs text-orange-700">Toplam Bölge</div>
            </div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-emerald-100">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><Globe className="w-5 h-5 text-emerald-500"/></div>
            <div>
                <div className="text-2xl font-bold text-emerald-900">{areas?.filter(a => a.active).length || 0}</div>
                <div className="text-xs text-emerald-700">Aktif</div>
            </div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-blue-100">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><MapPin className="w-5 h-5 text-blue-500"/></div>
            <div>
                <div className="text-2xl font-bold text-blue-900">{areas?.filter((a: any) => a.lat && a.lng).length || 0}</div>
                <div className="text-xs text-blue-700">Koordinatlı</div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Bölgelerde ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 w-full sm:w-64 rounded-xl bg-gray-50 border-gray-100 focus:bg-white" />
            </div>
        </div>
        
        <div className="divide-y divide-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 mx-auto"><PackageOpen className="w-8 h-8 text-gray-400" /></div>
                <p className="text-sm font-medium text-gray-600">Bölge bulunamadı</p>
                <p className="text-xs text-gray-500 mt-1">Arama kriterlerinizi değiştirin veya yeni bir bölge ekleyin.</p>
            </div>
          ) : (
            filtered.map((area, idx) => {
              const sm = parseSafe(area.seoMeta, {});
              const name = sm.tr?.name || sm.en?.name || area.slug;
              return (
                <div key={area.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors group flex items-center gap-4">
                  <div className="flex flex-col items-center gap-0.5">
                    <button onClick={() => moveOrder(area.id, "up")} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                    <span className="text-xs font-bold text-gray-500 w-6 text-center">{area.displayOrder}</span>
                    <button onClick={() => moveOrder(area.id, "down")} disabled={idx === filtered.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${area.active ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                        <p className="font-semibold text-gray-800">{name}</p>
                        <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">/{area.slug}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        {(area as any).lat && (area as any).lng ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-blue-600">
                            <MapPin className="w-3 h-3" />
                            {Number((area as any).lat).toFixed(3)}, {Number((area as any).lng).toFixed(3)}
                          </span>
                        ) : <span className="text-gray-400 text-xs">Koordinat yok</span>}
                        <div className="flex gap-1.5">
                          {LANGS.map(({ code, label }) => <div key={code} title={`${label} SEO Doluluk`}><LangBadge data={sm[code] || emptyLang} /></div>)}
                        </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(area)} className="rounded-xl h-9 gap-2"><Edit className="w-3.5 h-3.5"/> Düzenle</Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmId(area.id)} className="rounded-xl h-9 gap-2"><Trash2 className="w-3.5 h-3.5"/> Sil</Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>{editingId ? "Bölgeyi Düzenle" : "Yeni Bölge Oluştur"}</SheetTitle>
            <SheetDescription>{editingId ? "Bölge detaylarını güncelleyin." : "Yeni bir hizmet bölgesi ekleyin."}</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeLang} onValueChange={setActiveLang} className="w-full">
                <TabsList className="bg-gray-100 rounded-xl p-1 h-auto">
                    {LANGS.map(l => <TabsTrigger key={l.code} value={l.code} className="text-xs rounded-lg flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600">{l.label}</TabsTrigger>)}
                </TabsList>
                {LANGS.map(l => (
                    <TabsContent key={l.code} value={l.code} className="space-y-4 pt-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor={`name-${l.code}`} className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Bölge Adı</Label>
                                <Input id={`name-${l.code}`} value={formData.seoMeta[l.code]?.name || ''} onChange={e => setSeo(l.code, 'name', e.target.value)} className="mt-1 rounded-xl" />
                            </div>
                            <div>
                                <Label htmlFor={`badge-${l.code}`} className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Rozet Metni (Opsiyonel)</Label>
                                <Input id={`badge-${l.code}`} value={formData.seoMeta[l.code]?.badge || ''} onChange={e => setSeo(l.code, 'badge', e.target.value)} className="mt-1 rounded-xl" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor={`title-${l.code}`} className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">SEO Başlığı</Label>
                            <Input id={`title-${l.code}`} value={formData.seoMeta[l.code]?.title || ''} onChange={e => setSeo(l.code, 'title', e.target.value)} className="mt-1 rounded-xl" />
                        </div>
                        <div>
                            <Label htmlFor={`subtitle-${l.code}`} className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">SEO Alt Başlığı</Label>
                            <Input id={`subtitle-${l.code}`} value={formData.seoMeta[l.code]?.subtitle || ''} onChange={e => setSeo(l.code, 'subtitle', e.target.value)} className="mt-1 rounded-xl" />
                        </div>
                        <div>
                            <Label htmlFor={`description-${l.code}`} className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">SEO Açıklaması</Label>
                            <Textarea id={`description-${l.code}`} value={formData.seoMeta[l.code]?.description || ''} onChange={e => setSeo(l.code, 'description', e.target.value)} className="mt-1 rounded-xl" rows={4}/>
                        </div>
                        <div>
                            <Label htmlFor={`keywords-${l.code}`} className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">SEO Anahtar Kelimeler</Label>
                            <Input id={`keywords-${l.code}`} value={formData.seoMeta[l.code]?.keywords || ''} onChange={e => setSeo(l.code, 'keywords', e.target.value)} className="mt-1 rounded-xl" placeholder="kelime1, kelime2, kelime3"/>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
            
            <div className="border-t border-gray-100 pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="slug" className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">URL (Slug)</Label>
                        <Input id="slug" value={formData.slug} onChange={e => setFormData(p => ({...p, slug: e.target.value}))} className="mt-1 rounded-xl font-mono" required/>
                    </div>
                    <div>
                        <Label htmlFor="displayOrder" className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Sıralama</Label>
                        <Input id="displayOrder" type="number" value={formData.displayOrder} onChange={e => setFormData(p => ({...p, displayOrder: parseInt(e.target.value, 10)}))} className="mt-1 rounded-xl" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="lat" className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Latitude</Label>
                        <Input id="lat" value={formData.lat} onChange={e => setFormData(p => ({...p, lat: e.target.value}))} className="mt-1 rounded-xl" />
                    </div>
                    <div>
                        <Label htmlFor="lng" className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Longitude</Label>
                        <Input id="lng" value={formData.lng} onChange={e => setFormData(p => ({...p, lng: e.target.value}))} className="mt-1 rounded-xl" />
                    </div>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <Label htmlFor="active" className="font-medium text-gray-700">Bölge Aktif</Label>
                    <Switch id="active" checked={formData.active} onCheckedChange={c => setFormData(p => ({...p, active: c}))} />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setSheetOpen(false)} className="rounded-xl">İptal</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl bg-orange-500 hover:bg-orange-600 w-28">
                    {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Kaydet" : "Oluştur")}
                </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm shadow-2xl w-full mx-4 animate-in zoom-in-95">
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Bölgeyi Sil</h3>
                    <p className="text-sm text-gray-500 mt-2">Bu bölgeyi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="rounded-xl">İptal</Button>
                    <Button variant="destructive" onClick={() => deleteMutation.mutate({ id: deleteConfirmId })} disabled={deleteMutation.isPending} className="rounded-xl">
                        {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sil"}
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
