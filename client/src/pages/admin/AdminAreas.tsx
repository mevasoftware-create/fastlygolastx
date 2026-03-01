import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, MapPinned } from "lucide-react";
import { toast } from "sonner";

interface AreaFormData {
  slug: string;
  translations: string;
  seoMeta: string;
  active: boolean;
  displayOrder: number;
}

const emptyForm: AreaFormData = {
  slug: "",
  translations: JSON.stringify({ en: { name: "", title: "", subtitle: "", description: "" }, tr: { name: "", title: "", subtitle: "", description: "" } }),
  seoMeta: JSON.stringify({ en: { title: "", description: "", keywords: "" }, tr: { title: "", description: "", keywords: "" } }),
  active: true,
  displayOrder: 0,
};

export function AdminAreas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AreaFormData>(emptyForm);


  const utils = trpc.useUtils();
  const { data: areas, isLoading } = trpc.areas.list.useQuery();
  const createMutation = trpc.areas.create.useMutation({
    onSuccess: () => {
      toast.success("Bölge başarıyla oluşturuldu");
      utils.areas.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const updateMutation = trpc.areas.update.useMutation({
    onSuccess: () => {
      toast.success("Bölge başarıyla güncellendi");
      utils.areas.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const deleteMutation = trpc.areas.delete.useMutation({
    onSuccess: () => {
      toast.success("Bölge başarıyla silindi");
      utils.areas.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (area: any) => {
    setEditingId(area.id);
    setFormData({
      slug: area.slug,
      translations: area.seoMeta || emptyForm.seoMeta,
      seoMeta: area.seoMeta || emptyForm.seoMeta,
      active: area.active,
      displayOrder: area.displayOrder,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bu bölgeyi silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };



  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MapPinned className="w-8 h-8 text-orange-500" />
            Bölge Yönetimi
          </h1>
          <p className="text-gray-600 mt-1">Hizmet bölgelerini yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Bölge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Bölge Düzenle" : "Yeni Bölge Ekle"}
              </DialogTitle>
              <DialogDescription>
                Bölge bilgilerini tüm dillerde doldurun
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="centar"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="displayOrder">Sıralama</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Aktif</Label>
              </div>



              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? "Güncelle" : "Oluştur"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bölgeler</CardTitle>
          <CardDescription>Toplam {areas?.length || 0} bölge</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
          ) : areas && areas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>İsim (TR)</TableHead>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((area) => {
                    const translations = typeof area.seoMeta === 'string' ? JSON.parse(area.seoMeta) : area.seoMeta;
                    return (
                    <TableRow key={area.id}>
                      <TableCell className="font-mono text-sm">{area.slug}</TableCell>
                      <TableCell className="font-medium">{translations.tr.name}</TableCell>
                      <TableCell>{area.displayOrder}</TableCell>
                      <TableCell>
                        <Badge variant={area.active ? "default" : "secondary"}>
                          {area.active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(area)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(area.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                  })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Henüz bölge bulunmuyor. Yeni bölge ekleyin.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
