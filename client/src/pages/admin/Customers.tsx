import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Search, Trash2, Mail, User, Package, Calendar, Phone, Eye,
  ChevronLeft, ChevronRight, RefreshCw, CreditCard, TrendingUp,
  Clock, CheckCircle2, XCircle, Truck,
} from "lucide-react";
import { formatEUR } from "@/lib/formatEUR";

interface CustomerUser {
  id: number; name: string | null; email: string | null; phone?: string | null;
  role: string; loginMethod: string | null; createdAt: Date; updatedAt: Date; lastSignedIn: Date;
}

const ITEMS_PER_PAGE = 15;

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  pending: { label: "Beklemede", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dotColor: "bg-amber-400" },
  accepted: { label: "Kabul Edildi", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dotColor: "bg-blue-400" },
  picked_up: { label: "Alındı", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", dotColor: "bg-purple-400" },
  in_transit: { label: "Yolda", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", dotColor: "bg-indigo-400" },
  delivered: { label: "Teslim Edildi", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dotColor: "bg-emerald-400" },
  cancelled: { label: "İptal", color: "text-red-700", bg: "bg-red-50 border-red-200", dotColor: "bg-red-400" },
};

export function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [page, setPage] = useState(1);

  const { data: allUsers, refetch } = trpc.admin.getAllUsers.useQuery({ limit: 1000 });
  const { data: allOrders } = trpc.admin.allOrders.useQuery();

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { toast.success("Müşteri silindi"); setDeletingUserId(null); refetch(); },
    onError: (error) => toast.error(error.message || "Hata oluştu"),
  });

  const customers = useMemo(() => allUsers?.users?.filter((u: CustomerUser) => u.role === "user") || [], [allUsers]);

  const getOrderCount = (userId: number) => allOrders?.filter((o: any) => o.userId === userId).length || 0;
  const getTotalSpent = (userId: number) => {
    return allOrders?.filter((o: any) => o.userId === userId && o.status === "delivered")
      .reduce((sum: number, o: any) => sum + (o.totalFee || 0), 0) || 0;
  };
  const getCustomerOrders = (userId: number) => allOrders?.filter((o: any) => o.userId === userId) || [];

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return customers.filter((u: CustomerUser) =>
      !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q)
    );
  }, [customers, searchTerm]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return customers.filter((c: CustomerUser) => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [customers]);

  const totalRevenue = useMemo(() => customers.reduce((sum: number, c: CustomerUser) => sum + getTotalSpent(c.id), 0), [customers, allOrders]);
  const activeCustomers = useMemo(() => customers.filter((c: CustomerUser) => getOrderCount(c.id) > 0).length, [customers, allOrders]);

  const stats = useMemo(() => [
    { label: "Toplam Müşteri", value: customers.length, color: "text-gray-600", bg: "bg-gray-50", ring: "ring-gray-100", icon: User },
    { label: "Bu Ay Kayıt", value: thisMonthCount, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", icon: TrendingUp },
    { label: "Sipariş Veren", value: activeCustomers, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100", icon: Package },
    { label: "Toplam Ciro", value: formatEUR(totalRevenue), color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-100", icon: CreditCard, isText: true },
  ], [customers, thisMonthCount, activeCustomers, totalRevenue]);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Müşteriler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kayıtlı müşterileri ve sipariş geçmişlerini yönetin</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <RefreshCw className="h-3.5 w-3.5" />Yenile
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s: any) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3.5 flex items-center gap-3 ring-1 ${s.ring}`}>
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0"><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="İsim, e-posta veya telefon ara..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="pl-10 h-10 text-sm border-gray-200 rounded-xl" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {!filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><User className="h-8 w-8 opacity-30" /></div>
            <p className="text-sm font-medium">Müşteri bulunamadı</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Müşteri","E-posta","Sipariş","Harcama","Kayıt","Son Giriş",""].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c: CustomerUser) => (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <button onClick={() => setSelectedCustomer(c)} className="flex items-center gap-3 text-left group/name">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                            {c.name?.charAt(0)?.toUpperCase() || "M"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm group-hover/name:text-orange-600 transition-colors">{c.name || "İsimsiz"}</p>
                            {c.phone && <p className="text-[11px] text-gray-400 flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{c.phone}</p>}
                          </div>
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" />{c.email || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold">
                          <Package className="h-3 w-3" />{getOrderCount(c.id)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-gray-900 text-sm">{formatEUR(getTotalSpent(c.id))}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        {new Date(c.lastSignedIn).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedCustomer(c)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setDeletingUserId(c.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                <p className="text-xs text-gray-500">{filtered.length} sonuçtan {(page-1)*ITEMS_PER_PAGE+1}-{Math.min(page*ITEMS_PER_PAGE, filtered.length)} gösteriliyor</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const p = i + 1;
                    return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{p}</button>;
                  })}
                  <button onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-gray-100">
            <SheetTitle className="text-lg">Müşteri Detayı</SheetTitle>
          </SheetHeader>
          {selectedCustomer && (
            <div className="space-y-5 py-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
                  {selectedCustomer.name?.charAt(0)?.toUpperCase() || "M"}
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{selectedCustomer.name || "İsimsiz"}</p>
                  <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 ring-1 ring-blue-100 text-center">
                  <p className="text-xl font-bold text-blue-600">{getOrderCount(selectedCustomer.id)}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Sipariş</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 ring-1 ring-emerald-100 text-center">
                  <p className="text-xl font-bold text-emerald-600">{getCustomerOrders(selectedCustomer.id).filter((o: any) => o.status === "delivered").length}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Tamamlanan</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 ring-1 ring-orange-100 text-center">
                  <p className="text-lg font-bold text-orange-600">{formatEUR(getTotalSpent(selectedCustomer.id))}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Harcama</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Telefon</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedCustomer.phone || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Giriş Yöntemi</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedCustomer.loginMethod || "OAuth"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Kayıt Tarihi</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{new Date(selectedCustomer.createdAt).toLocaleDateString("tr-TR")}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Son Giriş</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{new Date(selectedCustomer.lastSignedIn).toLocaleDateString("tr-TR")}</p>
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Son Siparişler</p>
                {getCustomerOrders(selectedCustomer.id).length > 0 ? (
                  <div className="space-y-2">
                    {getCustomerOrders(selectedCustomer.id).slice(0, 5).map((order: any) => {
                      const st = ORDER_STATUS[order.status] || { label: order.status, color: "text-gray-700", bg: "bg-gray-50 border-gray-200", dotColor: "bg-gray-400" };
                      return (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl ring-1 ring-gray-100">
                          <div>
                            <p className="text-sm font-medium text-gray-900">#{order.id}</p>
                            <p className="text-[11px] text-gray-400">{new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${st.bg} ${st.color}`}>
                              <div className={`w-1 h-1 rounded-full ${st.dotColor}`} />{st.label}
                            </span>
                            <span className="font-bold text-sm text-gray-900">{formatEUR(order.totalFee || 0)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">
                    <Package className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Henüz sipariş yok</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={deletingUserId !== null} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteri Sil</AlertDialogTitle>
            <AlertDialogDescription>Bu müşteri kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-xl" onClick={() => deletingUserId && deleteUser.mutate({ userId: deletingUserId })}>
              {deleteUser.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
