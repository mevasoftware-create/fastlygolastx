import { useState, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, FileText, Search, Globe, Eye, EyeOff, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";

const LANGS = [
  { code: "tr", label: "🇹🇷 Türkçe" },
  { code: "en", label: "🇬🇧 English" },
  { code: "mk", label: "🇲🇰 Македонски" },
  { code: "sq", label: "🇦🇱 Shqip" },
];

interface LangContent {
  title: string;
  subtitle: string;
  description: string;
  keywords: string;
  content: string;
}

interface PageFormData {
  slug: string;
  seoMeta: Record<string, LangContent>;
  active: boolean;
}

const emptyLang: LangContent = { title: "", subtitle: "", description: "", keywords: "", content: "" };
const emptyForm: PageFormData = {
  slug: "",
  seoMeta: { tr: { ...emptyLang }, en: { ...emptyLang }, mk: { ...emptyLang }, sq: { ...emptyLang } },
  active: true,
};

function parseSafe(val: any, fallback: any) {
  if (typeof val === "object" && val !== null) return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function LangBadge({ data }: { data: LangContent }) {
  const pct = Math.round(([data.title, data.description].filter(Boolean).length / 2) * 100);
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
      pct === 100 ? "bg-green-100 text-green-700" : pct >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"
    }`}>{pct}%</span>
  );
}

// Common page slugs for quick reference
const COMMON_SLUGS = ["home", "about", "services", "how-it-works", "contact", "privacy-policy", "terms", "faq"];

export function AdminPages() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PageFormData>(emptyForm);
  const [activeLang, setActiveLang] = useState("tr");
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: pages, isLoading } = trpc.pages.listAll.useQuery();

  const invalidate = () => utils.pages.listAll.invalidate();

  const createMutation = trpc.pages.create.useMutation({
    onSuccess: () => { toast.success("Sayfa oluşturuldu"); invalidate(); setDialogOpen(false); resetForm(); },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });
  const updateMutation = trpc.pages.update.useMutation({
    onSuccess: () => { toast.success("Sayfa güncellendi"); invalidate(); setDialogOpen(false); resetForm(); },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });
  const deleteMutation = trpc.pages.delete.useMutation({
    onSuccess: () => { toast.success("Sayfa silindi"); invalidate(); setDeleteConfirmId(null); },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });
  const toggleMutation = trpc.pages.update.useMutation({
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });

  const resetForm = useCallback(() => { setFormData(emptyForm); setEditingId(null); setActiveLang("tr"); }, []);

  const handleEdit = (page: any) => {
    const sm = parseSafe(page.seoMeta, {});
    const fullSm: Record<string, LangContent> = {};
    LANGS.forEach(({ code }) => {
      fullSm[code] = {
        title: sm[code]?.title || "",
        subtitle: sm[code]?.subtitle || "",
        description: sm[code]?.description || "",
        keywords: sm[code]?.keywords || "",
        content: sm[code]?.content || "",
      };
    });
    setEditingId(page.id);
    setFormData({ slug: page.slug, seoMeta: fullSm, active: page.active });
    setActiveLang("tr"); setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, seoMeta: JSON.stringify(formData.seoMeta) };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate(payload);
  };

  const setSeo = (lang: string, field: keyof LangContent, val: string) =>
    setFormData(p => ({ ...p, seoMeta: { ...p.seoMeta, [lang]: { ...p.seoMeta[lang], [field]: val } } }));

  const filtered = (pages || []).filter(p => {
    if (!search) return true;
    const sm = parseSafe(p.seoMeta, {});
    const title = sm.tr?.title || sm.en?.title || p.slug;
    return p.slug.includes(search.toLowerCase()) || title.toLowerCase().includes(search.toLowerCase());
  });

  const formatDate = (d: any) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-orange-500" /> Sayfa Yönetimi
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">SEO sayfalarını tüm dillerde yönetin</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Yeni Sayfa
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4"><div className="text-2xl font-bold text-orange-700">{pages?.length || 0}</div><div className="text-xs text-orange-600 mt-0.5">Toplam Sayfa</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4"><div className="text-2xl font-bold text-green-700">{pages?.filter(p => p.active).length || 0}</div><div className="text-xs text-green-600 mt-0.5">Aktif</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4"><div className="text-2xl font-bold text-purple-700">4</div><div className="text-xs text-purple-600 mt-0.5">Desteklenen Dil</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Sayfalar</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 w-48 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="mb-3">Sayfa bulunamadı</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {COMMON_SLUGS.map(slug => (
                  <button key={slug} onClick={() => { resetForm(); setFormData(p => ({ ...p, slug })); setDialogOpen(true); }}
                    className="text-xs px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 border border-orange-200">
                    + {slug}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  <TableHead>Slug</TableHead>
                  <TableHead>TR Başlık</TableHead>
                  <TableHead>EN Başlık</TableHead>
                  <TableHead>MK Başlık</TableHead>
                  <TableHead>SEO Doluluk</TableHead>
                  <TableHead>Güncelleme</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(page => {
                  const sm = parseSafe(page.seoMeta, {});
                  return (
                    <TableRow key={page.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-gray-500">{page.slug}</span>
                          <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer"
                            className="text-gray-300 hover:text-orange-500">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm max-w-[150px] truncate">{sm.tr?.title || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[150px] truncate">{sm.en?.title || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[150px] truncate">{sm.mk?.title || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {LANGS.map(({ code }) => <LangBadge key={code} data={sm[code] || emptyLang} />)}
                        </div>
                        <div className="flex gap-1 mt-0.5">
                          {LANGS.map(({ code }) => <span key={code} className="text-xs text-gray-400">{code.toUpperCase()}</span>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(page.updatedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={page.active ? "default" : "secondary"} className="cursor-pointer gap-1 text-xs"
                          onClick={() => toggleMutation.mutate({ id: page.id, active: !page.active })}>
                          {page.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {page.active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(page)} className="h-7 px-2"><Edit className="w-3.5 h-3.5" /></Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmId(page.id)} className="h-7 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-orange-500" />
              {editingId ? "Sayfa Düzenle" : "Yeni Sayfa Ekle"}
            </DialogTitle>
            <DialogDescription>Tüm dillerde içerik girin. Başlık ve açıklama SEO için kritiktir.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="col-span-2">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Slug (URL) *</Label>
                <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="about" className="mt-1" required />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_SLUGS.map(s => (
                    <button key={s} type="button" onClick={() => setFormData(p => ({ ...p, slug: s }))}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${formData.slug === s ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-500 border-gray-200 hover:border-orange-300"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-start pt-5">
                <div className="flex items-center gap-2">
                  <Switch id="page-active" checked={formData.active} onCheckedChange={c => setFormData({ ...formData, active: c })} />
                  <Label htmlFor="page-active" className="cursor-pointer text-sm">Aktif</Label>
                </div>
              </div>
            </div>

            <Tabs value={activeLang} onValueChange={setActiveLang}>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Çok Dilli İçerik</Label>
                <TabsList className="h-8">
                  {LANGS.map(({ code, label }) => (
                    <TabsTrigger key={code} value={code} className="text-xs px-3 h-7 gap-1.5">
                      {label.split(" ")[0]} {code.toUpperCase()}
                      <LangBadge data={formData.seoMeta[code] || emptyLang} />
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {LANGS.map(({ code, label }) => (
                <TabsContent key={code} value={code} className="space-y-3 border rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">{label} İçeriği</div>
                  <div>
                    <Label className="text-xs text-gray-500">Sayfa Başlığı (SEO Title) *</Label>
                    <Input value={formData.seoMeta[code]?.title || ""} onChange={e => setSeo(code, "title", e.target.value)} placeholder={`Başlık (${code.toUpperCase()})`} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Alt Başlık (Subtitle)</Label>
                    <Input value={formData.seoMeta[code]?.subtitle || ""} onChange={e => setSeo(code, "subtitle", e.target.value)} placeholder={`Alt başlık (${code.toUpperCase()})`} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Meta Açıklama (Description) *</Label>
                    <Textarea value={formData.seoMeta[code]?.description || ""} onChange={e => setSeo(code, "description", e.target.value)} placeholder={`Açıklama (${code.toUpperCase()})`} className="mt-1 resize-none" rows={3} />
                    <div className="text-xs text-gray-400 mt-1">{(formData.seoMeta[code]?.description || "").length}/160 karakter</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Anahtar Kelimeler (virgülle ayırın)</Label>
                    <Input value={formData.seoMeta[code]?.keywords || ""} onChange={e => setSeo(code, "keywords", e.target.value)} placeholder={`anahtar, kelime (${code.toUpperCase()})`} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Sayfa İçeriği (HTML/Metin)</Label>
                    <Textarea value={formData.seoMeta[code]?.content || ""} onChange={e => setSeo(code, "content", e.target.value)} placeholder={`Sayfa içeriği (${code.toUpperCase()})`} className="mt-1 resize-y font-mono text-xs" rows={6} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 min-w-24" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sayfayı Sil</DialogTitle>
            <DialogDescription>Bu işlem geri alınamaz. Emin misiniz?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>İptal</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteConfirmId && deleteMutation.mutate({ id: deleteConfirmId })}>
              {deleteMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
