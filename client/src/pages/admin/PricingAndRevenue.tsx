import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";
import { formatEUR } from "@/lib/formatEUR";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function PricingAndRevenue() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const handleDateChange = (field: string, value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const { data: pricingSettings, refetch: refetchPricing } = trpc.admin.getPricingSettings.useQuery();
  const { data: revenueReport } = trpc.admin.getRevenueReport.useQuery({
    startDate: new Date(dateRange.startDate),
    endDate: new Date(dateRange.endDate),
  });
  const updatePricingMutation = trpc.admin.updatePricingSettings.useMutation();

  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ baseFee: 0, perKmFee: 0, minFee: 0 });

  const handleEditPricing = (scenario: any) => {
    setEditingScenario(scenario.scenario);
    setEditForm({
      baseFee: scenario.baseFee / 100, // convert cents to EUR for input
      perKmFee: scenario.perKmFee / 100,
      minFee: 0,
    });
  };

  const handleSavePricing = async () => {
    if (!editingScenario) return;

    try {
      await updatePricingMutation.mutateAsync({
        scenario: editingScenario,
        baseFee: Math.round(editForm.baseFee * 100), // Convert to cents
        perKmFee: Math.round(editForm.perKmFee * 100),
        minFee: Math.round(editForm.minFee * 100),
      });

      toast.success("Fiyatlandırma ayarları güncellendi");
      setEditingScenario(null);
      refetchPricing();
    } catch (error) {
      toast.error("Güncelleme başarısız");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Revenue Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Gelir Raporu
          </CardTitle>
          <CardDescription>Tarih aralığına göre gelir istatistikleri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Selector */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Başlangıç Tarihi</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Bitiş Tarihi</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Revenue Stats */}
          {revenueReport && revenueReport.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Toplam Gelir</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatEUR(revenueReport.reduce((sum, item) => sum + (item.total || 0), 0))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Toplam Sipariş</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{revenueReport.reduce((sum, item) => sum + (item.count || 0), 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Ortalama Sipariş Değeri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {revenueReport.length > 0
                        ? formatEUR(revenueReport.reduce((sum, item) => sum + (item.total || 0), 0) / revenueReport.reduce((sum, item) => sum + (item.count || 0), 0))
                        : "€0.00"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Chart */}
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueReport.map(item => ({ ...item, revenue: item.total }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [formatEUR(value), 'Gelir']} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#FF6B00" name="Günlük Gelir" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fiyatlandırma Ayarları
          </CardTitle>
          <CardDescription>Araç tiplerine göre fiyat ayarları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pricingSettings?.map((scenario) => (
              <Card key={scenario.scenario}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Senaryo {scenario.scenario}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editingScenario === scenario.scenario ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Taban Ücret (€)</Label>
                          <Input
                            type="number"
                            value={editForm.baseFee}
                            onChange={(e) => setEditForm({ ...editForm, baseFee: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Km Başına Ücret (€)</Label>
                          <Input
                            type="number"
                            value={editForm.perKmFee}
                            onChange={(e) => setEditForm({ ...editForm, perKmFee: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSavePricing}>Kaydet</Button>
                        <Button variant="outline" onClick={() => setEditingScenario(null)}>İptal</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div>Taban Ücret: {formatEUR(scenario.baseFee)}</div>
                        <div>Km Başına: {formatEUR(scenario.perKmFee)}/km</div>
                      </div>
                      <Button onClick={() => handleEditPricing(scenario)}>Düzenle</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
