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
import { DollarSign, CheckCircle, XCircle, Clock, AlertCircle, Loader2, TrendingUp, Wallet, ArrowDownCircle } from 'lucide-react';

function formatEUR(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

export default function CourierPayments() {
  const { user } = useAuth();
  const [requestAmount, setRequestAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get earnings summary
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = trpc.courierV2.getEarningsSummary.useQuery();

  // Get payment requests
  const { data: paymentRequests, isLoading: requestsLoading, refetch } = trpc.courierV2.getPaymentRequests.useQuery();

  // Create payment request mutation
  const requestPaymentMutation = trpc.courierV2.requestPayment.useMutation({
    onSuccess: () => {
      toast.success('Para çekme talebiniz başarıyla gönderildi');
      setRequestAmount('');
      setIsDialogOpen(false);
      refetch();
      refetchSummary();
    },
    onError: (error) => {
      toast.error(error.message || 'Para çekme talebi gönderilemedi');
    },
  });

  const handleRequestPayment = async () => {
    const amount = parseFloat(requestAmount);
    if (!requestAmount || amount <= 0) {
      toast.error('Lütfen geçerli bir tutar girin');
      return;
    }
    if (amount < 1) {
      toast.error('Minimum çekim tutarı €1.00');
      return;
    }
    const amountInCents = Math.round(amount * 100);
    await requestPaymentMutation.mutateAsync({ amount: amountInCents });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"><Clock className="h-3 w-3 mr-1" /> Beklemede</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Onaylandı</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"><XCircle className="h-3 w-3 mr-1" /> Reddedildi</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"><DollarSign className="h-3 w-3 mr-1" /> Ödendi</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!user || user.role !== 'courier') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erişim Reddedildi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Bu sayfaya erişim için kurye yetkisi gereklidir.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableBalance = summary?.availableBalance ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Para Çekme</h1>
        <p className="text-muted-foreground">Kazancınızı çekin</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Toplam Kazanç
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">{formatEUR(summary?.totalEarnings ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">{summary?.totalDeliveries ?? 0} teslim tamamlandı</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Çekilebilir Bakiye
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{formatEUR(availableBalance)}</div>
                <p className="text-xs text-muted-foreground mt-1">Çekim için hazır</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Bekleyen Talepler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">{formatEUR(summary?.pendingAmount ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">İncelemede</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4" /> Toplam Çekilen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatEUR(summary?.totalWithdrawn ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Onaylanan ödemeler</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Para Çekme Talebi</CardTitle>
          <CardDescription>Ödeme bilgilerinizi kontrol edin ve çekim talebinde bulunun</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-sm">
            <div>
              <Label htmlFor="amount">Miktar (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                max={availableBalance / 100}
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                placeholder="Çekmek istediğiniz miktar"
                className="mt-1"
              />
              {availableBalance > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Kullanılabilir: <span className="font-medium text-green-600">{formatEUR(availableBalance)}</span>
                  {' · '}
                  <button
                    type="button"
                    className="text-orange-600 hover:underline"
                    onClick={() => setRequestAmount((availableBalance / 100).toFixed(2))}
                  >
                    Tamamını çek
                  </button>
                </p>
              )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={!requestAmount || parseFloat(requestAmount) <= 0 || availableBalance <= 0}
                  onClick={() => {
                    if (!requestAmount || parseFloat(requestAmount) <= 0) {
                      toast.error('Lütfen bir miktar girin');
                      return;
                    }
                    setIsDialogOpen(true);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Çekim Talebi Oluştur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Para Çekme Onayı</DialogTitle>
                  <DialogDescription>
                    Aşağıdaki tutarı çekmek istediğinizi onaylıyor musunuz?
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-orange-600">€{parseFloat(requestAmount || '0').toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground mt-1">IBAN hesabınıza aktarılacak</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Talebiniz admin tarafından incelenecek ve onaylanacaktır.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                      İptal
                    </Button>
                    <Button
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      onClick={handleRequestPayment}
                      disabled={requestPaymentMutation.isPending}
                    >
                      {requestPaymentMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gönderiliyor...</>
                      ) : (
                        <><CheckCircle className="h-4 w-4 mr-2" /> Onayla</>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Çekim Geçmişi</CardTitle>
          <CardDescription>Tüm para çekme talepleriniz</CardDescription>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : !paymentRequests || paymentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Henüz para çekme talebiniz yok</p>
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
                      <TableCell className="font-bold">{formatEUR(request.amount)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(request.requestedAt).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {request.processedAt ? new Date(request.processedAt).toLocaleDateString('tr-TR') : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {request.rejectionReason ? (
                          <span className="text-red-600">{request.rejectionReason}</span>
                        ) : request.notes ? (
                          request.notes
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
