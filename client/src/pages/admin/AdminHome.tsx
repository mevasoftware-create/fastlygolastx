import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Users, Bike, Building2, Package, TrendingUp, Clock, CheckCircle2,
  AlertCircle, ArrowRight, ArrowUpRight, ArrowDownRight, MapPin, Star,
  CreditCard, Activity, ChevronRight, RefreshCw, Zap, Eye,
  ShoppingBag, Bell, Truck, Timer, Target, Percent,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { useMemo, useState } from "react";
import { formatEUR } from "@/lib/formatEUR";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Bekliyor", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  accepted: { label: "Kabul Edildi", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  picked_up: { label: "Alındı", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  in_transit: { label: "Yolda", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  delivered: { label: "Teslim Edildi", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cancelled: { label: "İptal", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const STATUS_COLORS = ["#f59e0b", "#3b82f6", "#6366f1", "#8b5cf6", "#10b981", "#ef4444"];

export default function AdminHome() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading, refetch } = trpc.admin.getDashboardStats.useQuery();
  const { data: allOrders } = trpc.admin.allOrders.useQuery();
  const { data: pendingCouriers } = trpc.admin.getPendingCouriers.useQuery();
  const { data: pendingBusinesses } = trpc.admin.getPendingBusinesses.useQuery();
  const [refreshing, setRefreshing] = useState(false);

  const recentOrders = allOrders?.slice(0, 6) || [];
  const totalPending = (pendingCouriers?.length || 0) + (pendingBusinesses?.length || 0);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 600);
  };

  // Weekly data
  const weeklyData = useMemo(() => {
    const days: Record<string, { day: string; fullDay: string; siparis: number; gelir: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("tr-TR", { weekday: "short" });
      const fullLabel = d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "short" });
      days[key] = { day: label, fullDay: fullLabel, siparis: 0, gelir: 0 };
    }
    (allOrders || []).forEach((o: any) => {
      const key = new Date(o.createdAt).toISOString().split("T")[0];
      if (days[key]) {
        days[key].siparis += 1;
        days[key].gelir += Number(o.totalFee || 0);
      }
    });
    return Object.values(days);
  }, [allOrders]);

  // Order status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    (allOrders || []).forEach((o: any) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_MAP[status]?.label || status,
      value: count,
      status,
    }));
  }, [allOrders]);

  // Today's stats
  const todayOrders = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return (allOrders || []).filter((o: any) => new Date(o.createdAt).toISOString().split("T")[0] === today).length;
  }, [allOrders]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platforma genel bakış ve anlık istatistikler</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm ${refreshing ? "opacity-60 pointer-events-none" : ""}`}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Yenile
          </button>
          <button
            onClick={() => setLocation("/admin/orders")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm shadow-orange-500/20"
          >
            <Package className="h-4 w-4" />
            Siparişler
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {totalPending > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 text-sm">{totalPending} bekleyen onay var</p>
              <p className="text-xs text-amber-600 mt-0.5">{pendingCouriers?.length || 0} kurye, {pendingBusinesses?.length || 0} işletme onay bekliyor</p>
            </div>
          </div>
          <button onClick={() => setLocation("/admin/couriers")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium transition-colors">
            İncele <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Toplam Kullanıcı", value: stats?.users.total || 0, sub: `${stats?.users.today || 0} bugün`, gradient: "from-blue-500 to-blue-600", lightBg: "bg-blue-50", lightText: "text-blue-600", path: "/admin/users" },
          { icon: Bike, label: "Aktif Kuryeler", value: stats?.couriers.total || 0, sub: `${stats?.couriers.active || 0} çevrimiçi`, gradient: "from-emerald-500 to-emerald-600", lightBg: "bg-emerald-50", lightText: "text-emerald-600", path: "/admin/couriers" },
          { icon: Building2, label: "İşletmeler", value: stats?.businesses.total || 0, sub: `${stats?.businesses.pending || 0} bekliyor`, gradient: "from-violet-500 to-violet-600", lightBg: "bg-violet-50", lightText: "text-violet-600", path: "/admin/businesses" },
          { icon: Package, label: "Toplam Sipariş", value: stats?.orders.total || 0, sub: `${todayOrders} bugün`, gradient: "from-orange-500 to-orange-600", lightBg: "bg-orange-50", lightText: "text-orange-600", path: "/admin/orders" },
        ].map((card) => (
          <div
            key={card.label}
            onClick={() => setLocation(card.path)}
            className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${card.lightBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className={`h-5 w-5 ${card.lightText}`} />
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
              {statsLoading ? <span className="inline-block w-12 h-7 bg-gray-100 rounded-xl animate-pulse" /> : card.value.toLocaleString("tr-TR")}
            </p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: "Bugünkü Gelir", value: stats?.revenue.today || 0, icon: TrendingUp, gradient: "from-orange-500 via-orange-600 to-amber-600" },
          { label: "Bu Ay Gelir", value: stats?.revenue.thisMonth || 0, icon: CreditCard, gradient: "from-blue-500 via-blue-600 to-indigo-600" },
          { label: "Toplam Gelir", value: stats?.revenue.total || 0, icon: Zap, gradient: "from-violet-500 via-purple-600 to-indigo-600" },
        ].map((card) => (
          <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white/80">{card.label}</p>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <card.icon className="h-4 w-4 text-white/80" />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight">{formatEUR(card.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Order Status Mini Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock, label: "Bekleyen", value: stats?.orders.pending || 0, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100" },
          { icon: Activity, label: "Aktif", value: stats?.orders.active || 0, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100" },
          { icon: CheckCircle2, label: "Tamamlanan", value: stats?.orders.completed || 0, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} rounded-2xl p-4 flex items-center gap-3 ring-1 ${item.ring}`}>
            <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900 text-[15px]">Sipariş Trendi</h2>
              <p className="text-xs text-gray-400 mt-0.5">Son 7 gün</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-gray-500">Sipariş</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <span className="text-gray-500">Gelir</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDay || ""}
              />
              <Area type="monotone" dataKey="siparis" stroke="#f97316" strokeWidth={2} fill="url(#orderGrad)" name="Sipariş" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="gelir" stroke="#8b5cf6" strokeWidth={2} fill="url(#revenueGrad)" name="Gelir (€)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 text-[15px] mb-1">Sipariş Dağılımı</h2>
          <p className="text-xs text-gray-400 mb-4">Duruma göre</p>
          {statusDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusDistribution.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusDistribution.map((item, i) => (
                  <div key={item.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">Veri yok</div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 text-[15px]">Son Siparişler</h2>
            <p className="text-xs text-gray-400 mt-0.5">Son eklenen siparişler</p>
          </div>
          <button onClick={() => setLocation("/admin/orders")} className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors">
            Tümünü Gör <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Sipariş No</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Alış Noktası</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Teslimat</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Durum</th>
                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">Henüz sipariş yok</td></tr>
              ) : (
                recentOrders.map((order: any, idx: number) => {
                  const s = STATUS_MAP[order.status] || { label: order.status, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" };
                  return (
                    <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-1.5 max-w-[180px]">
                          <div className="w-5 h-5 rounded-md bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin className="h-3 w-3 text-orange-500" />
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{order.pickupAddress}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-1.5 max-w-[180px]">
                          <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin className="h-3 w-3 text-emerald-500" />
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{order.deliveryAddress}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <p className="font-semibold text-gray-900 text-sm">{formatEUR(order.totalFee)}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Kurye Onayla", desc: "Bekleyen başvurular", icon: Bike, path: "/admin/couriers", color: "text-blue-600", bg: "bg-blue-50 hover:bg-blue-100", ring: "ring-blue-100" },
          { label: "Canlı Harita", desc: "Anlık takip", icon: MapPin, path: "/admin/map", color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100", ring: "ring-emerald-100" },
          { label: "Bildirim Gönder", desc: "Toplu bildirim", icon: Bell, path: "/admin/notifications", color: "text-violet-600", bg: "bg-violet-50 hover:bg-violet-100", ring: "ring-violet-100" },
          { label: "Değerlendirmeler", desc: "Puanlar & yorumlar", icon: Star, path: "/admin/ratings", color: "text-amber-600", bg: "bg-amber-50 hover:bg-amber-100", ring: "ring-amber-100" },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => setLocation(action.path)}
            className={`flex items-center gap-3 p-4 rounded-2xl ${action.bg} ring-1 ${action.ring} transition-all text-left group`}
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${action.color}`}>{action.label}</p>
              <p className="text-[11px] text-gray-500 truncate">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
