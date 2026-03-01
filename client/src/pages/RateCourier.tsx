import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Star, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function RateCourier() {
  const [location] = useLocation();
  const orderId = parseInt(location.split("/").pop() || "0");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();

  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery();
  const order = orders?.find(o => o.id === orderId);

  const rateCourierMutation = trpc.auth.mobile.rateCourier.useMutation({
    onSuccess: () => {
      toast.success("Kuriye başarıyla puan verildi!");
      navigate("/my-orders");
    },
    onError: (error: any) => {
      toast.error(error.message || "Puan verme başarısız");
    },
  });

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Lütfen bir puan seçin");
      return;
    }

    setIsSubmitting(true);
    await rateCourierMutation.mutateAsync({
      orderId,
      rating,
      comment: comment || undefined,
    });
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader>
            <CardTitle>Sipariş Bulunamadı</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/my-orders")} className="w-full">
              Siparişlerime Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Kuriye Puan Ver</h1>
            <p className="text-xl opacity-90">
              Teslimat hizmetinizi değerlendirin ve diğer kullanıcılara yardımcı olun
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Order Info Card */}
          <Card className="mb-8 shadow-lg border-none">
            <CardHeader>
              <CardTitle>Sipariş Detayları</CardTitle>
              <CardDescription>Sipariş #{order.orderNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Alış Adresi</p>
                  <p className="font-semibold text-gray-900">{order.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Teslimat Adresi</p>
                  <p className="font-semibold text-gray-900">{order.deliveryAddress}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Teslimat Ücreti</p>
                <p className="text-2xl font-bold text-orange-600">
                  €{(order.totalFee / 100).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rating Card */}
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-2xl">Kuriyeyi Değerlendirin</CardTitle>
              <CardDescription>
                Teslimat hizmetinden ne kadar memnun kaldınız?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Star Rating */}
              <div className="flex justify-center gap-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={48}
                      className={`${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>

              {/* Rating Text */}
              <div className="text-center">
                {rating > 0 && (
                  <p className="text-lg font-semibold text-gray-900">
                    {rating === 1 && "Çok Kötü 😞"}
                    {rating === 2 && "Kötü 😕"}
                    {rating === 3 && "Orta 😐"}
                    {rating === 4 && "İyi 😊"}
                    {rating === 5 && "Harika! 🎉"}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Yorum (İsteğe Bağlı)
                </label>
                <Textarea
                  placeholder="Teslimat deneyiminiz hakkında bir yorum yazın..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-24"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/my-orders")}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  İptal
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting ? "Gönderiliyor..." : "Puanı Gönder"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
