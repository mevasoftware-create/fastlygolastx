import { useState, useRef } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface DeliveryPhotoUploadProps {
  orderId: number;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeliveryPhotoUpload({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
}: DeliveryPhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const uploadPhotoMutation = trpc.courier.uploadDeliveryPhoto.useMutation({
    onSuccess: () => {
      toast.success('Teslimat fotoğrafı yüklendi!');
      utils.courier.myOrders.invalidate();
      utils.orders.myOrders.invalidate();
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Fotoğraf yüklenemedi');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fotoğraf boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewUrl) {
      toast.error('Lütfen bir fotoğraf seçin');
      return;
    }

    uploadPhotoMutation.mutate({
      orderId,
      photoData: previewUrl,
    });
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Teslimat Fotoğrafı Yükle</DialogTitle>
          <DialogDescription>
            {orderNumber} numaralı sipariş için teslimat kanıtı fotoğrafı yükleyin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Preview or Upload Area */}
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Teslimat fotoğrafı önizleme"
                className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemovePhoto}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium">{selectedFile?.name}</p>
                <p className="text-xs">
                  {selectedFile && (selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
            >
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">
                Fotoğraf çekin veya yükleyin
              </p>
              <p className="text-sm text-gray-500">
                Maksimum dosya boyutu: 5MB
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Check className="h-4 w-4" />
              İpuçları:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Teslimat adresinin açıkça görüldüğü bir fotoğraf çekin</li>
              <li>• Paketi teslim ettiğiniz yeri gösterin</li>
              <li>• Fotoğrafın net ve okunaklı olduğundan emin olun</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploadPhotoMutation.isPending}
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploadPhotoMutation.isPending}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            {uploadPhotoMutation.isPending ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Yükle
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
