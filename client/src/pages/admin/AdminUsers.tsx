import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Trash2, Users, RefreshCw, Mail, Calendar, ShieldCheck } from "lucide-react";

export function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { data: usersData, refetch, isLoading } = trpc.admin.getAllUsers.useQuery({ limit: 100, offset: 0 });
  const users = usersData?.users;
  const deleteMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { toast.success("Kullanıcı silindi"); refetch(); setDeletingId(null); },
    onError: (e: any) => toast.error("Hata: " + e.message),
  });

  const filtered = users?.filter((u: any) => {
    const q = searchTerm.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kullanıcılar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kayıtlı kullanıcı hesaplarını yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{users?.length || 0}</span>
            <span className="text-xs text-gray-500">Toplam</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />Yenile
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="İsim veya e-posta ara..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm border-gray-200" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Yükleniyor...</div>
        ) : !filtered?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Kullanıcı bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Kullanıcı","E-posta","Rol","Kayıt Tarihi",""].map((h, i) => (
                    <th key={i} className={`px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <span className="font-medium text-gray-900">{u.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />{u.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${u.role === "admin" ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                        {u.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                        {u.role === "admin" ? "Admin" : "Kullanıcı"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(u.createdAt).toLocaleDateString("tr-TR")}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600" onClick={() => setDeletingId(u.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
            <AlertDialogDescription>Bu kullanıcı kalıcı olarak silinecek.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate({ userId: deletingId })} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
