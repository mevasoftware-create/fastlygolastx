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
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface CategoryFormData {
  slug: string;
  icon: string;
  shortName: string;
  seoMeta: string;
  active: boolean;
  displayOrder: number;
}

const emptyForm: CategoryFormData = {
  slug: "",
  icon: "🍕",
  shortName: JSON.stringify({ en: "", tr: "", mk: "", sq: "" }),
  seoMeta: JSON.stringify({ en: { title: "", subtitle: "", description: "", keywords: "" }, tr: { title: "", subtitle: "", description: "", keywords: "" }, mk: { title: "", subtitle: "", description: "", keywords: "" }, sq: { title: "", subtitle: "", description: "", keywords: "" } }),
  active: true,
  displayOrder: 0,
};

export function AdminCategories() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm);


  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.categories.list.useQuery();
  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Kategori başarıyla oluşturuldu");
      utils.categories.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Kategori başarıyla güncellendi");
      utils.categories.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Kategori başarıyla silindi");
      utils.categories.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setFormData({
      slug: category.slug,
      icon: category.icon,
      shortName: category.shortName || emptyForm.shortName,
      seoMeta: category.seoMeta || emptyForm.seoMeta,
      active: category.active,
      displayOrder: category.displayOrder,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) {
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
            <FolderOpen className="w-8 h-8 text-orange-500" />
            Kategori Yönetimi
          </h1>
          <p className="text-gray-600 mt-1">Hizmet kategorilerini yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Kategori Düzenle" : "Yeni Kategori Ekle"}
              </DialogTitle>
              <DialogDescription>
                Kategori bilgilerini tüm dillerde doldurun
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
                    placeholder="food-delivery"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="icon">İkon (Emoji)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🍕"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Aktif</Label>
                </div>
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
          <CardTitle>Kategoriler</CardTitle>
          <CardDescription>Toplam {categories?.length || 0} kategori</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
          ) : categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İkon</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>İsim (TR)</TableHead>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((category) => {
                    const seoMeta = typeof category.seoMeta === 'string' ? JSON.parse(category.seoMeta) : category.seoMeta;
                    return (
                    <TableRow key={category.id}>
                      <TableCell className="text-2xl">{category.icon}</TableCell>
                      <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                      <TableCell className="font-medium">{seoMeta.tr?.title || seoMeta.en?.title || category.slug}</TableCell>
                      <TableCell>{category.displayOrder}</TableCell>
                      <TableCell>
                        <Badge variant={category.active ? "default" : "secondary"}>
                          {category.active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
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
              Henüz kategori bulunmuyor. Yeni kategori ekleyin.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
