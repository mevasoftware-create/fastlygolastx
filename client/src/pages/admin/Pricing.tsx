import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DollarSign, Edit2, Save, X } from "lucide-react";
import { useState } from "react";

export default function Pricing() {
  const { data: pricingSettings, refetch: refetchPricing } = trpc.admin.getPricingSettings.useQuery();
  const updatePricingMutation = trpc.admin.updatePricingSettings.useMutation();

  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ baseFee: 0, perKmFee: 0, minFee: 0 });

  const handleEditPricing = (scenario: any) => {
    setEditingScenario(scenario.scenario);
    setEditForm({
      baseFee: scenario.baseFee / 100,
      perKmFee: scenario.perKmFee / 100,
      minFee: 0,
    });
  };

  const handleSavePricing = async () => {
    if (!editingScenario) return;
    try {
      await updatePricingMutation.mutateAsync({
        scenario: editingScenario,
        baseFee: Math.round(editForm.baseFee * 100),
        perKmFee: Math.round(editForm.perKmFee * 100),
        minFee: Math.round(editForm.minFee * 100),
      });
      toast.success("Fiyatlandırma ayarları güncellendi");
      setEditingScenario(null);
      refetchPricing();
    } catch {
      toast.error("Güncelleme başarısız");
    }
  };

  const scenarioLabels: Record<string, string> = {
    standard: "Standart",
    express: "Ekspres",
    scheduled: "Planlı",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Fiyatlandırma</h1>
        <p className="text-sm text-gray-500">Teslimat senaryolarına göre fiyat ayarları</p>
      </div>

      <div className="grid gap-4">
        {pricingSettings?.map((scenario) => (
          <Card key={scenario.scenario} className="border-2 hover:border-orange-200 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                  </div>
                  {scenarioLabels[scenario.scenario] || `Senaryo: ${scenario.scenario}`}
                </CardTitle>
                {editingScenario !== scenario.scenario && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                    onClick={() => handleEditPricing(scenario)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Düzenle
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingScenario === scenario.scenario ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Taban Ücret (MKD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.baseFee}
                        onChange={(e) => setEditForm({ ...editForm, baseFee: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Km Başına Ücret (MKD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.perKmFee}
                        onChange={(e) => setEditForm({ ...editForm, perKmFee: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSavePricing}
                      disabled={updatePricingMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600 gap-1"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Kaydet
                    </Button>
                    <Button variant="outline" onClick={() => setEditingScenario(null)} className="gap-1">
                      <X className="h-3.5 w-3.5" />
                      İptal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Taban Ücret</p>
                    <p className="text-xl font-bold text-gray-900">{(scenario.baseFee / 100).toFixed(2)} <span className="text-sm font-normal text-gray-500">MKD</span></p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Km Başına</p>
                    <p className="text-xl font-bold text-gray-900">{(scenario.perKmFee / 100).toFixed(2)} <span className="text-sm font-normal text-gray-500">MKD/km</span></p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
