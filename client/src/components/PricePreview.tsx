import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, TrendingUp, Clock, Bike, Car, Package } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { geocodeAddress } from "@/lib/geocoding";
import { useTranslation } from "@/lib/i18n";

interface PricePreviewProps {
  pickupAddress: string;
  deliveryAddress: string;
  vehicleType: "bicycle" | "motorcycle" | "car" | "any";
  orderType: "restaurant" | "market" | "individual" | "express";
  isUrgent?: boolean;
}

export default function PricePreview({
  pickupAddress,
  deliveryAddress,
  vehicleType,
  orderType,
  isUrgent = false,
}: PricePreviewProps) {
  const { t } = useTranslation();
  const [shouldCalculate, setShouldCalculate] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  // Geocode addresses when they change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (pickupAddress && deliveryAddress) {
        setGeocoding(true);
        try {
          const [pickup, delivery] = await Promise.all([
            geocodeAddress(pickupAddress),
            geocodeAddress(deliveryAddress),
          ]);

          if (pickup && delivery) {
            setPickupCoords({ lat: pickup.lat, lng: pickup.lng });
            setDeliveryCoords({ lat: delivery.lat, lng: delivery.lng });
            setShouldCalculate(true);
          } else {
            setShouldCalculate(false);
          }
        } catch (error) {
          console.error('Geocoding failed:', error);
          setShouldCalculate(false);
        } finally {
          setGeocoding(false);
        }
      } else {
        setShouldCalculate(false);
        setPickupCoords(null);
        setDeliveryCoords(null);
      }
    }, 1500); // Wait 1.5 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [pickupAddress, deliveryAddress]);

  const { data: priceData, isLoading, error } = trpc.pricing.calculate.useQuery(
    {
      pickupLatitude: pickupCoords?.lat ?? 0,
      pickupLongitude: pickupCoords?.lng ?? 0,
      deliveryLatitude: deliveryCoords?.lat ?? 0,
      deliveryLongitude: deliveryCoords?.lng ?? 0,
      orderType,
    },
    {
      enabled: shouldCalculate && !!pickupCoords && !!deliveryCoords,
      refetchOnWindowFocus: false,
    }
  );

  if (!pickupAddress || !deliveryAddress) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-400" />
            {t('priceEstimateTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {t('priceEstimateDesc')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (geocoding || isLoading) {
    return (
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            {t('calculating')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {geocoding ? t('addressVerifying') : t('priceCalculating')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {t('calculationError')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            {t('priceCalculationFailed')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!priceData) {
    return null;
  }

  const totalFee = (priceData.totalFee / 100).toFixed(2);
  const baseFee = (priceData.baseFee / 100).toFixed(2);
  const distanceFee = (priceData.distanceFee / 100).toFixed(2);
  const distance = (priceData.distance / 1000).toFixed(1);
  const estimatedDuration = priceData.estimatedDuration;

  const vehicleIcons = {
    bicycle: <Bike className="h-4 w-4" />,
    motorcycle: <Bike className="h-4 w-4" />,
    car: <Car className="h-4 w-4" />,
    any: <Package className="h-4 w-4" />,
  };

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          {t('priceEstimateTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Price */}
        <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
          <div className="text-sm text-gray-600 mb-1">{t('totalFee')}</div>
          <div className="text-4xl font-bold text-orange-600">€{totalFee}</div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700 mb-2">{t('priceDetails')}:</div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">{t('baseFee')}</span>
            <span className="font-semibold">€{baseFee}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">{t('distanceFee')} ({distance} km)</span>
            <span className="font-semibold">€{distanceFee}</span>
          </div>

          {vehicleType !== "any" && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                {vehicleIcons[vehicleType]}
                {t('vehicleType')}
              </span>
              <span className="font-semibold capitalize">{t(vehicleType)}</span>
            </div>
          )}

          {isUrgent && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200 text-orange-600">
              <span className="text-sm font-medium">⚡ {t('urgentDelivery')}</span>
              <span className="font-semibold">+50%</span>
            </div>
          )}
        </div>

        {/* Estimated Time */}
        <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <div className="flex-1">
            <div className="text-xs text-blue-700 font-medium">{t('estimatedTime')}</div>
            <div className="text-sm font-semibold text-blue-900">{estimatedDuration} {t('minutes')}</div>
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          💡 {t('priceEstimateNote')}
        </div>
      </CardContent>
    </Card>
  );
}
