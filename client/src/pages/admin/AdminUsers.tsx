import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Trash2, Users, RefreshCw, Mail, Calendar, ShieldCheck, ChevronLeft, ChevronRight, UserCircle, Filter } from "lucide-react";

const ITEMS_PER_PAGE = 15;
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  admin: { label: "Admin", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", gradient: "from-purple-500 to-indigo-600" },
  user: { label: "Kullanıcı", color: "text-gray-600", bg: "bg-gray-50 border-gray-200", gradient: "from-blue-400 to-blue-600" },
};

export function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const { data: usersData, refetch, isLoading } = trpc.admin.getAllUsers.useQuery({ limit: 500, offset: 0 });
  const users = usersData?.users;
  const deleteMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { toast.success("Kullanıcı silindi"); refetch(); setDeletingId(null); },
    onError: (e: any) => toast.error("Hata: " + e.message),
  });

  const filtered = useMemo(() => {
    return users?.filter((u: any) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchRole = filterRole === "all" || u.role === filterRole;
      return matchSearch && matchRole;
    }) || [];
  }, [users, searchTerm, filterRole]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const adminCount = users?.filter((u: any) => u.role === "admin").length || 0;
  const userCount = users?.filter((u: any) => u.role !== "admin").length || 0;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kullanıcılar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kayıtlı kullanıcı hesaplarını yönetin</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <RefreshCw className="h-3.5 w-3.5" />Yenile
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-gray-100">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><Users className="h-4 w-4 text-gray-600" /></div>
          <div><p className="text-xl font-bold text-gray-900">{users?.length || 0}</p><p className="text-[11px] text-gray-500">Toplam</p></div>
        </div>
        <div className="bg-purple-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-purple-100">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><ShieldCheck className="h-4 w-4 text-purple-600" /></div>
          <div><p className="text-xl font-bold text-purple-600">{adminCount}</p><p className="text-[11px] text-gray-500">Admin</p></div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-3.5 flex items-center gap-3 ring-1 ring-blue-100">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><UserCircle className="h-4 w-4 text-blue-600" /></div>
          <div><p className="text-xl font-bold text-blue-600">{userCount}</p><p className="text-[11px] text-gray-500">Kullanıcı</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="İsim veya e-posta ara..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="pl-10 h-10 text-sm border-gray-200 rounded-xl" />
        </div>
        <Select value={filterRole} onValueChange={(v) => { setFilterRole(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40 h-10 text-sm border-gray-200 rounded-xl">
            <div className="flex items-center gap-2"><Filter className="h-3.5 w-3.5 text-gray-400" /><SelectValue placeholder="Tüm Roller" /></div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Roller</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">Kullanıcı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 h-4 bg-gray-100 rounded-lg animate-pulse" />
                <div className="w-24 h-4 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Users className="h-8 w-8 opacity-30" /></div>
            <p className="text-sm font-medium">Kullanıcı bulunamadı</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Kullanıcı","E-posta","Rol","Kayıt Tarihi",""].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((u: any) => {
                    const role = ROLE_CONFIG[u.role] || ROLE_CONFIG.user;
                    return (
                      <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
                              {u.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{u.name || "İsimsiz"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="h-3 w-3" />{u.email}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${role.bg} ${role.color}`}>
                            {u.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                            {role.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => setDeletingId(u.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                <p className="text-xs text-gray-500">{filtered.length} sonuçtan {(page-1)*ITEMS_PER_PAGE+1}-{Math.min(page*ITEMS_PER_PAGE, filtered.length)} gösteriliyor</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const p = i + 1;
                    return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{p}</button>;
                  })}
                  <button onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
            <AlertDialogDescription>Bu kullanıcı kalıcı olarak silinecek. Bu işlem geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate({ userId: deletingId })} className="bg-red-600 hover:bg-red-700 rounded-xl">
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
