import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Wallet, ShoppingBag, BarChart, Pencil, Loader2 } from "lucide-react";
import { formatEUR } from "@/lib/formatEUR";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function PricingAndRevenue() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: pricingSettings, refetch: refetchPricing, isLoading: isLoadingPricing } = trpc.admin.getPricingSettings.useQuery();
  const { data: revenueReport, isLoading: isLoadingReport } = trpc.admin.getRevenueReport.useQuery({
    startDate: new Date(dateRange.startDate),
    endDate: new Date(dateRange.endDate),
  });
  const updatePricingMutation = trpc.admin.updatePricingSettings.useMutation();

  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ baseFee: 0, perKmFee: 0 });

  const handleEditPricing = (scenario: any) => {
    setEditingScenario(scenario.scenario);
    setEditForm({
      baseFee: scenario.baseFee / 100, // convert cents to EUR for input
      perKmFee: scenario.perKmFee / 100,
    });
  };

  const handleSavePricing = async () => {
    if (!editingScenario) return;

    try {
      await updatePricingMutation.mutateAsync({
        scenario: editingScenario,
        baseFee: Math.round(editForm.baseFee * 100), // Convert to cents
        perKmFee: Math.round(editForm.perKmFee * 100),
        minFee: 0, // minFee is not editable in this UI, so we send 0 or its existing value
      });

      toast.success("Fiyatlandırma ayarları güncellendi");
      setEditingScenario(null);
      refetchPricing();
    } catch (error) {
      toast.error("Güncelleme başarısız");
    }
  };

  const totalRevenue = revenueReport?.reduce((sum, item) => sum + (item.total || 0), 0) ?? 0;
  const totalOrders = revenueReport?.reduce((sum, item) => sum + (item.count || 0), 0) ?? 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gelir ve Fiyatlandırma</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gelir raporlarını görüntüleyin ve fiyatlandırma senaryolarını yönetin.</p>
      </div>

      {/* Revenue Report Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 space-y-5">
        <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-gray-700" />
            <div>
                <h2 className="font-semibold text-gray-900">Gelir Raporu</h2>
                <p className="text-xs text-gray-500">Tarih aralığına göre gelir istatistikleri</p>
            </div>
        </div>

        {/* Date Range Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Başlangıç Tarihi</label>
                <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="rounded-xl mt-1"
                />
            </div>
            <div>
                <label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Bitiş Tarihi</label>
                <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="rounded-xl mt-1"
                />
            </div>
        </div>

        {isLoadingReport ? (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        ) : revenueReport && revenueReport.length > 0 ? (
            <div className="space-y-5">
                {/* Revenue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-blue-100">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <Wallet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-800 font-medium">Toplam Gelir</p>
                            <p className="text-xl font-bold text-blue-900">{formatEUR(totalRevenue)}</p>
                        </div>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-amber-100">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <ShoppingBag className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-amber-800 font-medium">Toplam Sipariş</p>
                            <p className="text-xl font-bold text-amber-900">{totalOrders}</p>
                        </div>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-emerald-100">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <BarChart className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-emerald-800 font-medium">Ort. Sipariş Değeri</p>
                            <p className="text-xl font-bold text-emerald-900">{formatEUR(averageOrderValue)}</p>
                        </div>
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className="h-[350px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueReport.map(item => ({ ...item, date: new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short'}), revenue: item.total }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#d1d5db' }} tickLine={{ stroke: '#d1d5db' }} />
                            <YAxis tickFormatter={(value) => formatEUR(value)} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#d1d5db' }} tickLine={{ stroke: '#d1d5db' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem' }}
                                labelStyle={{ fontWeight: 'bold' }}
                                formatter={(value: number) => [formatEUR(value), 'Gelir']}
                            />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Line type="monotone" dataKey="revenue" name="Günlük Gelir" stroke="#f97316" strokeWidth={2} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6, fill: '#f97316' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                    <BarChart className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Seçilen tarih aralığı için veri bulunamadı.</p>
                <p className="text-xs text-gray-500">Farklı bir tarih aralığı seçmeyi deneyin.</p>
            </div>
        )}
      </div>

      {/* Pricing Settings Section */}
      <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-5 lg:p-6">
            <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-gray-700" />
                <div>
                    <h2 className="font-semibold text-gray-900">Fiyatlandırma Ayarları</h2>
                    <p className="text-xs text-gray-500">Araç tiplerine göre fiyat senaryoları</p>
                </div>
            </div>
          </div>

        {isLoadingPricing ? (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
        ) : (
            <div className="divide-y divide-gray-100">
                {pricingSettings?.map((scenario) => (
                    <div key={scenario.scenario} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                        {editingScenario === scenario.scenario ? (
                            <div className="space-y-4">
                                <p className="font-semibold text-gray-800">Senaryo {scenario.scenario} Düzenleniyor</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Taban Ücret (€)</Label>
                                        <Input
                                            type="number"
                                            value={editForm.baseFee}
                                            onChange={(e) => setEditForm({ ...editForm, baseFee: parseFloat(e.target.value) || 0 })}
                                            className="rounded-xl mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Km Başına Ücret (€)</Label>
                                        <Input
                                            type="number"
                                            value={editForm.perKmFee}
                                            onChange={(e) => setEditForm({ ...editForm, perKmFee: parseFloat(e.target.value) || 0 })}
                                            className="rounded-xl mt-1"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" className="rounded-xl" onClick={() => setEditingScenario(null)}>İptal</Button>
                                    <Button className="rounded-xl bg-orange-500 hover:bg-orange-600" onClick={handleSavePricing} disabled={updatePricingMutation.isPending}>
                                        {updatePricingMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Kaydet
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold text-gray-800">Senaryo {scenario.scenario}</span>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <span>Taban Ücret: <span className="font-medium text-gray-800">{formatEUR(scenario.baseFee)}</span></span>
                                        <span>Km Başına: <span className="font-medium text-gray-800">{formatEUR(scenario.perKmFee)}/km</span></span>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="outline" className="rounded-xl flex items-center gap-1.5" onClick={() => handleEditPricing(scenario)}>
                                        <Pencil className="h-3.5 w-3.5"/>
                                        Düzenle
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
