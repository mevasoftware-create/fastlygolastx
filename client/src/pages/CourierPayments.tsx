import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DollarSign, CheckCircle, XCircle, Clock, AlertCircle, Loader2, TrendingUp } from 'lucide-react';

export default function CourierPayments() {
  const { user } = useAuth();
  const [requestAmount, setRequestAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get courier info
  const { data: courierData } = trpc.courier.getProfile.useQuery();

  // Get payment requests
  const { data: paymentRequests, isLoading: requestsLoading, refetch } = trpc.courier.getPaymentRequests.useQuery();

  // Mutations
  const requestPaymentMutation = trpc.courier.requestPayment.useMutation({
    onSuccess: () => {
      toast.success('Ödeme talebiniz başarıyla gönderildi');
      setRequestAmount('');
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error('Hata: ' + (error.message || 'Ödeme talebiniz gönderilemedi'));
    },
  });

  const handleRequestPayment = async () => {
    if (!requestAmount || parseFloat(requestAmount) <= 0) {
      toast.error('Lütfen geçerli bir tutar girin');
      return;
    }

    const amountInCents = Math.round(parseFloat(requestAmount) * 100);
    
    await requestPaymentMutation.mutateAsync({
      amount: amountInCents,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Beklemede</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Onaylandı</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Reddedildi</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200"><DollarSign className="h-3 w-3 mr-1" /> Ödendi</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Calculate statistics
  const stats = {
    totalRequested: paymentRequests?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0,
    pending: paymentRequests?.filter((r: any) => r.status === 'pending').length || 0,
    approved: paymentRequests?.filter((r: any) => r.status === 'approved').length || 0,
    paid: paymentRequests?.filter((r: any) => r.status === 'paid').length || 0,
    pendingAmount: paymentRequests?.filter((r: any) => r.status === 'pending').reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0,
  };

  if (!user || user.role !== 'courier') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erişim Reddedildi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Bu sayfaya erişim için kurye yetkisi gereklidir.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ödeme Yönetimi</h1>
          <p className="text-gray-600 mt-2">Kazançlarınızı talep edin ve ödeme durumunuzu takip edin</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Talep</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{(stats.totalRequested / 100).toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">{paymentRequests?.length || 0} talep</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Beklemede</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">₺{(stats.pendingAmount / 100).toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">{stats.pending} talep</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Onaylandı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-gray-500 mt-1">talep</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ödendi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.paid}</div>
              <p className="text-xs text-gray-500 mt-1">talep</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <Card>
          <CardHeader>
            <CardTitle>Yeni Ödeme Talebinde Bulun</CardTitle>
            <CardDescription>Kazançlarınızdan bir miktar talep edin</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Ödeme Talep Et
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ödeme Talebinde Bulun</DialogTitle>
                  <DialogDescription>
                    Talep etmek istediğiniz tutarı girin
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium">
                      Tutar (₺)
                    </Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={requestAmount}
                        onChange={(e) => setRequestAmount(e.target.value)}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      En az ₺10.00 talep edebilirsiniz
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Not:</strong> Ödeme talebiniz admin tarafından incelenecek ve onaylanacaktır. Onay sonrası belirlenen ödeme yöntemine göre ödenecektir.
                    </p>
                  </div>

                  <Button
                    onClick={handleRequestPayment}
                    disabled={requestPaymentMutation.isPending || !requestAmount || parseFloat(requestAmount) <= 0}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    {requestPaymentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Talep Et
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Payment Requests History */}
        <Card>
          <CardHeader>
            <CardTitle>Ödeme Talep Geçmişi</CardTitle>
            <CardDescription>Tüm ödeme taleplerini ve durumlarını görüntüleyin</CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              </div>
            ) : !paymentRequests || paymentRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Henüz ödeme talebiniz yok</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Talep Tarihi</TableHead>
                      <TableHead>İşlem Tarihi</TableHead>
                      <TableHead>Açıklama</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-bold">₺{(request.amount / 100).toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(request.requestedAt).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {request.processedAt ? new Date(request.processedAt).toLocaleDateString('tr-TR') : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {request.status === 'rejected' && request.rejectionReason ? (
                            <div className="text-red-600">
                              <p className="font-medium">Red Nedeni:</p>
                              <p>{request.rejectionReason}</p>
                            </div>
                          ) : request.notes ? (
                            <p>{request.notes}</p>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Ödeme Bilgileri</CardTitle>
            <CardDescription>Ödeme hesabı bilgileriniz</CardDescription>
          </CardHeader>
          <CardContent>
            {courierData?.iban ? (
              <div className="space-y-2">
                <div>
                  <Label className="text-sm text-gray-600">IBAN</Label>
                  <p className="font-mono text-sm">{courierData.iban}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Kimlik Türü</Label>
                  <p className="text-sm">{courierData.identityType === 'tc' ? 'TC Kimlik' : 'Pasaport'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Kimlik Doğrulama</Label>
                  <Badge variant={courierData.identityVerified ? "default" : "outline"}>
                    {courierData.identityVerified ? 'Doğrulandı' : 'Beklemede'}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Uyarı:</strong> Ödeme bilgilerinizi tamamlamadınız. Ödeme talebinde bulunabilmek için lütfen profil ayarlarından ödeme bilgilerinizi girin.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
