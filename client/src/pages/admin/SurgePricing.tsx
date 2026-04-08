import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TrendingUp, Plus, Trash2, Power, PowerOff, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SurgePricing() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    reason: "",
    multiplier: "1.0",
    isActive: false,
    startDate: "",
    endDate: "",
  });

  const { data: surgeConfigs, refetch } = trpc.admin.getAllSurgeConfigs.useQuery();
  const { data: activeSurge } = trpc.admin.getActiveSurgeConfig.useQuery();
  
  const createMutation = trpc.admin.createSurgeConfig.useMutation({
    onSuccess: () => {
      toast.success("Surge yapılandırması başarıyla oluşturuldu");
      refetch();
      setShowCreateForm(false);
      setFormData({ name: "", reason: "", multiplier: "1.0", isActive: false, startDate: "", endDate: "" });
    },
    onError: (error) => toast.error(`Hata: ${error.message}`),
  });

  const toggleMutation = trpc.admin.toggleSurgeConfig.useMutation({
    onSuccess: () => { toast.success("Surge yapılandırması güncellendi"); refetch(); },
    onError: (error) => toast.error(`Hata: ${error.message}`),
  });

  const deleteMutation = trpc.admin.deleteSurgeConfig.useMutation({
    onSuccess: () => { toast.success("Surge yapılandırması silindi"); refetch(); },
    onError: (error) => toast.error(`Hata: ${error.message}`),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const multiplier = parseFloat(formData.multiplier);
    if (isNaN(multiplier) || multiplier < 0.5 || multiplier > 5.0) {
      toast.error("Çarpan 0.5 ile 5.0 arasında olmalıdır");
      return;
    }
    await createMutation.mutateAsync({
      name: formData.name, reason: formData.reason, multiplier,
      isActive: formData.isActive,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    });
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    await toggleMutation.mutateAsync({ id, isActive });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bu surge yapılandırmasını silmek istediğinize emin misiniz?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const formatMultiplier = (multiplier: string | number) => {
    const num = typeof multiplier === 'string' ? parseFloat(multiplier) : multiplier;
    const percentage = ((num - 1) * 100).toFixed(0);
    return num >= 1 ? `+${percentage}%` : `${percentage}%`;
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-orange-500" />
            Surge Fiyatlandırma
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Özel koşullar için dinamik fiyatlandırmayı yönetin</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-orange-500 hover:bg-orange-600 gap-2">
          <Plus className="h-4 w-4" /> Yeni Surge Oluştur
        </Button>
      </div>

      {/* Aktif Surge Uyarısı */}
      {activeSurge && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="font-semibold text-orange-800">Aktif Surge Fiyatlandırma</p>
            <p className="text-sm text-orange-700 mt-0.5">{activeSurge.name} — {formatMultiplier(activeSurge.multiplier)}</p>
            {activeSurge.reason && <p className="text-xs text-orange-600 mt-1">{activeSurge.reason}</p>}
          </div>
        </div>
      )}

      {/* Oluşturma Formu */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800">Yeni Surge Yapılandırması</h2>
            <p className="text-sm text-gray-500">Özel koşullar için manuel surge fiyatlandırma tanımlayın</p>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Ad</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="ör. Kar Fırtınası Surge" className="rounded-xl mt-1" required />
              </div>
              <div>
                <Label htmlFor="multiplier">Çarpan (0.5 - 5.0)</Label>
                <Input id="multiplier" type="number" step="0.1" min="0.5" max="5.0" value={formData.multiplier} onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })} className="rounded-xl mt-1" required />
                <p className="text-xs text-gray-500 mt-1">1.0 = değişiklik yok, 1.5 = +%50, 2.0 = +%100</p>
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Neden</Label>
              <Textarea id="reason" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="ör. Yoğun kar yağışı, sınırlı kurye mevcudiyeti" className="rounded-xl mt-1" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Başlangıç Tarihi (İsteğe Bağlı)</Label>
                <Input id="startDate" type="datetime-local" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label htmlFor="endDate">Bitiş Tarihi (İsteğe Bağlı)</Label>
                <Input id="endDate" type="datetime-local" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="rounded-xl mt-1" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
              <Label htmlFor="isActive">Hemen etkinleştir</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending} className="bg-orange-500 hover:bg-orange-600">
                {createMutation.isPending ? "Oluşturuluyor..." : "Surge Oluştur"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>İptal</Button>
            </div>
          </form>
        </div>
      )}

      {/* Surge Yapılandırma Listesi */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Tüm Surge Yapılandırmaları</h2>
        {surgeConfigs && surgeConfigs.length > 0 ? (
          <div className="space-y-3">
            {surgeConfigs.map((config) => (
              <div key={config.id} className={`bg-white rounded-2xl border p-4 ${config.isActive ? "border-green-300 ring-1 ring-green-100" : "border-gray-100"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.isActive ? "bg-green-50" : "bg-gray-50"}`}>
                      <TrendingUp className={`h-5 w-5 ${config.isActive ? "text-green-600" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">{config.name}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-xl border ${config.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          {config.isActive ? "Aktif" : "Pasif"}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-xl bg-orange-50 text-orange-700 border border-orange-200">
                          {formatMultiplier(config.multiplier)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{config.reason}</p>
                      {(config.startDate || config.endDate) && (
                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                          {config.startDate && <span>Başlangıç: {new Date(config.startDate).toLocaleString("tr-TR")}</span>}
                          {config.endDate && <span>Bitiş: {new Date(config.endDate).toLocaleString("tr-TR")}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant={config.isActive ? "destructive" : "default"} size="sm" onClick={() => handleToggle(config.id, !config.isActive)} disabled={toggleMutation.isPending} className={!config.isActive ? "bg-orange-500 hover:bg-orange-600" : ""}>
                      {config.isActive ? (<><PowerOff className="h-4 w-4 mr-1" /> Devre Dışı</>) : (<><Power className="h-4 w-4 mr-1" /> Etkinleştir</>)}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(config.id)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">Henüz surge yapılandırması yok</p>
            <p className="text-xs text-gray-500 mt-1">Başlamak için yeni bir tane oluşturun.</p>
          </div>
        )}
      </div>
    </div>
  );
}
