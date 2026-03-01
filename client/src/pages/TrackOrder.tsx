import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapView } from "@/components/Map";
import { ORDER_STATUS } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  Loader2, MapPin, Package, Navigation, CheckCircle2, Activity, QrCode, 
  Share2, ImageIcon, Phone, Clock, Bike, Car, ArrowRight, RefreshCw,
  AlertCircle
} from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

// Status timeline steps
const STATUS_STEPS = [
  { key: "pending", label: "Sipariş Oluşturuldu", icon: Package },
  { key: "accepted", label: "Kurye Atandı", icon: Bike },
  { key: "picked_up", label: "Paket Alındı", icon: CheckCircle2 },
  { key: "in_transit", label: "Yolda", icon: Navigation },
  { key: "delivered", label: "Teslim Edildi", icon: CheckCircle2 },
];

export default function TrackOrder() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Track Order - FastlyGo",
    "description": "Track your FastlyGo delivery in real-time"
  };
  
  const [, setLocation] = useLocation();
  const params = useParams();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [showQR, setShowQR] = useState(false);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{
    courier?: any;
    pickup?: any;
    delivery?: any;
  }>({});
  const polylineRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [courierLocation, setCourierLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // URL'den sipariş numarasını al
  const orderParam = params.orderNumber;
  const [isNumericId, setIsNumericId] = useState(false);
  
  useEffect(() => {
    if (orderParam) {
      if (/^\d+$/.test(orderParam)) {
        setIsNumericId(true);
        setOrderId(parseInt(orderParam));
      } else {
        setIsNumericId(false);
      }
    }
  }, [orderParam]);

  // Sipariş numarası ile sorgulama (public endpoint)
  const { data: orderByNumber, isLoading: loadingByNumber, refetch: refetchByNumber } = trpc.orders.getByOrderNumber.useQuery(
    { orderNumber: orderParam! },
    { enabled: !!orderParam && !isNumericId, refetchInterval: 10000 }
  );
  
  // ID ile sorgulama (protected endpoint)
  const { data: orderById, isLoading: loadingById, refetch: refetchById } = trpc.orders.getById.useQuery(
    { id: orderId! },
    { enabled: !!orderId && isNumericId, refetchInterval: 10000 }
  );
  
  const order = isNumericId ? orderById : orderByNumber;
  const isLoading = isNumericId ? loadingById : loadingByNumber;
  const refetch = isNumericId ? refetchById : refetchByNumber;
  
  useEffect(() => {
    if (order && !orderId) {
      setOrderId(order.id);
    }
  }, [order, orderId]);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    if (!orderId) return;

    const newSocket = io({
      path: "/socket.io",
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("[TrackOrder] Connected to Socket.IO");
      setIsLiveTracking(true);
      newSocket.emit("order:join", { orderId });
    });

    newSocket.on("disconnect", () => {
      console.log("[TrackOrder] Disconnected from Socket.IO");
      setIsLiveTracking(false);
    });

    newSocket.on("order:statusUpdated", (data: any) => {
      console.log("[TrackOrder] Order status updated:", data);
      if (data.orderId === orderId) {
        refetch();
        toast.info(`Sipariş durumu güncellendi: ${ORDER_STATUS[data.status as keyof typeof ORDER_STATUS] || data.status}`);
      }
    });

    newSocket.on("courier:locationUpdated", (data: any) => {
      console.log("[TrackOrder] Courier location updated:", data);
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      setCourierLocation({ lat, lng });
      updateCourierMarker(lat, lng);
    });

    newSocket.on("order:courierAssigned", (data: any) => {
      console.log("[TrackOrder] Courier assigned:", data);
      if (data.orderId === orderId) {
        refetch();
        toast.success("Kurye atandı!");
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit("order:leave", { orderId });
      newSocket.close();
    };
  }, [orderId]);

  // Polling for courier location as fallback
  useEffect(() => {
    if (!order || !order.courierId || order.status === "delivered" || order.status === "cancelled") {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      return;
    }

    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      refetch();
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [order?.courierId, order?.status]);

  const updateCourierMarker = useCallback((lat: number, lng: number) => {
    if (!mapRef.current || !markersRef.current.courier) return;
    
    // Smooth animation for marker movement
    const marker = markersRef.current.courier;
    const currentPos = marker.getPosition();
    
    if (currentPos) {
      // Animate marker movement
      const startLat = currentPos.lat();
      const startLng = currentPos.lng();
      const duration = 1000; // 1 second
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const newLat = startLat + (lat - startLat) * easeProgress;
        const newLng = startLng + (lng - startLng) * easeProgress;
        
        marker.setPosition({ lat: newLat, lng: newLng });
        
        // Calculate rotation angle
        if (progress < 1) {
          const angle = Math.atan2(lng - startLng, lat - startLat) * (180 / Math.PI);
          const icon = marker.getIcon();
          if (icon) {
            marker.setIcon({ ...icon, rotation: angle });
          }
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      marker.setPosition({ lat, lng });
    }
  }, []);

  // Calculate route using Directions API
  const calculateRoute = useCallback((origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    if (!mapRef.current || !window.google?.maps) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#f97316",
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      });
    }

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result: any, status: string) => {
        if (status === "OK" && result) {
          directionsRendererRef.current.setDirections(result);
          
          const route = result.routes[0];
          if (route && route.legs[0]) {
            setRouteDistance(route.legs[0].distance?.text || null);
            setRouteDuration(route.legs[0].duration?.text || null);
            
            // Calculate estimated arrival
            const durationSeconds = route.legs[0].duration?.value || 0;
            const arrivalTime = new Date(Date.now() + durationSeconds * 1000);
            setEstimatedArrival(arrivalTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
          }
        }
      }
    );
  }, []);

  // Map ready handler
  const handleMapReady = useCallback((map: any) => {
    console.log("Map ready!");
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // Update markers and route when order or courier location changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || !order) return;

    const map = mapRef.current;

    if (!order.pickupLatitude || !order.pickupLongitude || 
        !order.deliveryLatitude || !order.deliveryLongitude) {
      return;
    }

    const pickupLat = parseFloat(order.pickupLatitude);
    const pickupLng = parseFloat(order.pickupLongitude);
    const deliveryLat = parseFloat(order.deliveryLatitude);
    const deliveryLng = parseFloat(order.deliveryLongitude);
    
    // Eğer order verisinde kurye konumu varsa ve henüz courierLocation state'i boşsa, onu kullan
    if (order.courierLatitude && order.courierLongitude && !courierLocation) {
      const orderCourierLat = parseFloat(order.courierLatitude);
      const orderCourierLng = parseFloat(order.courierLongitude);
      setCourierLocation({ lat: orderCourierLat, lng: orderCourierLng });
    }

    // Create pickup marker
    if (!markersRef.current.pickup && window.google?.maps) {
      markersRef.current.pickup = new window.google.maps.Marker({
        map,
        position: { lat: pickupLat, lng: pickupLng },
        title: "Alış Noktası",
        icon: {
          url: "data:image/svg+xml," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
              <path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 30 20 30s20-16 20-30C40 8.954 31.046 0 20 0z" fill="#10b981"/>
              <circle cx="20" cy="18" r="10" fill="white"/>
              <text x="20" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#10b981">A</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 50),
          anchor: new window.google.maps.Point(20, 50),
        },
        zIndex: 100,
      });
    }

    // Create delivery marker
    if (!markersRef.current.delivery && window.google?.maps) {
      markersRef.current.delivery = new window.google.maps.Marker({
        map,
        position: { lat: deliveryLat, lng: deliveryLng },
        title: "Teslimat Noktası",
        icon: {
          url: "data:image/svg+xml," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
              <path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 30 20 30s20-16 20-30C40 8.954 31.046 0 20 0z" fill="#ef4444"/>
              <circle cx="20" cy="18" r="10" fill="white"/>
              <text x="20" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#ef4444">B</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 50),
          anchor: new window.google.maps.Point(20, 50),
        },
        zIndex: 100,
      });
    }

    // Create or update courier marker
    // Önce courierLocation state'ini kullan, yoksa order verisinden al, o da yoksa pickup konumunu kullan
    let courierLat = pickupLat;
    let courierLng = pickupLng;
    
    if (courierLocation) {
      courierLat = courierLocation.lat;
      courierLng = courierLocation.lng;
    } else if (order.courierLatitude && order.courierLongitude) {
      courierLat = parseFloat(order.courierLatitude);
      courierLng = parseFloat(order.courierLongitude);
    }
    const showCourier = order.status !== "pending" && order.status !== "cancelled" && order.status !== "delivered";

    if (!markersRef.current.courier && window.google?.maps && showCourier) {
      markersRef.current.courier = new window.google.maps.Marker({
        map,
        position: { lat: courierLat, lng: courierLng },
        title: "Kurye",
        icon: {
          url: "data:image/svg+xml," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="22" fill="#f97316" stroke="white" stroke-width="3"/>
              <path d="M25 12 L35 30 L25 26 L15 30 Z" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(50, 50),
          anchor: new window.google.maps.Point(25, 25),
        },
        zIndex: 200,
      });
    } else if (markersRef.current.courier) {
      if (showCourier) {
        markersRef.current.courier.setVisible(true);
        if (courierLocation) {
          updateCourierMarker(courierLocation.lat, courierLocation.lng);
        }
      } else {
        markersRef.current.courier.setVisible(false);
      }
    }

    // Fit bounds to show all markers
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: pickupLat, lng: pickupLng });
    bounds.extend({ lat: deliveryLat, lng: deliveryLng });
    if (courierLocation && showCourier) {
      bounds.extend({ lat: courierLocation.lat, lng: courierLocation.lng });
    }
    map.fitBounds(bounds, { padding: 50 });

    // Calculate route
    if (showCourier && courierLocation) {
      // Route from courier to delivery
      calculateRoute(
        { lat: courierLocation.lat, lng: courierLocation.lng },
        { lat: deliveryLat, lng: deliveryLng }
      );
    } else if (order.status === "pending" || order.status === "accepted") {
      // Route from pickup to delivery
      calculateRoute(
        { lat: pickupLat, lng: pickupLng },
        { lat: deliveryLat, lng: deliveryLng }
      );
    }
  }, [mapReady, order, courierLocation, calculateRoute, updateCourierMarker]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-orange-200 rounded-full animate-pulse"></div>
            <Loader2 className="w-12 h-12 animate-spin text-orange-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 mt-4 font-medium">Sipariş bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md shadow-xl">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <CardTitle>Sipariş Bulunamadı</CardTitle>
            <CardDescription>Bu sipariş görüntülenemiyor veya mevcut değil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full bg-orange-500 hover:bg-orange-600">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIndex = (status: string) => {
    const index = STATUS_STEPS.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  const currentStatusIndex = getStatusIndex(order.status);

  const shareOrder = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sipariş Takibi - ${order.orderNumber}`,
          text: `Siparişimi takip et: ${order.orderNumber}`,
          url,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link kopyalandı!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        titleKey="seoTitleTrackOrder"
        descriptionKey="seoDescriptionTrackOrder"
        keywordsKey="seoKeywordsTrackOrder"
        structuredData={structuredData}
      />
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Sipariş Takibi</h1>
              <p className="text-orange-100 text-sm">{order.orderNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              {isLiveTracking && (
                <Badge className="bg-green-500 text-white animate-pulse">
                  <Activity className="w-3 h-3 mr-1" />
                  Canlı
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={shareOrder}
                className="text-white hover:bg-white/20"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQR(!showQR)}
                className="text-white hover:bg-white/20"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* QR Code Modal */}
        {showQR && (
          <Card className="mb-6 p-6 text-center">
            <QRCodeSVG value={window.location.href} size={200} className="mx-auto" />
            <p className="text-sm text-gray-600 mt-4">Bu QR kodu tarayarak siparişi takip edebilirsiniz</p>
            <Button variant="outline" onClick={() => setShowQR(false)} className="mt-4">
              Kapat
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden shadow-xl">
              <div className="relative">
                <MapView
                  center={{ lat: 41.9973, lng: 21.4280 }}
                  zoom={13}
                  className="w-full h-[400px] lg:h-[500px]"
                  onMapReady={handleMapReady}
                />
                
                {/* Route Info Overlay */}
                {(routeDistance || routeDuration) && order.status !== "delivered" && (
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3">
                    <div className="flex items-center gap-4 text-sm">
                      {routeDistance && (
                        <div className="flex items-center gap-1">
                          <Navigation className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">{routeDistance}</span>
                        </div>
                      )}
                      {routeDuration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{routeDuration}</span>
                        </div>
                      )}
                    </div>
                    {estimatedArrival && (
                      <p className="text-xs text-gray-500 mt-1">
                        Tahmini varış: <span className="font-medium text-green-600">{estimatedArrival}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3">
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span>Alış Noktası</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span>Teslimat Noktası</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                      <span>Kurye</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Details Section */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Sipariş Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0">
                        <div className="relative">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${isCompleted ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-400"}
                            ${isCurrent ? "ring-4 ring-orange-200" : ""}
                            transition-all duration-300
                          `}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {index < STATUS_STEPS.length - 1 && (
                            <div className={`
                              absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8
                              ${index < currentStatusIndex ? "bg-orange-500" : "bg-gray-200"}
                            `} />
                          )}
                        </div>
                        <div className="flex-1 pt-2">
                          <p className={`font-medium ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                            {step.label}
                          </p>
                          {isCurrent && order.status !== "cancelled" && (
                            <p className="text-xs text-orange-600 mt-0.5">Şu anki durum</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Sipariş Detayları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Toplam Ücret</p>
                    <p className="font-bold text-lg text-orange-600">€{(order.totalFee / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mesafe</p>
                    <p className="font-bold text-lg">{order.distance ? (order.distance / 1000).toFixed(1) : '0'} km</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Alış Noktası</p>
                      <p className="text-sm font-medium">{order.pickupAddress}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Teslimat Noktası</p>
                      <p className="text-sm font-medium">{order.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Photos */}
                {(order.pickupPhotoUrl || order.deliveryPhotoUrl) && (
                  <div className="pt-4 border-t space-y-3">
                    {order.pickupPhotoUrl && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Alış Fotoğrafı
                        </p>
                        <img 
                          src={order.pickupPhotoUrl} 
                          alt="Alış fotoğrafı" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    {order.deliveryPhotoUrl && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Teslimat Fotoğrafı
                        </p>
                        <img 
                          src={order.deliveryPhotoUrl} 
                          alt="Teslimat fotoğrafı" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/my-orders")}
                className="flex-1"
              >
                Siparişlerime Dön
              </Button>
              <Button 
                onClick={() => refetch()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
