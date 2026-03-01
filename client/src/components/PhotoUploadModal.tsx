import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
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

interface PhotoUploadModalProps {
  orderId: number;
  orderNumber: string;
  photoType: 'pickup' | 'delivery';
  currentStatus: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PhotoUploadModal({
  orderId,
  orderNumber,
  photoType,
  currentStatus,
  isOpen,
  onClose,
  onSuccess,
}: PhotoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const updateStatusMutation = trpc.courier.updateStatus.useMutation({
    onSuccess: () => {
      const message = photoType === 'pickup' 
        ? 'Paket alındı ve fotoğraf yüklendi!' 
        : 'Teslimat tamamlandı ve fotoğraf yüklendi!';
      toast.success(message);
      utils.courier.myOrders.invalidate();
      utils.orders.myOrders.invalidate();
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Fotoğraf yüklenemedi');
    },
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize to max 800px (readable quality)
          const maxWidth = 800;
          const maxHeight = 800;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.6 quality (good readability)
          const quality = 0.6;
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          console.log(`[PhotoUpload] Compressed: ${(compressedBase64.length / 1024).toFixed(2)}KB, quality: ${quality}, size: ${width}x${height}`);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fotoğraf boyutu 10MB\'dan küçük olmalıdır');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    setSelectedFile(file);

    try {
      // Compress and convert to base64
      const compressedBase64 = await compressImage(file);
      setPreviewUrl(compressedBase64);
    } catch (error) {
      toast.error('Fotoğraf işlenemedi');
      console.error('Image compression error:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewUrl) {
      toast.error('Lütfen bir fotoğraf seçin');
      return;
    }

    const nextStatus = photoType === 'pickup' ? 'picked_up' : 'delivered';
    const photoField = photoType === 'pickup' ? 'pickupPhotoBase64' : 'deliveryPhotoBase64';

    updateStatusMutation.mutate({
      orderId,
      status: nextStatus as "picked_up" | "in_transit" | "delivered",
      [photoField]: previewUrl,
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

  const title = photoType === 'pickup' ? 'Alış Fotoğrafı Yükle' : 'Teslimat Fotoğrafı Yükle';
  const description = photoType === 'pickup'
    ? `${orderNumber} numaralı sipariş için paketi aldığınıza dair fotoğraf yükleyin (paket + teslim eden kişi)`
    : `${orderNumber} numaralı sipariş için teslimat kanıtı fotoğrafı yükleyin (paket + teslim alan kişi)`;

  // Prevent closing without uploading photo - user must either upload or cancel explicitly
  const handleDialogChange = (open: boolean) => {
    // Only allow closing through explicit cancel button, not by clicking outside or pressing escape
    if (!open && !updateStatusMutation.isPending) {
      // Allow closing only if user clicks cancel button
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
                alt={`${photoType === 'pickup' ? 'Alış' : 'Teslimat'} fotoğrafı önizleme`}
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
                  Orijinal: {selectedFile && (selectedFile.size / 1024).toFixed(2)} KB
                  {previewUrl && ` | Sıkıştırılmış: ${(previewUrl.length * 0.75 / 1024).toFixed(2)} KB`}
                </p>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Fotoğraf çekmek için tıklayın
              </p>
              <p className="text-xs text-gray-500">
                veya galeriden seçin (max 10MB, otomatik sıkıştırılır)
              </p>
            </div>
          )}

          {/* Required Photo Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800 font-bold flex items-center gap-2">
              ⚠️ ZORUNLU: Fotoğraf yüklemeden {photoType === 'pickup' ? 'paketi alamazsınız' : 'teslimatı tamamlayamazsınız'}!
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800 font-medium mb-2">
              📸 Fotoğraf Çekim Talimatları:
            </p>
            <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
              {photoType === 'pickup' ? (
                <>
                  <li>Paketi ve teslim eden kişiyi net bir şekilde çekin</li>
                  <li>Paketin sağlam olduğunu gösterin</li>
                  <li>Bu fotoğraf, paketi aldığınızın kanıtıdır</li>
                </>
              ) : (
                <>
                  <li>Paketi ve teslim alan kişiyi net bir şekilde çekin</li>
                  <li>Paketin sağlam teslim edildiğini gösterin</li>
                  <li>Bu fotoğraf, teslimatin kanıtıdır</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={updateStatusMutation.isPending}
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || updateStatusMutation.isPending}
            className="bg-gradient-to-r from-orange-500 to-orange-600"
          >
            {updateStatusMutation.isPending ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Yükle ve {photoType === 'pickup' ? 'Paketi Al' : 'Teslim Et'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
