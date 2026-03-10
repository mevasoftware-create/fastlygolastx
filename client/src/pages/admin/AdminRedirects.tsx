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
import { ArrowRightLeft, Plus, Edit, Trash2, Search, RefreshCw, ExternalLink, ArrowRight, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface RedirectForm {
  sourceUrl: string;
  targetUrl: string;
  redirectType: "301" | "302";
  description: string;
}

const emptyForm: RedirectForm = { sourceUrl: "", targetUrl: "", redirectType: "301", description: "" };

export function AdminRedirects() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RedirectForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: redirectsList, isLoading } = trpc.admin.getAllRedirects.useQuery();

  const createMut = trpc.admin.createRedirect.useMutation({
    onSuccess: () => { toast.success("Yönlendirme oluşturuldu"); utils.admin.getAllRedirects.invalidate(); setDialogOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMut = trpc.admin.updateRedirect.useMutation({
    onSuccess: () => { toast.success("Yönlendirme güncellendi"); utils.admin.getAllRedirects.invalidate(); setDialogOpen(false); },
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
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMut.mutate({ id: editingId, sourceUrl: form.sourceUrl, targetUrl: form.targetUrl, redirectType: form.redirectType, description: form.description });
    } else {
      createMut.mutate({ sourceUrl: form.sourceUrl, targetUrl: form.targetUrl, redirectType: form.redirectType, description: form.description || undefined });
    }
  };

  const toggleActive = (r: any) => {
    updateMut.mutate({ id: r.id, isActive: !r.isActive });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="w-7 h-7 text-orange-500" /> URL Yönlendirmeleri
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">URL yönlendirmelerini yönetin (301/302)</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); }} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Yeni Yönlendirme
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4"><div className="text-2xl font-bold text-blue-700">{stats.total}</div><div className="text-xs text-blue-600 mt-0.5">Toplam</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4"><div className="text-2xl font-bold text-green-700">{stats.active}</div><div className="text-xs text-green-600 mt-0.5">Aktif</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4"><div className="flex items-center gap-1"><BarChart3 className="w-4 h-4 text-purple-600" /><span className="text-2xl font-bold text-purple-700">{stats.totalHits}</span></div><div className="text-xs text-purple-600 mt-0.5">Toplam Hit</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Yönlendirmeler</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="URL ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-48 text-sm" />
              </div>
              <Button variant="outline" size="sm" onClick={() => utils.admin.getAllRedirects.invalidate()} className="h-9"><RefreshCw className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Yönlendirme bulunamadı</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  <TableHead>Kaynak URL</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Hedef URL</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Hit</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id} className={`hover:bg-gray-50/50 ${!r.isActive ? "opacity-50" : ""}`}>
                    <TableCell>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{r.sourceUrl}</span>
                      {r.description && <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{r.description}</p>}
                    </TableCell>
                    <TableCell><ArrowRight className="w-4 h-4 text-gray-300" /></TableCell>
                    <TableCell><span className="font-mono text-xs bg-green-50 px-2 py-0.5 rounded text-green-700">{r.targetUrl}</span></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${r.redirectType === "301" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`}>
                        {r.redirectType}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-sm font-semibold text-gray-600">{r.hitCount || 0}</span></TableCell>
                    <TableCell>
                      <Switch checked={r.isActive} onCheckedChange={() => toggleActive(r)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(r)} className="h-7 px-2"><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteId(r.id)} className="h-7 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-orange-500" />{editingId ? "Yönlendirme Düzenle" : "Yeni Yönlendirme"}</DialogTitle>
            <DialogDescription>URL yönlendirme kuralı tanımlayın</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs">Kaynak URL *</Label>
              <Input value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} className="mt-1 font-mono text-sm" placeholder="/eski-sayfa" required />
            </div>
            <div>
              <Label className="text-xs">Hedef URL *</Label>
              <Input value={form.targetUrl} onChange={e => setForm({ ...form, targetUrl: e.target.value })} className="mt-1 font-mono text-sm" placeholder="/yeni-sayfa" required />
            </div>
            <div>
              <Label className="text-xs">Yönlendirme Tipi</Label>
              <Select value={form.redirectType} onValueChange={(v: "301" | "302") => setForm({ ...form, redirectType: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 - Kalıcı (Permanent)</SelectItem>
                  <SelectItem value="302">302 - Geçici (Temporary)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Açıklama</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 resize-none" rows={2} placeholder="Bu yönlendirmenin nedeni..." />
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
            <DialogTitle>Yönlendirmeyi Sil</DialogTitle>
            <DialogDescription>Bu yönlendirme kalıcı olarak silinecek.</DialogDescription>
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
