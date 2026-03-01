import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/currency";
import {
  Users, Bike, Building2, Package, TrendingUp, Clock, CheckCircle2,
  AlertCircle, ArrowRight, MapPin, Star, CreditCard, Activity,
  ChevronRight, RefreshCw, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { useMemo } from "react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-700" },
  accepted: { label: "Kabul Edildi", color: "bg-blue-100 text-blue-700" },
  picked_up: { label: "Alındı", color: "bg-indigo-100 text-indigo-700" },
  in_transit: { label: "Yolda", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Teslim Edildi", color: "bg-green-100 text-green-700" },
  cancelled: { label: "İptal", color: "bg-red-100 text-red-700" },
};

function StatCard({ icon: Icon, title, value, sub, subLabel, color, onClick }: {
  icon: any; title: string; value: number | string; sub?: number | string;
  subLabel?: string; color: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {sub !== undefined && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-50 text-orange-600">{sub} {subLabel}</span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

function RevenueCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent: string }) {
  return (
    <div className={`rounded-2xl p-5 text-white ${accent}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <Icon className="h-5 w-5 opacity-70" />
      </div>
      <p className="text-2xl font-bold">{formatCurrency(value)}</p>
    </div>
  );
}

export default function AdminHome() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading, refetch } = trpc.admin.getDashboardStats.useQuery();
  const { data: allOrders } = trpc.admin.allOrders.useQuery();
  const { data: pendingCouriers } = trpc.admin.getPendingCouriers.useQuery();
  const { data: pendingBusinesses } = trpc.admin.getPendingBusinesses.useQuery();

  const recentOrders = allOrders?.slice(0, 8) || [];
  const totalPending = (pendingCouriers?.length || 0) + (pendingBusinesses?.length || 0);

  // Son 7 günlük sipariş ve gelir verisi
  const weeklyData = useMemo(() => {
    const days: Record<string, { day: string; siparis: number; gelir: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" });
      days[key] = { day: label, siparis: 0, gelir: 0 };
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platforma genel bakış</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <RefreshCw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      {totalPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">{totalPending} bekleyen onay var</p>
              <p className="text-xs text-amber-600">{pendingCouriers?.length || 0} kurye, {pendingBusinesses?.length || 0} işletme onay bekliyor</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setLocation("/admin/couriers")}>
            İncele <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} title="Toplam Kullanıcı" value={statsLoading ? "—" : stats?.users.total || 0} sub={stats?.users.today} subLabel="bugün" color="bg-gradient-to-br from-orange-400 to-orange-600" onClick={() => setLocation("/admin/users")} />
        <StatCard icon={Bike} title="Kuryeler" value={statsLoading ? "—" : stats?.couriers.total || 0} sub={stats?.couriers.active} subLabel="aktif" color="bg-gradient-to-br from-blue-400 to-blue-600" onClick={() => setLocation("/admin/couriers")} />
        <StatCard icon={Building2} title="İşletmeler" value={statsLoading ? "—" : stats?.businesses.total || 0} sub={stats?.businesses.pending} subLabel="bekliyor" color="bg-gradient-to-br from-purple-400 to-purple-600" onClick={() => setLocation("/admin/businesses")} />
        <StatCard icon={Package} title="Toplam Sipariş" value={statsLoading ? "—" : stats?.orders.total || 0} sub={stats?.orders.active} subLabel="aktif" color="bg-gradient-to-br from-green-400 to-green-600" onClick={() => setLocation("/admin/orders")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats?.orders.pending || 0}</p>
            <p className="text-xs text-gray-500">Bekleyen Sipariş</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats?.orders.active || 0}</p>
            <p className="text-xs text-gray-500">Aktif Sipariş</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats?.orders.completed || 0}</p>
            <p className="text-xs text-gray-500">Tamamlanan</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RevenueCard label="Bugünkü Gelir" value={stats?.revenue.today || 0} icon={TrendingUp} accent="bg-gradient-to-br from-orange-500 to-orange-700" />
        <RevenueCard label="Bu Ay Gelir" value={stats?.revenue.thisMonth || 0} icon={CreditCard} accent="bg-gradient-to-br from-blue-500 to-blue-700" />
        <RevenueCard label="Toplam Gelir" value={stats?.revenue.total || 0} icon={Zap} accent="bg-gradient-to-br from-purple-500 to-purple-700" />
      </div>

      {/* Haftalık Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Haftalık Sipariş Trendi</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sipGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 12 }} />
              <Area type="monotone" dataKey="siparis" stroke="#f97316" strokeWidth={2.5} fill="url(#sipGrad)" name="Sipariş" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Haftalık Gelir (€)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gelirGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#6d28d9" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v: any) => [`€${Number(v).toFixed(2)}`, "Gelir"]} />
              <Bar dataKey="gelir" fill="url(#gelirGrad)" radius={[6, 6, 0, 0]} name="Gelir" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Son Siparişler</h2>
          <button onClick={() => setLocation("/admin/orders")} className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium">
            Tümünü Gör <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Sipariş</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Alış</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Teslimat</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Durum</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Henüz sipariş yok</td></tr>
              ) : (
                recentOrders.map((order: any) => {
                  const s = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-1.5 max-w-[160px]">
                          <MapPin className="h-3.5 w-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-600 line-clamp-2">{order.pickupAddress}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-1.5 max-w-[160px]">
                          <MapPin className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-600 line-clamp-2">{order.deliveryAddress}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900 text-sm">{formatCurrency(order.totalFee || 0)}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Kurye Onayla", icon: Bike, path: "/admin/couriers", color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
          { label: "Siparişler", icon: Package, path: "/admin/orders", color: "text-orange-600 bg-orange-50 hover:bg-orange-100" },
          { label: "Değerlendirmeler", icon: Star, path: "/admin/ratings", color: "text-yellow-600 bg-yellow-50 hover:bg-yellow-100" },
          { label: "Canlı Harita", icon: MapPin, path: "/admin/map", color: "text-green-600 bg-green-50 hover:bg-green-100" },
        ].map((action) => (
          <button key={action.path} onClick={() => setLocation(action.path)} className={`flex items-center gap-3 p-4 rounded-2xl font-medium text-sm transition-all ${action.color}`}>
            <action.icon className="h-5 w-5" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
