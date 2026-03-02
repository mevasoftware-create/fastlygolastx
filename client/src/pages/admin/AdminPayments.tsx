import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, DollarSign, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatEUR } from "@/lib/formatEUR";

export default function AdminPayments() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { data: paymentRequests = [], isLoading } = trpc.admin.getAllPaymentRequests.useQuery();
  const utils = trpc.useUtils();

  const approvePaymentMutation = trpc.admin.approvePaymentRequest.useMutation({
    onSuccess: () => {
      toast.success("Ödeme talebi onaylandı");
      utils.admin.getAllPaymentRequests.invalidate();
      setActionDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const rejectPaymentMutation = trpc.admin.rejectPaymentRequest.useMutation({
    onSuccess: () => {
      toast.success("Ödeme talebi reddedildi");
      utils.admin.getAllPaymentRequests.invalidate();
      setActionDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleAction = (request: any, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === "approve") {
      approvePaymentMutation.mutate({ requestId: selectedRequest.id, notes: "Approved by admin" });
    } else {
      rejectPaymentMutation.mutate({ requestId: selectedRequest.id, reason: "Rejected by admin" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
      pending: { variant: "secondary", label: "Beklemede", icon: Clock },
      approved: { variant: "default", label: "Onaylandı", icon: CheckCircle },
      rejected: { variant: "destructive", label: "Reddedildi", icon: XCircle },
      paid: { variant: "outline", label: "Ödendi", icon: DollarSign },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const pendingRequests = (Array.isArray(paymentRequests) ? paymentRequests : []).filter((r: any) => r.status === "pending");
  const processedRequests = (Array.isArray(paymentRequests) ? paymentRequests : []).filter((r: any) => r.status !== "pending");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ödeme Talepleri</h1>
        <p className="text-gray-600 mt-1">Kurye para çekme taleplerini yönetin</p>
      </div>

      {/* Pending Requests */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Bekleyen Talepler ({pendingRequests.length})
        </h2>
        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Bekleyen ödeme talebi bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((request: any) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-orange-600" />
                        {request.courierName || `Kurye #${request.courierId}`}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Talep Tarihi: {new Date(request.requestedAt).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Talep Edilen Tutar</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatEUR(request.amount)}
                      </p>
                      {request.iban && (
                        <p className="text-sm text-gray-600 mt-2">
                          IBAN: {request.iban}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAction(request, "approve")}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Onayla
                      </Button>
                      <Button
                        onClick={() => handleAction(request, "reject")}
                        variant="destructive"
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reddet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            İşlenmiş Talepler ({processedRequests.length})
          </h2>
          <div className="grid gap-4">
            {processedRequests.map((request: any) => (
              <Card key={request.id} className="opacity-75">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4 text-gray-600" />
                        {request.courierName || `Kurye #${request.courierId}`}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {new Date(request.requestedAt).toLocaleDateString("tr-TR")}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tutar</p>
                      <p className="text-lg font-bold text-gray-900">
{formatEUR(request.amount)}
                        </p>
                    </div>
                    {request.processedAt && (
                      <p className="text-sm text-gray-500">
                        İşlenme: {new Date(request.processedAt).toLocaleDateString("tr-TR")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Ödeme Talebini Onayla" : "Ödeme Talebini Reddet"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Bu ödeme talebini onaylamak istediğinizden emin misiniz?"
                : "Bu ödeme talebini reddetmek istediğinizden emin misiniz?"}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-2 py-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Kurye:</span>
                <span className="font-semibold">{selectedRequest.courierName || `#${selectedRequest.courierId}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tutar:</span>
                <span className="font-semibold text-orange-600">
                  {formatEUR(selectedRequest.amount)}
                </span>
              </div>
              {selectedRequest.iban && (
                <div className="flex justify-between">
                  <span className="text-gray-600">IBAN:</span>
                  <span className="font-mono text-sm">{selectedRequest.iban}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={confirmAction}
              disabled={approvePaymentMutation.isPending || rejectPaymentMutation.isPending}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {approvePaymentMutation.isPending || rejectPaymentMutation.isPending
                ? "İşleniyor..."
                : actionType === "approve"
                ? "Onayla"
                : "Reddet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
