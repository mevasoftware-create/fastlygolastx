import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, Save, Trash2, RefreshCw, Globe, Mail, Shield, Server, Palette, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SETTING_GROUPS: Record<string, { label: string; icon: any; keys: string[] }> = {
  branding: {
    label: "Marka & Görünüm",
    icon: Palette,
    keys: ["site_title", "site_logo_url", "site_favicon_url", "site_description", "primary_color", "secondary_color"],
  },
  email: {
    label: "E-posta (SMTP)",
    icon: Mail,
    keys: ["smtp_host", "smtp_port", "smtp_user", "smtp_password", "smtp_from", "smtp_secure"],
  },
  oauth: {
    label: "OAuth Sağlayıcılar",
    icon: Shield,
    keys: ["google_oauth_client_id", "google_oauth_client_secret", "apple_oauth_client_id", "facebook_oauth_app_id", "facebook_oauth_app_secret"],
  },
  system: {
    label: "Sistem",
    icon: Server,
    keys: ["email_verification_expiry_hours", "password_reset_expiry_hours", "max_upload_size_mb", "maintenance_mode", "default_language", "currency"],
  },
};

const KEY_LABELS: Record<string, string> = {
  site_title: "Site Başlığı", site_logo_url: "Logo URL", site_favicon_url: "Favicon URL",
  site_description: "Site Açıklaması", primary_color: "Ana Renk", secondary_color: "İkincil Renk",
  smtp_host: "SMTP Sunucu", smtp_port: "SMTP Port", smtp_user: "SMTP Kullanıcı",
  smtp_password: "SMTP Şifre", smtp_from: "Gönderici E-posta", smtp_secure: "SSL/TLS",
  google_oauth_client_id: "Google Client ID", google_oauth_client_secret: "Google Client Secret",
  apple_oauth_client_id: "Apple Client ID", facebook_oauth_app_id: "Facebook App ID",
  facebook_oauth_app_secret: "Facebook App Secret", email_verification_expiry_hours: "E-posta Doğrulama Süresi (saat)",
  password_reset_expiry_hours: "Şifre Sıfırlama Süresi (saat)", max_upload_size_mb: "Maks. Yükleme Boyutu (MB)",
  maintenance_mode: "Bakım Modu", default_language: "Varsayılan Dil", currency: "Para Birimi",
};

