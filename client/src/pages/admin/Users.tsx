import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Trash2, Mail, Shield } from "lucide-react";

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const { data: usersData, refetch } = trpc.admin.getAllUsers.useQuery({
    limit: 100,
    offset: 0,
  });

  const users = usersData?.users || [];

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Kullanıcı silindi");
      setDeletingUserId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Hata oluştu");
    },
  });

  // Filter users
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      filterRole === "all" ||
      (filterRole === "admin" && user.role === "admin") ||
      (filterRole === "courier" && user.role === "courier") ||
      (filterRole === "business" && user.role === "business") ||
      (filterRole === "user" && user.role === "user");

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      admin: { label: "Admin", className: "bg-red-100 text-red-800" },
      courier: { label: "Kurye", className: "bg-blue-100 text-blue-800" },
      business: { label: "İşletme", className: "bg-green-100 text-green-800" },
      user: { label: "Kullanıcı", className: "bg-gray-100 text-gray-800" },
    };
    const config = roleConfig[role] || { label: role, className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kullanıcılar</h2>
          <p className="text-muted-foreground">Tüm kullanıcıları yönetin</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İsim veya email ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Tüm Roller</option>
                <option value="admin">Admin</option>
                <option value="courier">Kurye</option>
                <option value="business">İşletme</option>
                <option value="user">Kullanıcı</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi ({filteredUsers.length || 0})</CardTitle>
          <CardDescription>
            Toplam {usersData?.total || 0} kullanıcı kayıtlı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Giriş Yöntemi</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-sm">#{user.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{user.name || "İsimsiz"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {user.email || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.loginMethod || "OAuth"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeletingUserId(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {user.role === "admin" && (
                        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Kullanıcı bulunamadı
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingUserId !== null} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kullanıcı kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deletingUserId) {
                  deleteUser.mutate({ userId: deletingUserId });
                }
              }}
            >
              Sil
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
