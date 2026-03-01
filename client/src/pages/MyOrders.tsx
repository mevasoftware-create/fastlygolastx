import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  Package, MapPin, Clock, CheckCircle2, Bike, AlertCircle, ArrowRight,
  Star, Image as ImageIcon, Loader2, Calendar, TrendingUp, Map as MapIcon
} from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import RateCourierModal from "@/components/RateCourierModal";
import { MapView } from "@/components/Map";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSeoFromDatabase } from "@/hooks/useSeoFromDatabase";
import SEOHead from "@/components/SEOHead";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MyOrders() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const { language } = useLanguage();

  // Fetch my orders page SEO data from database

  // Get SEO data from database

  // Use database SEO data if available
  
  
  
  const [, navigate] = useLocation();
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  
  // Map refs for history tab
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const polylinesRef = useRef<Map<number, any>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Filter orders
  const activeOrders = orders?.filter((o: any) => 
    !["delivered", "cancelled"].includes(o.status)
  ) || [];
  
  const completedOrders = orders?.filter((o: any) => 
    ["delivered", "cancelled"].includes(o.status)
  ) || [];

  // Map ready handler
  const handleMapReady = (map: any) => {
    console.log("Map ready!");
    mapRef.current = map;
    setMapReady(true);
  };

  // Add all completed orders to map
  useEffect(() => {
    if (!mapReady || !mapRef.current || !completedOrders || completedOrders.length === 0 || activeTab !== "completed") {
      return;
    }

    // Critical: Check if Google Maps is loaded
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      console.warn('Google Maps not loaded yet');
      return;
    }

    const map = mapRef.current;
    
    // Clear previous markers and polylines
    try {
      markersRef.current.forEach(marker => marker.setMap(null));
      polylinesRef.current.forEach(polyline => polyline.setMap(null));
      markersRef.current.clear();
      polylinesRef.current.clear();
    } catch (error) {
      console.error('Error clearing markers:', error);
    }

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidCoordinates = false;

    // Create markers and polylines for each order
    completedOrders.forEach((order: any, index: number) => {
      if (!order.pickupLatitude || !order.pickupLongitude || 
          !order.deliveryLatitude || !order.deliveryLongitude) {
        return;
      }

      const pickupLat = parseFloat(order.pickupLatitude);
      const pickupLng = parseFloat(order.pickupLongitude);
      const deliveryLat = parseFloat(order.deliveryLatitude);
      const deliveryLng = parseFloat(order.deliveryLongitude);

      hasValidCoordinates = true;

      // Color based on status
      let color = "#94a3b8"; // default gray
      if (order.status === "delivered") color = "#10b981"; // green
      else if (order.status === "cancelled") color = "#ef4444"; // red

      // Pickup marker
      const pickupMarker = new window.google.maps.Marker({
        map: map,
        position: { lat: pickupLat, lng: pickupLng },
        title: `${t('order')} ${order.orderNumber} - ${t('pickup')}`,
        label: {
          text: (index + 1).toString(),
          color: "white",
          fontWeight: "bold",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: "white",
          strokeWeight: 2,
        },
      });

      // Delivery marker
      const deliveryMarker = new window.google.maps.Marker({
        map: map,
        position: { lat: deliveryLat, lng: deliveryLng },
        title: `${t('order')} ${order.orderNumber} - ${t('delivery')}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 0.6,
          strokeColor: "white",
          strokeWeight: 2,
        },
      });

      // Route polyline
      const polyline = new window.google.maps.Polyline({
        path: [
          { lat: pickupLat, lng: pickupLng },
          { lat: deliveryLat, lng: deliveryLng }
        ],
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.6,
        strokeWeight: 3,
        map: map,
      });

      // Click handlers
      const clickHandler = () => {
        setSelectedOrder(order);
        map.panTo({ lat: pickupLat, lng: pickupLng });
        map.setZoom(14);
      };

      pickupMarker.addListener("click", clickHandler);
      deliveryMarker.addListener("click", clickHandler);
      polyline.addListener("click", clickHandler);

      // Store markers and polylines
      markersRef.current.set(order.id, pickupMarker);
      markersRef.current.set(order.id + 1000, deliveryMarker);
      polylinesRef.current.set(order.id, polyline);

      // Extend bounds
      bounds.extend({ lat: pickupLat, lng: pickupLng });
      bounds.extend({ lat: deliveryLat, lng: deliveryLng });
    });

    // Fit map to show all orders
    if (hasValidCoordinates) {
      map.fitBounds(bounds);
      
      // Reduce zoom a bit
      const listener = window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 13) {
          map.setZoom(13);
        }
      });
    }
  }, [mapReady, completedOrders, activeTab, t]);

  // Calculate stats
  const stats = completedOrders ? {
    total: completedOrders.length,
    delivered: completedOrders.filter((o: any) => o.status === "delivered").length,
    cancelled: completedOrders.filter((o: any) => o.status === "cancelled").length,
    totalDistance: completedOrders.reduce((sum: number, o: any) => sum + (o.distance || 0), 0),
    totalSpent: completedOrders.reduce((sum: number, o: any) => sum + (o.totalFee || 0), 0),
  } : null;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      pending: { 
        label: t('pending'), 
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="w-3 h-3" />
      },
      accepted: { 
        label: t('accepted'), 
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <CheckCircle2 className="w-3 h-3" />
      },
      picked_up: { 
        label: t('pickedUp'), 
        className: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Package className="w-3 h-3" />
      },
      in_transit: { 
        label: t('inTransit'), 
        className: "bg-indigo-100 text-indigo-800 border-indigo-200",
        icon: <Bike className="w-3 h-3" />
      },
      delivered: { 
        label: t('delivered'), 
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle2 className="w-3 h-3" />
      },
      cancelled: { 
        label: t('cancelled'), 
        className: "bg-red-100 text-red-800 border-red-200",
        icon: <AlertCircle className="w-3 h-3" />
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge className={`text-xs font-semibold border ${config.className} flex items-center gap-1.5 px-3 py-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const openPhotoModal = (photoUrl: string) => {
    setSelectedPhotoUrl(photoUrl);
    setPhotoModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <Card className="max-w-md w-full shadow-xl border-orange-100">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">{t('loginRequired')}</CardTitle>
            <CardDescription>{t('loginRequiredDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => window.location.href = getLoginUrl()} 
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              {t('login')}
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              {t('backToHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <SEOHead 
        
        
        
        titleKey="seoTitle"
        descriptionKey="seoDescription"
        keywordsKey="seoKeywords"
      />
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
            {t('myOrders')}
          </h1>
          <p className="text-gray-600">{t('trackAndManageOrders')}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/60 backdrop-blur-sm border border-orange-100">
            <TabsTrigger value="active" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
              {t('activeOrders')} ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
              {t('completedOrders')} ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Orders Tab */}
          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600">{t('loading')}</p>
              </div>
            ) : activeOrders.length === 0 ? (
              <Card className="border-orange-100 shadow-lg bg-white/60 backdrop-blur-sm">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noActiveOrders')}</h3>
                  <p className="text-gray-600 mb-6">{t('noActiveOrdersDesc')}</p>
                  <Button 
                    onClick={() => navigate("/new-order")}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {t('createNewOrder')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {activeOrders.map((order: any) => (
                  <Card key={order.id} className="border-orange-100 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm overflow-hidden cursor-pointer" onClick={() => navigate(`/track-order/${order.orderNumber}`)}>
                    {/* Modern Header with Gradient */}
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white font-bold">
                              #{order.orderNumber}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1 text-white/90">
                              <Clock className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleString(t('locale'))}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    </div>
                    <CardContent className="space-y-4">
                      {/* Addresses */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-green-700 font-medium mb-0.5">{t('pickupAddress')}</p>
                            <p className="text-sm text-gray-900">{order.pickupAddress}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                          <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-red-700 font-medium mb-0.5">{t('deliveryAddress')}</p>
                            <p className="text-sm text-gray-900">{order.deliveryAddress}</p>
                          </div>
                        </div>
                      </div>

                      {/* Order Details - Modern Cards */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-orange-100">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl text-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-xs text-blue-700 mb-1 font-medium">{t('distance')}</p>
                          <p className="text-sm font-bold text-blue-900">
                            {order.distance ? (order.distance / 1000).toFixed(1) : '0'} km
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-xl text-center">
                          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Bike className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-xs text-purple-700 mb-1 font-medium">{t('vehicle')}</p>
                          <p className="text-sm font-bold text-purple-900 capitalize">{order.vehicleType}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-xl text-center">
                          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <span className="text-white font-bold text-sm">€</span>
                          </div>
                          <p className="text-xs text-orange-700 mb-1 font-medium">{t('totalFee')}</p>
                          <p className="text-lg font-bold text-orange-600">
                            €{(order.totalFee / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Photos */}
                      {(order.pickupPhotoUrl || order.deliveryPhotoUrl) && (
                        <div className="pt-3 border-t border-orange-100">
                          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            {t('orderPhotos')}
                          </p>
                          <div className="flex gap-2">
                            {order.pickupPhotoUrl && (
                              <button
                                onClick={() => openPhotoModal(order.pickupPhotoUrl)}
                                className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-green-200 hover:border-green-400 transition-all group"
                              >
                                <img 
                                  src={order.pickupPhotoUrl} 
                                  alt={t('pickupPhoto')}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/placeholder.webp';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                            )}
                            {order.deliveryPhotoUrl && (
                              <button
                                onClick={() => openPhotoModal(order.deliveryPhotoUrl)}
                                className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-red-200 hover:border-red-400 transition-all group"
                              >
                                <img 
                                  src={order.deliveryPhotoUrl} 
                                  alt={t('deliveryPhoto')}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/placeholder.webp';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-orange-100" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          onClick={() => navigate(`/track-order/${order.orderNumber}`)}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                        >
                          {t('viewDetails')}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        {order.status === "delivered" && !order.courierRating && (
                          <Button
                            onClick={() => {
                              setSelectedOrder(order);
                              setRatingModalOpen(true);
                            }}
                            variant="outline"
                            className="border-orange-200 hover:bg-orange-50"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Orders Tab */}
          <TabsContent value="completed" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600">{t('loading')}</p>
              </div>
            ) : completedOrders.length === 0 ? (
              <Card className="border-orange-100 shadow-lg bg-white/60 backdrop-blur-sm">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noCompletedOrders')}</h3>
                  <p className="text-gray-600">{t('noCompletedOrdersDesc')}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Statistics */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="border-orange-100 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Package className="w-6 h-6 text-orange-600" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                          <p className="text-xs text-gray-600">{t('totalOrders')}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-100 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                          <p className="text-xs text-gray-600">{t('delivered')}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-100 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                          <p className="text-xs text-gray-600">{t('cancelled')}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-100 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <MapPin className="w-6 h-6 text-blue-600" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{(stats.totalDistance / 1000).toFixed(1)}</p>
                          <p className="text-xs text-gray-600">{t('totalDistanceKm')}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-100 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900">€{(stats.totalSpent / 100).toFixed(2)}</p>
                          <p className="text-xs text-gray-600">{t('totalSpent')}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Map and Order List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Order List */}
                  <div className="lg:col-span-1">
                    <Card className="h-[600px] overflow-hidden flex flex-col border-orange-100 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-orange-600" />
                          {t('orders')} ({completedOrders.length})
                        </CardTitle>
                        <CardDescription>{t('clickToViewOnMap')}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-y-auto">
                        <div className="space-y-3">
                          {completedOrders.map((order: any, index: number) => (
                            <div
                              key={order.id}
                              onClick={() => {
                                setSelectedOrder(order);
                                if (window.google && window.google.maps && mapRef.current && order.pickupLatitude && order.pickupLongitude) {
                                  const lat = parseFloat(order.pickupLatitude);
                                  const lng = parseFloat(order.pickupLongitude);
                                  mapRef.current.panTo({ lat, lng });
                                  mapRef.current.setZoom(14);
                                }
                              }}
                              onDoubleClick={() => navigate(`/track-order/${order.orderNumber}`)}
                              className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                                selectedOrder?.id === order.id 
                                  ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md' 
                                  : 'border-orange-100 hover:border-orange-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                                    {index + 1}
                                  </div>
                                  <p className="font-semibold text-sm text-gray-900">#{order.orderNumber}</p>
                                </div>
                                {getStatusBadge(order.status)}
                              </div>
                              <div className="space-y-1.5 text-xs text-gray-600">
                                <div className="flex items-start gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                  <p className="line-clamp-1">{order.pickupAddress}</p>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                                  <p className="line-clamp-1">{order.deliveryAddress}</p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-orange-100">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/track-order/${order.orderNumber}`);
                                  }}
                                  size="sm"
                                  className="w-full text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                                >
                                  {t('viewDetails')}
                                </Button>
                              </div>
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-100">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(order.createdAt).toLocaleDateString(t('locale'))}
                                </span>
                                <span className="text-sm font-bold text-orange-600">
                                  €{(order.totalFee / 100).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Map */}
                  <div className="lg:col-span-2">
                    <Card className="h-[600px] border-orange-100 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapIcon className="w-5 h-5 text-orange-600" />
                          {t('orderMap')}
                        </CardTitle>
                        <CardDescription>
                          {selectedOrder 
                            ? `${t('order')}: ${selectedOrder.orderNumber}` 
                            : t('allOrdersOnMap')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[calc(100%-5rem)]">
                        <MapView onMapReady={handleMapReady} />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Selected Order Details */}
                {selectedOrder && (
                  <Card className="border-orange-100 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-orange-600" />
                        {t('orderDetails')} - #{selectedOrder.orderNumber}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{t('status')}</p>
                          {getStatusBadge(selectedOrder.status)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{t('distance')}</p>
                          <p className="font-medium">{selectedOrder.distance ? (selectedOrder.distance / 1000).toFixed(1) : '0'} km</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{t('totalFee')}</p>
                          <p className="font-medium text-orange-600">€{(selectedOrder.totalFee / 100).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{t('vehicle')}</p>
                          <p className="font-medium capitalize">{selectedOrder.vehicleType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{t('orderDate')}</p>
                          <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString(t('locale'))}</p>
                        </div>
                        {selectedOrder.deliveredAt && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">{t('deliveryDate')}</p>
                            <p className="font-medium">{new Date(selectedOrder.deliveredAt).toLocaleString(t('locale'))}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button 
                          onClick={() => navigate(`/track-order?id=${selectedOrder.id}`)}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                        >
                          {t('detailedView')}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedOrder(null)}
                          className="border-orange-200 hover:bg-orange-50"
                        >
                          {t('close')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo Modal */}
      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('orderPhoto')}</DialogTitle>
          </DialogHeader>
          {selectedPhotoUrl && (
            <div className="relative w-full h-[600px]">
              <img
                src={selectedPhotoUrl}
                alt={t('orderPhoto')}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/images/placeholder.webp';
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rating Modal */}
      {selectedOrder && (
        <RateCourierModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          orderId={selectedOrder.id}
          courierName={selectedOrder.courierName || t('courier')}
        />
      )}

      <Footer />
    </div>
  );
}
