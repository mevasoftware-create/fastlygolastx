import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DollarSign, Edit2, Save, X, Loader2 } from "lucide-react";
import { formatEUR } from "@/lib/formatEUR";
import { useState } from "react";

export default function Pricing() {
  const { data: pricingSettings, refetch: refetchPricing, isLoading } = trpc.admin.getPricingSettings.useQuery();
  const updatePricingMutation = trpc.admin.updatePricingSettings.useMutation();

  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ baseFee: 0, perKmFee: 0 });

  const handleEditPricing = (scenario: any) => {
    setEditingScenario(scenario.scenario);
    setEditForm({
      baseFee: scenario.baseFee / 100, // convert cents to EUR for display
      perKmFee: scenario.perKmFee / 100,
    });
  };

  const handleSavePricing = async () => {
    if (!editingScenario) return;
    try {
      await updatePricingMutation.mutateAsync({
        scenario: editingScenario,
        baseFee: Math.round(editForm.baseFee * 100),
        perKmFee: Math.round(editForm.perKmFee * 100),
        minFee: 0, // minFee is not in the form, so we send 0 or a default value
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
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fiyatlandırma</h1>
        <p className="text-sm text-gray-500 mt-0.5">Teslimat senaryolarına göre fiyat ayarları</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {pricingSettings?.map((scenario) => (
            <div key={scenario.scenario} className="px-5 py-3.5 group">
              {editingScenario === scenario.scenario ? (
                // EDITING VIEW
                <div className="space-y-4 pt-2 pb-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm ring-1 ring-orange-100">
                      <DollarSign className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="font-semibold text-gray-800">{scenarioLabels[scenario.scenario]}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Taban Ücret (€)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.baseFee}
                        onChange={(e) => setEditForm({ ...editForm, baseFee: parseFloat(e.target.value) || 0 })}
                        className="rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Km Başına Ücret (€)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.perKmFee}
                        onChange={(e) => setEditForm({ ...editForm, perKmFee: parseFloat(e.target.value) || 0 })}
                        className="rounded-xl mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSavePricing}
                      disabled={updatePricingMutation.isPending}
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 gap-1.5 h-9 px-4"
                    >
                      {updatePricingMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Kaydet
                    </Button>
                    <Button variant="outline" onClick={() => setEditingScenario(null)} className="rounded-xl gap-1.5 h-9 px-4">
                      <X className="h-3.5 w-3.5" />
                      İptal
                    </Button>
                  </div>
                </div>
              ) : (
                // DEFAULT VIEW
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm ring-1 ring-gray-100">
                      <DollarSign className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="w-40">
                      <p className="font-semibold text-gray-800">{scenarioLabels[scenario.scenario]}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-xs text-gray-500">Taban Ücret</p>
                            <p className="font-semibold text-gray-900 mt-0.5">{formatEUR(scenario.baseFee)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Km Başına</p>
                            <p className="font-semibold text-gray-900 mt-0.5">{formatEUR(scenario.perKmFee)}/km</p>
                        </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl gap-1.5 h-9 w-9 p-0"
                      onClick={() => handleEditPricing(scenario)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
