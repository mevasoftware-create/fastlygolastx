import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function RevenueAnalytics() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: revenueReport } = trpc.admin.getRevenueReport.useQuery({
    startDate: new Date(dateRange.startDate),
    endDate: new Date(dateRange.endDate),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gelir & Analiz</h1>
          <p className="text-sm text-gray-500">Tarih aralığına göre gelir istatistikleri</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Gelir Raporu
          </CardTitle>
          <CardDescription>Seçili tarih aralığındaki sipariş ve gelir verileri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tarih Seçici */}
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

          {/* İstatistik Kartları */}
          {revenueReport && revenueReport.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-orange-100">
                  <CardHeader className="pb-2">
                    <CardDescription>Toplam Gelir</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {(revenueReport.reduce((sum, item) => sum + (item.total || 0), 0) / 100).toFixed(2)} MKD
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-100">
                  <CardHeader className="pb-2">
                    <CardDescription>Toplam Sipariş</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {revenueReport.reduce((sum, item) => sum + (item.count || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-green-100">
                  <CardHeader className="pb-2">
                    <CardDescription>Ortalama Sipariş Değeri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {(() => {
                        const total = revenueReport.reduce((sum, item) => sum + (item.total || 0), 0);
                        const count = revenueReport.reduce((sum, item) => sum + (item.count || 0), 0);
                        return count > 0 ? ((total / count) / 100).toFixed(2) : "0.00";
                      })()} MKD
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Grafik */}
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueReport.map(item => ({ ...item, revenue: item.total }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${(value / 100).toFixed(2)} MKD`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#FF6B00" name="Günlük Gelir" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Seçili tarih aralığında veri bulunamadı</p>
              <p className="text-sm mt-1">Farklı bir tarih aralığı seçin</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
