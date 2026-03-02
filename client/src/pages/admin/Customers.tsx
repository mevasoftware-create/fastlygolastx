import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Trash2, Mail, User, Package, Calendar, Phone, MapPin, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatEUR } from "@/lib/formatEUR";

interface CustomerUser {
  id: number;
  name: string | null;
  email: string | null;
  phone?: string | null;
  role: string;
  loginMethod: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);

  const { data: allUsers, refetch } = trpc.admin.getAllUsers.useQuery({ limit: 1000 });
  const { data: allOrders } = trpc.admin.allOrders.useQuery();

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Müşteri silindi");
      setDeletingUserId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Hata oluştu");
    },
  });

  // Filter only customers (role = "user")
  const customers = allUsers?.users?.filter((user: CustomerUser) => user.role === "user") || [];

  // Filter by search term
  const filteredCustomers = customers.filter((user: CustomerUser) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get order count for a customer
  const getOrderCount = (userId: number) => {
    if (!allOrders) return 0;
    return allOrders.filter((order: any) => order.userId === userId).length;
  };

  // Get total spent for a customer (returns MKD, display as EUR)
  const getTotalSpent = (userId: number) => {
    if (!allOrders) return 0;
    const customerOrders = allOrders.filter((order: any) => order.userId === userId && order.status === 'delivered');
    return customerOrders.reduce((sum: number, order: any) => sum + (order.totalFee || 0), 0);
  };


  // Get customer orders
  const getCustomerOrders = (userId: number) => {
    if (!allOrders) return [];
    return allOrders.filter((order: any) => order.userId === userId);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Beklemede", className: "bg-yellow-100 text-yellow-800" },
      accepted: { label: "Kabul Edildi", className: "bg-blue-100 text-blue-800" },
      picked_up: { label: "Alındı", className: "bg-purple-100 text-purple-800" },
      in_transit: { label: "Yolda", className: "bg-indigo-100 text-indigo-800" },
      delivered: { label: "Teslim Edildi", className: "bg-green-100 text-green-800" },
      cancelled: { label: "İptal", className: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Müşteriler</h2>
          <p className="text-muted-foreground">Tüm müşterileri (düz üyeleri) yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <User className="h-4 w-4 mr-2" />
            {customers.length} Müşteri
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Müşteri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bu Ay Kayıt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customers.filter((c: CustomerUser) => {
                const createdAt = new Date(c.createdAt);
                const now = new Date();
                return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sipariş Veren</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {customers.filter((c: CustomerUser) => getOrderCount(c.id) > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Ciro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatEUR(customers.reduce((sum: number, c: CustomerUser) => sum + getTotalSpent(c.id), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Ara</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İsim, email veya telefon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Müşteri Listesi ({filteredCustomers.length})</CardTitle>
          <CardDescription>
            Toplam {customers.length} müşteri kayıtlı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Sipariş</TableHead>
                <TableHead>Toplam Harcama</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead>Son Giriş</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer: CustomerUser) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-mono text-sm">#{customer.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{customer.name || "İsimsiz"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {customer.email || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {customer.phone || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50">
                      <Package className="h-3 w-3 mr-1" />
                      {getOrderCount(customer.id)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">
                      {formatEUR(getTotalSpent(customer.id))}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(customer.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(customer.lastSignedIn)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeletingUserId(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Müşteri bulunamadı
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={selectedCustomer !== null} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Müşteri Detayları</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kişisel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">İsim</p>
                    <p className="font-medium">{selectedCustomer.name || "İsimsiz"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedCustomer.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-medium">{selectedCustomer.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Giriş Yöntemi</p>
                    <Badge variant="outline">{selectedCustomer.loginMethod || "OAuth"}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kayıt Tarihi</p>
                    <p className="font-medium">{formatDateTime(selectedCustomer.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Son Giriş</p>
                    <p className="font-medium">{formatDateTime(selectedCustomer.lastSignedIn)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sipariş İstatistikleri</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{getOrderCount(selectedCustomer.id)}</p>
                    <p className="text-sm text-muted-foreground">Toplam Sipariş</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {getCustomerOrders(selectedCustomer.id).filter((o: any) => o.status === 'delivered').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Tamamlanan</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{formatEUR(getTotalSpent(selectedCustomer.id))}</p>
                    <p className="text-sm text-muted-foreground">Toplam Harcama</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Son Siparişler</CardTitle>
                </CardHeader>
                <CardContent>
                  {getCustomerOrders(selectedCustomer.id).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sipariş No</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Tutar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getCustomerOrders(selectedCustomer.id).slice(0, 5).map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono">#{order.id}</TableCell>
                            <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="font-medium">{formatEUR(order.totalFee || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Henüz sipariş yok</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingUserId !== null} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteri Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu müşteri kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
