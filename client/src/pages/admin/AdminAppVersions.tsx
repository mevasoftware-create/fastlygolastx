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
import { Smartphone, Plus, Edit, Trash2, RefreshCw, Apple, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function AdminAppVersions() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: versions, isLoading } = trpc.admin.getAllAppVersions.useQuery();

  const createMut = trpc.admin.createAppVersion.useMutation({
    onSuccess: () => { toast.success("Versiyon oluşturuldu"); utils.admin.getAllAppVersions.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = trpc.admin.updateAppVersion.useMutation({
    onSuccess: () => { toast.success("Versiyon güncellendi"); utils.admin.getAllAppVersions.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = trpc.admin.deleteAppVersion.useMutation({
    onSuccess: () => { toast.success("Versiyon silindi"); utils.admin.getAllAppVersions.invalidate(); setDeleteId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    if (!versions) return { total: 0, android: 0, ios: 0, forceUpdate: 0 };
    return {
      total: versions.length,
      android: versions.filter((v: any) => v.platform === "android").length,
      ios: versions.filter((v: any) => v.platform === "ios").length,
      forceUpdate: versions.filter((v: any) => v.forceUpdate).length,
    };
  }, [versions]);

  const filtered = (versions || []).filter((v: any) => {
    if (!search) return true;
    return v.version?.includes(search) || v.platform?.includes(search.toLowerCase()) || v.releaseNotes?.toLowerCase().includes(search.toLowerCase());
  });

  const toggleForceUpdate = (v: any) => {
    updateMut.mutate({ id: v.id, forceUpdate: !v.forceUpdate });
  };

  const toggleActive = (v: any) => {
    updateMut.mutate({ id: v.id, isActive: !v.isActive });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-orange-500" /> Uygulama Versiyonları
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Mobil uygulama versiyonlarını yönetin</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => utils.admin.getAllAppVersions.invalidate()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Yenile
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4"><div className="text-2xl font-bold text-blue-700">{stats.total}</div><div className="text-xs text-blue-600 mt-0.5">Toplam</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4"><div className="flex items-center gap-1"><Smartphone className="w-4 h-4 text-green-600" /><span className="text-2xl font-bold text-green-700">{stats.android}</span></div><div className="text-xs text-green-600 mt-0.5">Android</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-4"><div className="flex items-center gap-1"><Apple className="w-4 h-4 text-gray-600" /><span className="text-2xl font-bold text-gray-700">{stats.ios}</span></div><div className="text-xs text-gray-600 mt-0.5">iOS</div></CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4"><div className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-2xl font-bold text-red-700">{stats.forceUpdate}</span></div><div className="text-xs text-red-600 mt-0.5">Zorunlu Güncelleme</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Versiyonlar</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Versiyon ara..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-48 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Versiyon bulunamadı</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  <TableHead>Platform</TableHead>
                  <TableHead>Versiyon</TableHead>
                  <TableHead>Build No</TableHead>
                  <TableHead>Notlar</TableHead>
                  <TableHead>Zorunlu</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v: any) => (
                  <TableRow key={v.id} className={`hover:bg-gray-50/50 ${!v.isActive ? "opacity-50" : ""}`}>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs gap-1 ${v.platform === "android" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                        {v.platform === "android" ? <Smartphone className="w-3 h-3" /> : <Apple className="w-3 h-3" />}
                        {v.platform === "android" ? "Android" : "iOS"}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="font-mono font-bold text-sm">{v.version}</span></TableCell>
                    <TableCell><span className="text-sm text-gray-600">{v.buildNumber}</span></TableCell>
                    <TableCell className="max-w-[200px]"><p className="text-xs text-gray-500 truncate">{v.releaseNotes || "—"}</p></TableCell>
                    <TableCell>
                      <Switch checked={v.forceUpdate} onCheckedChange={() => toggleForceUpdate(v)} />
                    </TableCell>
                    <TableCell>
                      <Switch checked={v.isActive} onCheckedChange={() => toggleActive(v)} />
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">{new Date(v.createdAt).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => setDeleteId(v.id)} className="h-7 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Versiyonu Sil</DialogTitle>
            <DialogDescription>Bu versiyon kalıcı olarak silinecek.</DialogDescription>
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
