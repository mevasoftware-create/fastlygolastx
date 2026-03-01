import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RateCourierModalProps {
  orderId: number;
  courierName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function RateCourierModal({
  orderId,
  courierName,
  open,
  onOpenChange,
  onSuccess,
}: RateCourierModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const utils = trpc.useUtils();

  const createRatingMutation = trpc.orders.createRating.useMutation({
    onSuccess: () => {
      toast.success("Değerlendirmeniz kaydedildi, teşekkür ederiz!");
      utils.orders.canRate.invalidate({ orderId });
      utils.orders.getRating.invalidate({ orderId });
      utils.orders.getMyOrders.invalidate();
      onOpenChange(false);
      setRating(0);
      setComment("");
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Lütfen bir puan seçin");
      return;
    }

    createRatingMutation.mutate({
      orderId,
      rating,
      comment: comment || undefined,
    });
  };

  const handleClose = () => {
    if (!createRatingMutation.isPending) {
      onOpenChange(false);
      setRating(0);
      setComment("");
    }
  };

  const ratingLabels = [
    "Çok Kötü",
    "Kötü",
    "Orta",
    "İyi",
    "Mükemmel",
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Kuryeyi Değerlendir</DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-orange-600">{courierName}</span> ile olan deneyiminizi paylaşın
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-3">
            <div className="text-center">
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    disabled={createRatingMutation.isPending}
                  >
                    <Star
                      className={`h-12 w-12 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-orange-500 text-orange-500"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Rating Label */}
              {(hoverRating || rating) > 0 && (
                <div className="text-lg font-semibold text-orange-600 animate-in fade-in">
                  {ratingLabels[(hoverRating || rating) - 1]}
                </div>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Yorumunuz (İsteğe Bağlı)
            </label>
            <Textarea
              placeholder="Deneyiminizi bizimle paylaşın..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={createRatingMutation.isPending}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {comment.length}/500
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            💡 Değerlendirmeniz kuryelerimizin kalitesini artırmamıza yardımcı olur
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createRatingMutation.isPending}
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0 || createRatingMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {createRatingMutation.isPending ? "Gönderiliyor..." : "Değerlendirmeyi Gönder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
