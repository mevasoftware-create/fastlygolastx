import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface RatingModalProps {
  orderId: number;
  orderNumber: string;
  courierName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RatingModal({
  orderId,
  orderNumber,
  courierName,
  isOpen,
  onClose,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const utils = trpc.useUtils();

  const createRatingMutation = trpc.orders.createRating.useMutation({
    onSuccess: () => {
      toast.success('Değerlendirmeniz kaydedildi!');
      utils.orders.myOrders.invalidate();
      utils.orders.canRate.invalidate({ orderId });
      onSuccess?.();
      onClose();
      // Reset form
      setRating(0);
      setComment('');
    },
    onError: (error) => {
      toast.error(error.message || 'Değerlendirme kaydedilemedi');
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Lütfen bir puan seçin');
      return;
    }

    createRatingMutation.mutate({
      orderId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Teslimatı Değerlendir</DialogTitle>
          <DialogDescription>
            {orderNumber} numaralı siparişiniz için{' '}
            {courierName ? `${courierName} kuryemizi` : 'kuryemizi'} değerlendirin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-orange-500 text-orange-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && 'Çok Kötü'}
                {rating === 2 && 'Kötü'}
                {rating === 3 && 'Orta'}
                {rating === 4 && 'İyi'}
                {rating === 5 && 'Mükemmel'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Yorumunuz (Opsiyonel)
            </label>
            <Textarea
              id="comment"
              placeholder="Teslimat hakkında düşüncelerinizi paylaşın..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createRatingMutation.isPending}
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0 || createRatingMutation.isPending}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            {createRatingMutation.isPending ? 'Kaydediliyor...' : 'Değerlendir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
