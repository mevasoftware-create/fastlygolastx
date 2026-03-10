import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Save, Trash2, RefreshCw, Globe, Mail, Shield, Server, Palette, Search, Edit } from "lucide-react";
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
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [addDialog, setAddDialog] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState("string");
  const [newDesc, setNewDesc] = useState("");
  const [search, setSearch] = useState("");

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
    setAddDialog(false);
    setNewKey(""); setNewValue(""); setNewType("string"); setNewDesc("");
  };

  // Custom settings that don't belong to any group
  const groupedKeys = new Set(Object.values(SETTING_GROUPS).flatMap(g => g.keys));
  const customSettings = (settings || []).filter((s: any) => !groupedKeys.has(s.key));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-orange-500" /> Site Ayarları
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Sistem yapılandırmasını yönetin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => utils.admin.getAllSettings.invalidate()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={() => setAddDialog(true)} className="bg-orange-500 hover:bg-orange-600 gap-2">
            <Plus className="w-4 h-4" /> Yeni Ayar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Yükleniyor...</div>
      ) : (
        <Tabs defaultValue="branding" className="space-y-4">
          <TabsList className="bg-white border shadow-sm">
            {Object.entries(SETTING_GROUPS).map(([key, group]) => (
              <TabsTrigger key={key} value={key} className="gap-1.5 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                <group.icon className="w-3.5 h-3.5" /> {group.label}
              </TabsTrigger>
            ))}
            {customSettings.length > 0 && (
              <TabsTrigger value="custom" className="gap-1.5 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                <Globe className="w-3.5 h-3.5" /> Özel ({customSettings.length})
              </TabsTrigger>
            )}
          </TabsList>

          {Object.entries(SETTING_GROUPS).map(([groupKey, group]) => (
            <TabsContent key={groupKey} value={groupKey}>
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><group.icon className="w-4 h-4 text-orange-500" />{group.label}</CardTitle>
                  <CardDescription>Bu gruptaki ayarları düzenleyin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.keys.map(key => {
                    const setting = settingsMap[key];
                    const currentValue = editValues[key] ?? setting?.value ?? "";
                    const isPassword = key.includes("password") || key.includes("secret");
                    return (
                      <div key={key} className="grid grid-cols-[200px_1fr_auto] gap-3 items-start border-b border-gray-50 pb-3 last:border-0">
                        <div>
                          <Label className="text-sm font-medium">{KEY_LABELS[key] || key}</Label>
                          <p className="text-xs text-gray-400 mt-0.5">{key}</p>
                        </div>
                        <div>
                          {key === "site_description" ? (
                            <Textarea
                              value={currentValue}
                              onChange={e => setEditValues({ ...editValues, [key]: e.target.value })}
                              className="resize-none text-sm"
                              rows={2}
                              placeholder="Değer girin..."
                            />
                          ) : (
                            <Input
                              type={isPassword ? "password" : "text"}
                              value={currentValue}
                              onChange={e => setEditValues({ ...editValues, [key]: e.target.value })}
                              className="text-sm"
                              placeholder={setting ? "Mevcut değer" : "Henüz ayarlanmamış"}
                            />
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleSave(key)} disabled={updateMut.isPending} className="bg-orange-500 hover:bg-orange-600 h-9 px-3">
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          {customSettings.length > 0 && (
            <TabsContent value="custom">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Özel Ayarlar</CardTitle>
                  <CardDescription>Gruplandırılmamış özel ayarlar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customSettings.map((s: any) => (
                    <div key={s.key} className="grid grid-cols-[200px_1fr_auto_auto] gap-3 items-start border-b border-gray-50 pb-3 last:border-0">
                      <div>
                        <Label className="text-sm font-medium">{s.key}</Label>
                        <p className="text-xs text-gray-400 mt-0.5">{s.description || s.type}</p>
                      </div>
                      <Input
                        value={editValues[s.key] ?? s.value ?? ""}
                        onChange={e => setEditValues({ ...editValues, [s.key]: e.target.value })}
                        className="text-sm"
                      />
                      <Button size="sm" onClick={() => handleSave(s.key)} disabled={updateMut.isPending} className="bg-orange-500 hover:bg-orange-600 h-9 px-3">
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMut.mutate({ key: s.key })} className="h-9 px-3">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Add New Setting Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-orange-500" />Yeni Ayar Ekle</DialogTitle>
            <DialogDescription>Sisteme yeni bir yapılandırma ayarı ekleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Anahtar *</Label>
              <Input value={newKey} onChange={e => setNewKey(e.target.value)} className="mt-1" placeholder="ornek_ayar_key" />
            </div>
            <div>
              <Label className="text-xs">Değer</Label>
              <Input value={newValue} onChange={e => setNewValue(e.target.value)} className="mt-1" placeholder="Değer" />
            </div>
            <div>
              <Label className="text-xs">Tip</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Açıklama</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="mt-1 resize-none" rows={2} placeholder="Bu ayarın ne işe yaradığını açıklayın" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddDialog(false)}>İptal</Button>
              <Button onClick={handleAdd} className="bg-orange-500 hover:bg-orange-600" disabled={!newKey.trim() || updateMut.isPending}>Ekle</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
