import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, Package, Calendar } from "lucide-react";
import { formatEUR } from "@/lib/formatEUR";

type Period = "daily" | "weekly" | "monthly";

export function EarningsReport() {
  const [period, setPeriod] = useState<Period>("monthly");

  // Get earnings statistics
  const { data: stats, isLoading: statsLoading } = trpc.earnings.stats.useQuery({ period });

  // Get chart data
  const { data: chartData = [], isLoading: chartLoading } = trpc.earnings.chartData.useQuery({ period });

  // Format date based on period
  const formatDate = (dateStr: string) => {
    if (period === "daily") {
      return new Date(dateStr).toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
    } else if (period === "weekly") {
      const [year, week] = dateStr.split("-");
      return `${year} H${week}`;
    } else {
      const [year, month] = dateStr.split("-");
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("tr-TR", { year: "numeric", month: "short" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kazanç Raporları</h2>
        <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Dönem seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Günlük</SelectItem>
            <SelectItem value="weekly">Haftalık</SelectItem>
            <SelectItem value="monthly">Aylık</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kazanç</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatEUR(stats.totalEarnings)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Net: {formatEUR(stats.netEarnings)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teslimat Sayısı</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deliveryCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tamamlanan siparişler
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Kazanç</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatEUR(stats.averagePerDelivery)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Teslimat başına
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Komisyon</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatEUR(stats.totalCommission)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Toplam kesinti
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Earnings Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Kazanç Grafiği</CardTitle>
          <CardDescription>
            {period === "daily" && "Son 7 günlük kazanç trendi"}
            {period === "weekly" && "Son 4 haftalık kazanç trendi"}
            {period === "monthly" && "Son 6 aylık kazanç trendi"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Yükleniyor...</div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Bu dönemde kazanç verisi bulunamadı</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => formatEUR(value)}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => formatEUR(value)}
                  labelFormatter={formatDate}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="earnings" 
                  name="Kazanç"
                  stroke="#f97316" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Deliveries Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Teslimat Sayısı</CardTitle>
          <CardDescription>
            Dönem içindeki teslimat dağılımı
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Yükleniyor...</div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Bu dönemde teslimat verisi bulunamadı</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={formatDate}
                />
                <Legend />
                <Bar 
                  dataKey="deliveries" 
                  name="Teslimat"
                  fill="#3b82f6" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
