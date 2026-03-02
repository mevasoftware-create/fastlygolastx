import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Bike, MapPin, Package, Truck, ArrowRight, CheckCircle, Clock, Box, Zap, Car, Smartphone, DollarSign, Calendar, Star, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";

import { AddressMapPicker } from "@/components/AddressMapPicker";
import SEOHead from "@/components/SEOHead";
import { BASE_URL } from "@/const";
import { useSeoFromDatabase } from "@/hooks/useSeoFromDatabase";
import { PageHeader } from "@/components/PageHeader";

export default function Order() {
  const { t } = useTranslation();
  const { language, isLoading: languageLoading } = useLanguage();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Fetch page SEO data from database
  const { data: pageData, isLoading: pageDataLoading } = trpc.pages.getBySlug.useQuery(
    { slug: 'new-order' },
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Extract SEO data from database (includes title, description, keywords, subtitle)
  const seoData = useSeoFromDatabase(pageData?.seoMeta || '{}');

  // Extract additional fields from seoMeta (badge, subtitle, title, heading)
  const getPageContent = () => {
    if (!pageData?.seoMeta) return { badge: '', title: '', subtitle: '', heading: '' };
    try {
      const seoMeta = typeof pageData.seoMeta === 'string' 
        ? JSON.parse(pageData.seoMeta) 
        : pageData.seoMeta;
      const langData = seoMeta[language] || seoMeta.en || {};
      return {
        badge: langData.badge || '',
        title: langData.title || '',
        subtitle: langData.subtitle || '',
        heading: langData.heading || langData.title || '' // Use heading if available, fallback to title
      };
    } catch (error) {
      console.error('Error parsing seoMeta for page content:', error);
      return { badge: '', title: '', subtitle: '', heading: '' };
    }
  };

  const pageContent = getPageContent();



  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Load data from URL parameters (from QuickOrderForm)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pickupAddress = urlParams.get('pickupAddress');
    const deliveryAddress = urlParams.get('deliveryAddress');
    const pickupLat = urlParams.get('pickupLat');
    const pickupLng = urlParams.get('pickupLng');
    const deliveryLat = urlParams.get('deliveryLat');
    const deliveryLng = urlParams.get('deliveryLng');

    if (pickupAddress || deliveryAddress) {
      setFormData(prev => ({
        ...prev,
        pickupAddress: pickupAddress || prev.pickupAddress,
        deliveryAddress: deliveryAddress || prev.deliveryAddress,
        pickupLatitude: pickupLat || prev.pickupLatitude,
        pickupLongitude: pickupLng || prev.pickupLongitude,
        deliveryLatitude: deliveryLat || prev.deliveryLatitude,
        deliveryLongitude: deliveryLng || prev.deliveryLongitude,
      }));
    }
  }, []);

  // Restore form data after login
  useEffect(() => {
    const pendingData = localStorage.getItem('pendingOrderData');
    if (pendingData && isAuthenticated) {
      try {
        const { formData: savedFormData, currentStep: savedStep, timestamp } = JSON.parse(pendingData);
        // Only restore if data is less than 1 hour old
        if (Date.now() - timestamp < 3600000) {
          setFormData(savedFormData);
          setCurrentStep(savedStep);
        }
        localStorage.removeItem('pendingOrderData');
      } catch (e) {
        console.error('Failed to restore order data:', e);
      }
    }
  }, [isAuthenticated]);

  // Form data
  const [formData, setFormData] = useState({
    orderType: "restaurant" as "restaurant" | "market" | "individual" | "express",
    pickupAddress: "",
    deliveryAddress: "",
    pickupLatitude: "0",
    pickupLongitude: "0",
    deliveryLatitude: "0",
    deliveryLongitude: "0",
    // Pickup contact info (optional)
    pickupFullName: "",
    pickupPhone: "",
    // Delivery contact info (optional)
    deliveryFullName: "",
    deliveryPhone: "",
    vehicleType: "any" as "bicycle" | "motorcycle" | "car" | "any",
    packageSize: "medium" as "small" | "medium" | "large",
    priorityLevel: "normal" as "normal" | "fast" | "urgent",
    packageDescription: "",
    specialInstructions: "",
    pricingScenario: "A" as "A" | "B" | "C",
    paymentType: "sender_pays" as "sender_pays" | "receiver_pays",
    paymentMethod: "cash" as "cash" | "card" | "wallet",
    deliveryTimeType: "now" as "now" | "scheduled",
    scheduledDeliveryDate: "",
    scheduledTimeSlot: "",
  });

  // Live price calculation state
  const [priceEstimate, setPriceEstimate] = useState<{
    distance: number;
    baseFee: number;
    distanceFee: number;
    vehicleFee: number;
    priorityFee: number;
    packageSizeFee: number;
    surgeFee: number;
    surgeMultiplier: number;
    totalFee: number;
  } | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      toast.success(`${t('orderCreated')} ${data.orderNumber}`);
      navigate("/my-orders");
    },
    onError: (error) => {
      toast.error(`${t('error')}: ${error.message}`);
    },
  });

  // Calculate price whenever relevant fields change
  useEffect(() => {
    const calculateLivePrice = async () => {
      // Check if we have valid coordinates
      const pickupLat = parseFloat(formData.pickupLatitude);
      const pickupLng = parseFloat(formData.pickupLongitude);
      const deliveryLat = parseFloat(formData.deliveryLatitude);
      const deliveryLng = parseFloat(formData.deliveryLongitude);

      if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng || 
          pickupLat === 0 || pickupLng === 0 || deliveryLat === 0 || deliveryLng === 0) {
        setPriceEstimate(null);
        return;
      }

      setIsCalculatingPrice(true);
      try {
        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (deliveryLat - pickupLat) * Math.PI / 180;
        const dLon = (deliveryLng - pickupLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(pickupLat * Math.PI / 180) * Math.cos(deliveryLat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c * 1000; // Convert to meters

        // Determine pricing scenario
        let scenario = "A";
        if (formData.orderType === "restaurant" || formData.orderType === "market") {
          scenario = "B";
        } else if (formData.orderType === "express") {
          scenario = "C";
        }

        // Base fees by scenario (in cents)
        const baseFeeMap = { A: 400, B: 350, C: 300 };
        const perKmFeeMap = { A: 70, B: 60, C: 50 };
        
        const baseFee = baseFeeMap[scenario as keyof typeof baseFeeMap];
        const perKmFee = perKmFeeMap[scenario as keyof typeof perKmFeeMap];
        const distanceFee = Math.round((distance / 1000) * perKmFee);

        // Vehicle type fee
        let vehicleFee = 0;
        if (formData.vehicleType === "car") {
          vehicleFee = 150; // +1.50 EUR
        } else if (formData.vehicleType === "motorcycle") {
          vehicleFee = 50; // +0.50 EUR
        }

        // Package size fee
        let packageSizeFee = 0;
        if (formData.packageSize === "large") {
          packageSizeFee = 100; // +1.00 EUR
        } else if (formData.packageSize === "medium") {
          packageSizeFee = 50; // +0.50 EUR
        }

        // Calculate subtotal before priority multiplier
        const subtotal = baseFee + distanceFee + vehicleFee + packageSizeFee;

        // Priority multiplier and fee
        let priorityMultiplier = 1.0;
        let priorityFee = 0;
        if (formData.priorityLevel === "urgent") {
          priorityMultiplier = 1.5; // +50%
          priorityFee = Math.round(subtotal * 0.5);
        } else if (formData.priorityLevel === "fast") {
          priorityMultiplier = 1.25; // +25%
          priorityFee = Math.round(subtotal * 0.25);
        }

        // Dynamic surge pricing (same as backend)
        let surgeFee = 0;
        let surgeMultiplier = 1.0;
        
        try {
          // Get courier availability from backend
          const availabilityData = await fetch('/api/trpc/couriers.getAvailability').then(r => r.json()).catch(() => null);
          
          if (availabilityData?.result?.data) {
            const { availableCount, activeCount } = availabilityData.result.data;
            const availabilityRatio = activeCount > 0 ? availableCount / activeCount : 0.5;
            
            // Check if it's peak hour (11:00-14:00 or 18:00-21:00)
            const currentHour = new Date().getHours();
            const isPeakHour = (currentHour >= 11 && currentHour < 14) || (currentHour >= 18 && currentHour < 21);
            
            // Apply surge pricing based on availability
            if (availabilityRatio < 0.2) {
              surgeMultiplier = 1.3; // +30% for very low availability
            } else if (availabilityRatio < 0.4) {
              surgeMultiplier = 1.15; // +15% for low availability
            } else if (availabilityRatio > 0.7 && !isPeakHour) {
              surgeMultiplier = 0.9; // -10% discount for high availability
            }
            
            // Additional peak hour surge
            if (isPeakHour && surgeMultiplier >= 1.0) {
              surgeMultiplier += 0.1;
            }
            
            // Calculate surge fee
            if (surgeMultiplier !== 1.0) {
              surgeFee = Math.round((subtotal * priorityMultiplier) * (surgeMultiplier - 1));
            }
          }
        } catch (error) {
          console.error('Error fetching surge pricing:', error);
          // Continue with no surge pricing on error
        }

        const totalFee = Math.round((subtotal * priorityMultiplier) * surgeMultiplier);

        setPriceEstimate({
          distance: Math.round(distance),
          baseFee,
          distanceFee,
          vehicleFee,
          priorityFee,
          packageSizeFee,
          surgeFee,
          surgeMultiplier,
          totalFee,
        });
      } catch (error) {
        console.error('Error calculating price:', error);
      } finally {
        setIsCalculatingPrice(false);
      }
    };

    calculateLivePrice();
  }, [
    formData.pickupLatitude,
    formData.pickupLongitude,
    formData.deliveryLatitude,
    formData.deliveryLongitude,
    formData.vehicleType,
    formData.priorityLevel,
    formData.packageSize,
    formData.orderType,
  ]);

  const handleNextStep = () => {
    if (!formData.pickupAddress || !formData.deliveryAddress) {
      toast.error(t('pleaseEnterAddresses'));
      return;
    }
    
    // Validate coordinates
    const pickupLat = parseFloat(formData.pickupLatitude);
    const pickupLng = parseFloat(formData.pickupLongitude);
    const deliveryLat = parseFloat(formData.deliveryLatitude);
    const deliveryLng = parseFloat(formData.deliveryLongitude);
    
    if (!pickupLat || !pickupLng || pickupLat === 0 || pickupLng === 0) {
      toast.error(t('pleaseSelectValidPickupAddress') || 'Please select a valid pickup address from the suggestions or use the map');
      return;
    }
    
    if (!deliveryLat || !deliveryLng || deliveryLat === 0 || deliveryLng === 0) {
      toast.error(t('pleaseSelectValidDeliveryAddress') || 'Please select a valid delivery address from the suggestions or use the map');
      return;
    }
    
    setCurrentStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      // Save form data to localStorage before redirecting to login
      localStorage.setItem('pendingOrderData', JSON.stringify({
        formData,
        currentStep,
        timestamp: Date.now()
      }));
      window.location.href = "/login?redirect=/new-order";
      return;
    }

    createOrderMutation.mutate(formData);
  };

  // Prepare SEO data BEFORE conditional return
  const finalTitle = seoData.title;
  const finalDescription = seoData.description;
  const finalKeywords = seoData.keywords;

  // Don't render content until page data and language are loaded to prevent title flickering
  if (pageDataLoading || languageLoading) {
    return null;
  }

  return (
    <>
      <SEOHead 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
      />
      <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-amber-50/20">
        <Header />

      {/* Page Header - Database Driven */}
      <PageHeader
        badge={pageContent.badge || t('newOrder')}
        title={pageContent.heading || t('callCourierNow')}
        subtitle={pageContent.subtitle || t('placeOrderDesc')}
      />

      {/* Progress Indicator Section */}
      <section className="bg-white py-6 border-b border-gray-100">
        <div className="container">
          <div className="max-w-4xl mx-auto">

            <div className="flex items-center justify-center gap-3 md:gap-4">
              <div className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-3.5 rounded-2xl transition-all duration-300 ${
                currentStep === 1 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl scale-105' 
                  : 'bg-white/80 backdrop-blur-sm text-gray-500 border-2 border-gray-200'
              }`}>
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === 1 ? 'bg-white/30' : 'bg-orange-100 text-orange-600'
                }`}>1</div>
                <span className="text-sm md:text-base font-bold hidden sm:inline">{t('addressDetails')}</span>
                <span className="text-sm font-bold sm:hidden">1</span>
              </div>
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
              <div className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-3.5 rounded-2xl transition-all duration-300 ${
                currentStep === 2 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl scale-105' 
                  : 'bg-white/80 backdrop-blur-sm text-gray-500 border-2 border-gray-200'
              }`}>
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === 2 ? 'bg-white/30' : 'bg-orange-100 text-orange-600'
                }`}>2</div>
                <span className="text-sm md:text-base font-bold hidden sm:inline">{t('priceConfirm')}</span>
                <span className="text-sm font-bold sm:hidden">2</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <div className="container pb-16">
        <div key={`step-${currentStep}`}>
        {currentStep === 1 ? (
          /* Step 1: Address and Details */
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Delivery Type */}
            <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-orange-100 rounded-2xl">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('deliveryType')}</h2>
                    <p className="text-sm text-gray-600">{t('selectDeliveryType')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: "restaurant", label: t('restaurant'), icon: "🍽️", gradient: "from-orange-400 to-orange-500" },
                    { value: "market", label: t('market'), icon: "🛒", gradient: "from-blue-400 to-blue-500" },
                    { value: "individual", label: t('individual'), icon: "📦", gradient: "from-green-400 to-green-500" },
                    { value: "express", label: t('express'), icon: "⚡", gradient: "from-purple-400 to-purple-500" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, orderType: type.value as any })}
                      className={`group relative p-4 md:p-5 rounded-xl border-2 transition-all duration-200 ${
                        formData.orderType === type.value
                          ? "border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl"
                          : "border-gray-200 hover:border-orange-300 bg-white hover:shadow-lg"
                      }`}
                    >
                      <div className="text-3xl md:text-4xl mb-2">{type.icon}</div>
                      <div className="font-semibold text-sm md:text-base text-gray-900">{type.label}</div>
                      {formData.orderType === type.value && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Addresses */}
            <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-orange-100 rounded-2xl">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('addresses')}</h2>
                    <p className="text-sm text-gray-600">{t('selectPickupDelivery')}</p>
                  </div>
                </div>

                {/* Address Inputs */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Pickup Address */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center">
                        <MapPin className="h-3.5 w-3.5 text-white" />
                      </div>
                      <Label className="text-sm font-semibold text-gray-900">{t('pickupAddress')}</Label>
                    </div>
                    <AddressMapPicker
                      label=""
                      value={formData.pickupAddress}
                      onChange={(address: string, lat: number, lng: number) => {
                        setFormData({
                          ...formData,
                          pickupAddress: address,
                          pickupLatitude: lat.toString(),
                          pickupLongitude: lng.toString(),
                        });
                      }}
                      placeholder={t('enterPickupAddress')}
                    />
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center">
                        <MapPin className="h-3.5 w-3.5 text-white" />
                      </div>
                      <Label className="text-sm font-semibold text-gray-900">{t('deliveryAddress')}</Label>
                    </div>
                    <AddressMapPicker
                      label=""
                      value={formData.deliveryAddress}
                      onChange={(address: string, lat: number, lng: number) => {
                        setFormData({
                          ...formData,
                          deliveryAddress: address,
                          deliveryLatitude: lat.toString(),
                          deliveryLongitude: lng.toString(),
                        });
                      }}
                      placeholder={t('enterDeliveryAddress')}
                    />
                  </div>
                </div>

                {/* Contact Information (Optional) */}
                <div className="mt-6 pt-6 border-t-2 border-dashed border-orange-200">
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{t('contactInfo')}</h3>
                        <p className="text-xs text-gray-600">{t('optional')} - {language === 'tr' ? 'Alıcı ve gönderici bilgileri' : language === 'mk' ? 'Информации за примач и испраќач' : language === 'sq' ? 'Informacione për marrës dhe dërgues' : 'Receiver and sender details'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Pickup Contact */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center shadow-md">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-sm font-bold text-gray-900">{t('pickupContact')}</p>
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={formData.pickupFullName}
                          onChange={(e) => setFormData({ ...formData, pickupFullName: e.target.value })}
                          placeholder={t('enterFullName')}
                          className="bg-white border-green-200 focus:border-green-400 focus:ring-green-400"
                        />
                        <Input
                          value={formData.pickupPhone}
                          onChange={(e) => setFormData({ ...formData, pickupPhone: e.target.value })}
                          placeholder={t('enterPhone')}
                          type="tel"
                          className="bg-white border-green-200 focus:border-green-400 focus:ring-green-400"
                        />
                      </div>
                    </div>

                    {/* Delivery Contact */}
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border-2 border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center shadow-md">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-sm font-bold text-gray-900">{t('deliveryContact')}</p>
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={formData.deliveryFullName}
                          onChange={(e) => setFormData({ ...formData, deliveryFullName: e.target.value })}
                          placeholder={t('enterFullName')}
                          className="bg-white border-red-200 focus:border-red-400 focus:ring-red-400"
                        />
                        <Input
                          value={formData.deliveryPhone}
                          onChange={(e) => setFormData({ ...formData, deliveryPhone: e.target.value })}
                          placeholder={t('enterPhone')}
                          type="tel"
                          className="bg-white border-red-200 focus:border-red-400 focus:ring-red-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Package Size */}
            <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-orange-100 rounded-2xl">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Box className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('packageSize')}</h2>
                    <p className="text-sm text-gray-600">{t('selectPackageSize')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "small", label: t('small'), icon: "📦", size: "30×30cm" },
                    { value: "medium", label: t('medium'), icon: "📦", size: "50×50cm" },
                    { value: "large", label: t('large'), icon: "📦", size: "70×70cm" },
                  ].map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, packageSize: size.value as any })}
                      className={`group relative p-2.5 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                        formData.packageSize === size.value
                          ? "border-orange-400 bg-orange-50 shadow-md"
                          : "border-gray-200 hover:border-orange-300 bg-white hover:shadow-sm"
                      }`}
                    >
                      <div className="text-2xl">{size.icon}</div>
                      <div className="font-semibold text-xs text-gray-900">{size.label}</div>
                      <div className="text-[10px] text-gray-500">{size.size}</div>
                      {formData.packageSize === size.value && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Vehicle Type */}
            <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-orange-100 rounded-2xl mb-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Bike className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('vehicleType')}</h2>
                    <p className="text-sm text-gray-600">{t('selectVehicleType')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 md:gap-4">
                  {[
                    { value: "any", label: t('any'), icon: Zap, gradient: "from-gray-400 to-gray-500" },
                    { value: "bicycle", label: t('bicycle'), icon: Bike, gradient: "from-green-400 to-green-500" },
                    { value: "motorcycle", label: t('motorcycle'), icon: Bike, gradient: "from-blue-400 to-blue-500" },
                    { value: "car", label: t('car'), icon: Car, gradient: "from-orange-400 to-orange-500" },
                  ].map((vehicle) => (
                    <button
                      key={vehicle.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, vehicleType: vehicle.value as any })}
                      className={`group relative p-3 md:p-5 rounded-xl border-2 transition-all duration-200 ${
                        formData.vehicleType === vehicle.value
                          ? "border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl"
                          : "border-gray-200 hover:border-orange-300 bg-white hover:shadow-lg"
                      }`}
                    >
                      <vehicle.icon className="w-8 h-8 md:w-10 md:h-10 mx-auto md:mb-2 text-gray-700" />
                      <div className="hidden md:block font-semibold text-sm md:text-base text-gray-900 max-sm:!hidden">{vehicle.label}</div>
                      {formData.vehicleType === vehicle.value && (
                        <div className="absolute top-1 right-1 md:top-2 md:right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
                          <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Priority */}
            <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-orange-100 rounded-2xl">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('priority')}</h2>
                    <p className="text-sm text-gray-600">{t('selectPriority')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {[
                    { 
                      value: "normal", 
                      label: t('normal'), 
                      icon: "🕐", 
                      priceMultiplier: "1.0x",
                      badgeBg: "bg-green-500"
                    },
                    { 
                      value: "fast", 
                      label: t('fast'), 
                      icon: "⚡", 
                      priceMultiplier: "+25%",
                      badgeBg: "bg-blue-500"
                    },
                    { 
                      value: "urgent", 
                      label: t('urgent'), 
                      icon: "🚨", 
                      priceMultiplier: "+50%",
                      badgeBg: "bg-red-500"
                    },
                  ].map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priorityLevel: priority.value as any })}
                      className={`relative p-2.5 md:p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1.5 ${
                        formData.priorityLevel === priority.value
                          ? "border-orange-400 bg-orange-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      {/* Icon */}
                      <div className="text-xl md:text-2xl">{priority.icon}</div>
                      
                      {/* Label */}
                      <div className="font-semibold text-xs md:text-sm text-gray-900">{priority.label}</div>

                      {/* Price Multiplier */}
                      <div className="text-[10px] md:text-xs font-medium text-gray-600">
                        {priority.priceMultiplier}
                      </div>

                      {/* Selected Checkmark */}
                      {formData.priorityLevel === priority.value && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Package Description */}
            <Card className="p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-lg border-orange-100 rounded-2xl">
              <div className="space-y-4">
                <Label className="text-base md:text-lg font-semibold text-gray-900">{t('packageDescription')}</Label>
                <Textarea
                  placeholder={t('packageDescriptionPlaceholder')}
                  value={formData.packageDescription}
                  onChange={(e) => setFormData({ ...formData, packageDescription: e.target.value })}
                  rows={3}
                  className="resize-none border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-xl text-sm md:text-base"
                />
              </div>
            </Card>

            {/* Payment Type - Compact */}
            <Card className="p-4 bg-white/80 backdrop-blur-sm shadow-lg border-orange-100 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{t('paymentType')}</span>
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentType: 'sender_pays' })}
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                      formData.paymentType === 'sender_pays'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t('senderPays')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentType: 'receiver_pays' })}
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                      formData.paymentType === 'receiver_pays'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t('receiverPays')}
                  </button>
                </div>
              </div>
            </Card>

            {/* Next Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleNextStep}
                size="lg"
                className="group w-full md:w-auto bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 text-white px-12 md:px-16 py-5 md:py-6 rounded-2xl text-lg md:text-xl font-bold shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <span className="flex items-center justify-center gap-3">
                  {t('continue')}
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </Button>
            </div>
          </div>
        ) : (
          /* Step 2: Price and Confirmation */
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            {/* Order Summary */}
            <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-xl border-orange-100 rounded-3xl">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('orderSummary')}</h2>
                    <p className="text-sm text-gray-600">{t('reviewYourOrder')}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-900">{t('pickupAddress')}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{formData.pickupAddress}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-gray-900">{t('deliveryAddress')}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{formData.deliveryAddress}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 text-center">
                    <div className="text-2xl mb-2">📦</div>
                    <div className="text-sm text-gray-600 mb-1">{t('packageSize')}</div>
                    <div className="font-bold text-gray-900">{t(formData.packageSize)}</div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center">
                    <div className="text-2xl mb-2">🚗</div>
                    <div className="text-sm text-gray-600 mb-1">{t('vehicleType')}</div>
                    <div className="font-bold text-gray-900">{t(formData.vehicleType)}</div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-center">
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="text-sm text-gray-600 mb-1">{t('priority')}</div>
                    <div className="font-bold text-gray-900">{t(formData.priorityLevel)}</div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-2xl border border-green-200 text-center">
                    <div className="text-2xl mb-2">🍽️</div>
                    <div className="text-sm text-gray-600 mb-1">{t('type')}</div>
                    <div className="font-bold text-gray-900">{t(formData.orderType)}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Price Calculation */}
            <Card className="p-8 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-xl rounded-3xl">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('priceCalculation')}</h2>
                    <p className="text-sm text-gray-600">{t('estimatedPrice')}</p>
                  </div>
                </div>

                {isCalculatingPrice ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  </div>
                ) : priceEstimate ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white rounded-xl">
                      <span className="text-gray-700">{t('baseFee')}</span>
                      <span className="font-bold text-gray-900">€{(priceEstimate.baseFee / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white rounded-xl">
                      <span className="text-gray-700">{t('distance')} ({(priceEstimate.distance / 1000).toFixed(1)} km)</span>
                      <span className="font-bold text-gray-900">€{(priceEstimate.distanceFee / 100).toFixed(2)}</span>
                    </div>
                    {priceEstimate.vehicleFee > 0 && (
                      <div className="flex justify-between items-center p-4 bg-white rounded-xl">
                        <span className="text-gray-700">{t('vehicleFee')}</span>
                        <span className="font-bold text-gray-900">€{(priceEstimate.vehicleFee / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {priceEstimate.priorityFee > 0 && (
                      <div className="flex justify-between items-center p-4 bg-white rounded-xl">
                        <span className="text-gray-700">{t('priorityFee')}</span>
                        <span className="font-bold text-gray-900">€{(priceEstimate.priorityFee / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {priceEstimate.packageSizeFee > 0 && (
                      <div className="flex justify-between items-center p-4 bg-white rounded-xl">
                        <span className="text-gray-700">{t('packageSizeFee')}</span>
                        <span className="font-bold text-gray-900">€{(priceEstimate.packageSizeFee / 100).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t-2 border-orange-300 pt-4">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white">
                        <span className="text-xl font-bold">{t('totalPrice')}</span>
                        <span className="text-3xl font-bold">€{(priceEstimate.totalFee / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">{t('enterAddressesToCalculatePrice')}</p>
                  </div>
                )}

                {/* Custom Price Offer */}
                <div className="p-6 bg-white rounded-2xl border-2 border-dashed border-orange-300">
                  <Label className="text-lg font-semibold text-gray-900 mb-3 block">{t('yourPriceOffer')}</Label>
                  <p className="text-sm text-gray-600 mb-4">{t('offerHigherPrice')}</p>
                  <Input
                    type="number"
                    step="0.50"
                    min={priceEstimate ? (priceEstimate.totalFee / 100).toFixed(2) : "0.00"}
                    placeholder={priceEstimate ? `€${(priceEstimate.totalFee / 100).toFixed(2)}` : "€0.00"}
                    disabled={!priceEstimate}
                    className="text-xl font-bold text-center border-orange-300 focus:border-orange-500 focus:ring-orange-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => setCurrentStep(1)}
                variant="outline"
                size="lg"
                className="flex-1 py-6 text-lg font-bold rounded-2xl border-2 border-orange-300 hover:bg-orange-50"
              >
                <ArrowRight className="mr-2 h-5 w-5 rotate-180" />
                {t('back')}
              </Button>

              <Button
                type="submit"
                disabled={createOrderMutation.isPending}
                size="lg"
                className="flex-1 py-6 text-lg font-bold rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                {createOrderMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('processing')}...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    {t('confirmOrder')}
                  </span>
                )}
              </Button>
            </div>
          </form>
        )}
        </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
