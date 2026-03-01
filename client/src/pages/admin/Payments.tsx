import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DollarSign, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

export function PaymentsPage() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Queries
  const { data: paymentRequests, isLoading, refetch } = trpc.admin.getAllPaymentRequests.useQuery();

  // Mutations
  const approveMutation = trpc.admin.approvePaymentRequest.useMutation({
    onSuccess: () => {
      toast.success('Ödeme talebı onaylandı');
      refetch();
      setSelectedRequest(null);
      setNotes('');
    },
    onError: (error: any) => {
      toast.error('Hata: ' + (error.message || 'Ödeme talebı onaylanamadı'));
    },
  });

  const rejectMutation = trpc.admin.rejectPaymentRequest.useMutation({
    onSuccess: () => {
      toast.success('Ödeme talebı reddedildi');
      refetch();
      setSelectedRequest(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error('Hata: ' + (error.message || 'Ödeme talebı reddedilemedi'));
    },
  });

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    await approveMutation.mutateAsync({
      requestId: selectedRequest.id,
      notes: notes || undefined,
    });
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Lütfen red nedenini girin');
      return;
    }

    await rejectMutation.mutateAsync({
      requestId: selectedRequest.id,
      reason: rejectionReason,
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

  const filteredRequests = paymentRequests?.filter((req: any) => {
    if (filterStatus === 'all') return true;
    return req.status === filterStatus;
  }) || [];

  const stats = {
    total: paymentRequests?.length || 0,
    pending: paymentRequests?.filter((r: any) => r.status === 'pending').length || 0,
    approved: paymentRequests?.filter((r: any) => r.status === 'approved').length || 0,
    paid: paymentRequests?.filter((r: any) => r.status === 'paid').length || 0,
    totalAmount: paymentRequests?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ödeme Yönetimi</h1>
        <p className="text-gray-600 mt-2">Kurye ödeme taleplerini yönetin ve işleyin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Talep</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Beklemede</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Onaylandı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ödendi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Tutar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{(stats.totalAmount / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Tümü
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('pending')}
            >
              Beklemede
            </Button>
            <Button
              variant={filterStatus === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('approved')}
            >
              Onaylandı
            </Button>
            <Button
              variant={filterStatus === 'paid' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('paid')}
            >
              Ödendi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Talepleri</CardTitle>
          <CardDescription>Kuriyelerden gelen ödeme taleplerini yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Talep bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kurye ID</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Talep Tarihi</TableHead>
                    <TableHead>İşlem Tarihi</TableHead>
                    <TableHead>İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">#{request.courierId}</TableCell>
                      <TableCell className="font-bold">₺{(request.amount / 100).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(request.requestedAt).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {request.processedAt ? new Date(request.processedAt).toLocaleDateString('tr-TR') : '-'}
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <Dialog open={selectedRequest?.id === request.id} onOpenChange={(open) => {
                            if (!open) setSelectedRequest(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedRequest(request)}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              >
                                İşle
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ödeme Talebini İşle</DialogTitle>
                                <DialogDescription>
                                  Kurye #{request.courierId} - ₺{(request.amount / 100).toFixed(2)}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">Not (İsteğe Bağlı)</Label>
                                  <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ödeme hakkında not ekleyin..."
                                    className="mt-2"
                                  />
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-green-900 mb-2">Onaylama</h4>
                                  <Button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                  >
                                    {approveMutation.isPending ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        İşleniyor...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Onayla
                                      </>
                                    )}
                                  </Button>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-red-900 mb-2">Reddetme</h4>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Red nedenini girin..."
                                    className="mt-2 mb-3"
                                  />
                                  <Button
                                    onClick={handleReject}
                                    disabled={rejectMutation.isPending || !rejectionReason.trim()}
                                    variant="destructive"
                                    className="w-full"
                                  >
                                    {rejectMutation.isPending ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        İşleniyor...
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reddet
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-sm text-gray-500">İşlendi</span>
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
    </div>
  );
}