export function AdminSiteSettings() {
  const [activeTab, setActiveTab] = useState("branding");
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState("string");
  const [newDesc, setNewDesc] = useState("");

  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.admin.getAllSettings.useQuery();

  const updateMut = trpc.admin.upsertSiteSetting.useMutation({
    onSuccess: () => { toast.success("Ayar güncellendi"); utils.admin.getAllSettings.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = trpc.admin.deleteSetting.useMutation({
    onSuccess: () => { toast.success("Ayar silindi"); utils.admin.getAllSettings.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const settingsMap = useMemo(() => {
    const map: Record<string, any> = {};
    (settings || []).forEach((s: any) => { map[s.key] = s; });
    return map;
  }, [settings]);

  const handleSave = (key: string) => {
    const value = editValues[key] ?? settingsMap[key]?.value ?? "";
    updateMut.mutate({ key, value });
    setEditValues(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleAdd = () => {
    if (!newKey.trim()) return;
    updateMut.mutate({ key: newKey, value: newValue, type: newType, description: newDesc });
    setAddSheetOpen(false);
    setNewKey(""); setNewValue(""); setNewType("string"); setNewDesc("");
  };

  const groupedKeys = new Set(Object.values(SETTING_GROUPS).flatMap(g => g.keys));
  const customSettings = (settings || []).filter((s: any) => !groupedKeys.has(s.key));

  const renderSettingInput = (key: string) => {
    const setting = settingsMap[key];
    const currentValue = editValues[key] ?? setting?.value ?? "";
    const isPassword = key.includes("password") || key.includes("secret");

    if (key === "site_description") {
      return <Textarea
        value={currentValue}
        onChange={e => setEditValues({ ...editValues, [key]: e.target.value })}
        className="rounded-xl resize-none text-sm" rows={2} placeholder="Değer girin..."
      />;
    }
    return <Input
      type={isPassword ? "password" : "text"}
      value={currentValue}
      onChange={e => setEditValues({ ...editValues, [key]: e.target.value })}
      className="rounded-xl text-sm"
      placeholder={setting ? "Mevcut değer" : "Henüz ayarlanmamış"}
    />;
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Site Ayarları</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sistem genelindeki yapılandırmaları ve ayarları yönetin.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => utils.admin.getAllSettings.invalidate()} className="rounded-xl gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={() => setAddSheetOpen(true)} className="bg-orange-500 hover:bg-orange-600 rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Yeni Ayar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-xl p-1 flex items-center gap-1 w-full overflow-x-auto">
            {Object.entries(SETTING_GROUPS).map(([key, group]) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}>
                <group.icon className="w-3.5 h-3.5" /> {group.label}
              </button>
            ))}
            {customSettings.length > 0 && (
              <button onClick={() => setActiveTab('custom')} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === 'custom' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}>
                <Globe className="w-3.5 h-3.5" /> Özel ({customSettings.length})
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
            {activeTab !== 'custom' && SETTING_GROUPS[activeTab]?.keys.map(key => (
              <div key={key} className="px-5 py-3.5 grid md:grid-cols-[250px_1fr_auto] gap-x-6 gap-y-2 items-center group">
                <div>
                  <label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{KEY_LABELS[key] || key}</label>
                  <p className="text-xs text-gray-400 mt-0.5">{key}</p>
                </div>
                <div className="max-w-lg">{renderSettingInput(key)}</div>
                <div className="md:ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" onClick={() => handleSave(key)} disabled={updateMut.isPending} className="bg-orange-500 hover:bg-orange-600 rounded-xl h-9 px-4">
                    <Save className="w-3.5 h-3.5 mr-1.5" /> Kaydet
                  </Button>
                </div>
              </div>
            ))}
            {activeTab === 'custom' && customSettings.map((s: any) => (
              <div key={s.key} className="px-5 py-3.5 grid md:grid-cols-[250px_1fr_auto] gap-x-6 gap-y-2 items-center group">
                 <div>
                  <label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{s.key}</label>
                  <p className="text-xs text-gray-400 mt-0.5">{s.description || s.type}</p>
                </div>
                <div className="max-w-lg">
                  <Input
                    value={editValues[s.key] ?? s.value ?? ""}
                    onChange={e => setEditValues({ ...editValues, [s.key]: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="md:ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" onClick={() => handleSave(s.key)} disabled={updateMut.isPending} className="bg-orange-500 hover:bg-orange-600 rounded-xl h-9 px-4">
                    <Save className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMut.mutate({ key: s.key })} className="rounded-xl h-9 px-3">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Sheet open={addSheetOpen} onOpenChange={setAddSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Yeni Ayar Ekle</SheetTitle>
            <SheetDescription>Sisteme yeni bir yapılandırma ayarı ekleyin. Bu ayar 'Özel' sekmesinde görünecektir.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div>
              <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Anahtar *</Label>
              <Input value={newKey} onChange={e => setNewKey(e.target.value)} className="mt-1.5 rounded-xl" placeholder="ornek_ayar_key" />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Değer</Label>
              <Input value={newValue} onChange={e => setNewValue(e.target.value)} className="mt-1.5 rounded-xl" placeholder="Değer" />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Tip</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Açıklama</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="mt-1.5 rounded-xl resize-none" rows={3} placeholder="Bu ayarın ne işe yaradığını açıklayın" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddSheetOpen(false)} className="rounded-xl">İptal</Button>
            <Button onClick={handleAdd} className="bg-orange-500 hover:bg-orange-600 rounded-xl" disabled={!newKey.trim() || updateMut.isPending}>Ekle</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
