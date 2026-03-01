import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { 
  CheckCircle2, 
  Bike, 
  DollarSign, 
  Clock, 
  Shield, 
  Zap, 
  MapPin, 
  Star, 
  TrendingUp, 
  Users, 
  Wallet, 
  Calendar,
  ArrowRight,
  Sparkles,
  Trophy,
  Heart,
  Target,
  Gift,
  AlertCircle,
  Eye,
  EyeOff,
  Package,
  User as UserIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";

export default function CourierRegister() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Courier Driver",
    "description": "Join FastlyGo as a courier driver and enjoy flexible working hours with competitive earnings. Deliver packages across Skopje with your own vehicle. Perfect for those seeking part-time or full-time opportunities with immediate start.",
    "datePosted": "2024-01-01",
    "validThrough": "2025-12-31",
    "employmentType": ["FULL_TIME", "PART_TIME", "CONTRACTOR"],
    "hiringOrganization": {
      "@type": "Organization",
      "name": "FastlyGo",
      "sameAs": "https://fastlygo.mk",
      "logo": "https://fastlygo.mk/logo.webp"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Skopje",
        "addressLocality": "Skopje",
        "addressRegion": "Skopje Region",
        "postalCode": "1000",
        "addressCountry": "MK"
      }
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": {
        "@type": "QuantitativeValue",
        "value": 500,
        "unitText": "WEEK"
      }
    },
    "workHours": "Flexible",
    "responsibilities": "Deliver packages and documents across Skopje, maintain professional customer service, ensure timely deliveries, use mobile app for order management.",
    "qualifications": "Valid driver's license, own vehicle (bicycle, motorcycle, or car), smartphone with GPS, good communication skills."
  };
  
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: "",
    email: isAuthenticated ? "" : (user?.email || ""),
    password: "",
    confirmPassword: "",
    gender: undefined as "male" | "female" | "other" | undefined,
    vehicleType: "motorcycle" as "bicycle" | "motorcycle" | "car",
    vehiclePlate: "",
    experience: "",
    availability: "fulltime" as "fulltime" | "parttime" | "weekend" | "none",
    hasOwnVehicle: true,
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  
  const [submitted, setSubmitted] = useState(false);

  const registerMutation = trpc.courierV2.applyToCourier.useMutation({
    onSuccess: () => {
      toast.success(t('applicationReceived'));
      setSubmitted(true);
      // Do NOT navigate or invalidate auth - causes login redirect
      // because auth state hasn't updated with new role yet
    },
    onError: (error) => {
      toast.error(error.message || t('applicationFailed'));
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Personal info validation
    if (!formData.name.trim()) {
      newErrors.name = t('nameRequired') || 'Ad gereklidir';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('phoneRequired') || 'Telefon gereklidir';
    }
    if (!formData.gender) {
      newErrors.gender = t('genderRequired') || 'Cinsiyet gereklidir';
    }

    // Email/Password validation (only for non-authenticated users)
    if (!isAuthenticated) {
      if (!formData.email.trim()) {
        newErrors.email = t('emailRequired') || 'E-posta gereklidir';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('invalidEmail') || 'Geçersiz e-posta';
      }
      if (!formData.password) {
        newErrors.password = t('passwordRequired') || 'Şifre gereklidir';
      } else if (formData.password.length < 8) {
        newErrors.password = t('passwordTooShort') || 'Şifre en az 8 karakter olmalıdır';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('passwordMismatch') || 'Şifreler eşleşmiyor';
      }
    }

    // Vehicle info validation
    if (!formData.vehiclePlate.trim()) {
      newErrors.vehiclePlate = t('vehiclePlateRequired') || 'Araç plakası gereklidir';
    }

    // Terms agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = t('agreeToTerms') || 'Şartları kabul etmelisiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('pleaseCompleteAllFields'));
      return;
    }

    const submitData = {
      phone: formData.phone,
      gender: formData.gender as "male" | "female" | "other",
      vehicleType: formData.vehicleType,
      vehiclePlate: formData.vehiclePlate,
      experience: formData.experience,
      availability: formData.availability,
      iban: "", // Empty for now, will be collected later
      identityNumber: "", // Empty for now, will be collected later
      identityType: "tc" as "tc" | "passport",
      ...(isAuthenticated ? {} : {
        email: formData.email,
        password: formData.password,
        name: formData.name,
      }),
    };

    registerMutation.mutate(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-200/50">
                <CheckCircle2 className="h-14 w-14 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Başvurunuz Alındı!
              </h2>
              <p className="text-xl text-gray-600 max-w-lg mx-auto">
                Kurye başvurunuz başarıyla sisteme kaydedildi. Ekibimiz en kısa sürede inceleyecektir.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-orange-100 shadow-lg p-8 mb-6">
              <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Değerlendirme Süreci
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Başvuru Alındı</p>
                    <p className="text-sm text-gray-500">Kurye bilgileriniz sisteme kaydedildi</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 animate-pulse">2</div>
                  <div>
                    <p className="font-semibold text-gray-900">Kimlik Doğrulama</p>
                    <p className="text-sm text-gray-500">Kimlik ve sürücü belgesi kontrol ediliyor (1-2 iş günü)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="font-semibold text-gray-400">Onay & Aktivasyon</p>
                    <p className="text-sm text-gray-400">Hesabınız aktive edilecek ve kurye dashboard'a erişebileceksiniz</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-sm text-amber-800">
                Onay e-postası kayıt sırasında girdiğiniz e-posta adresine gönderilecektir. Spam klasörünüzü de kontrol etmeyi unutmayın.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate("/login")}
                size="lg"
                className="flex-1 h-13 text-base rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200/50"
              >
                Giriş Sayfasına Git
              </Button>
              <Button
                onClick={() => navigate("/")}
                size="lg"
                variant="outline"
                className="flex-1 h-13 text-base rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                Ana Sayfaya Dön
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-amber-50/20">
      <SEOHead 
        titleKey="seoTitleCourierRegister"
        descriptionKey="seoDescriptionCourierRegister"
        keywordsKey="seoKeywordsCourierRegister"
        structuredData={structuredData}
      />
      <Header />

      {/* Hero Section - Conversion Focused */}
      <section className="relative overflow-hidden py-16 lg:py-20">
        {/* Soft 3D Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 via-amber-50/30 to-orange-50/40" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-amber-300/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}} />
        
        <div className="container relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm border-2 border-orange-200 text-orange-600 text-sm font-bold shadow-lg hover:shadow-xl transition-all">
              <Sparkles className="w-5 h-5" />
              <span>{t('startEarningNow')}</span>
            </div>
            
            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  {language === 'tr' ? 'Kurye Ol,' : language === 'mk' ? 'Станете Курир' : 'Become a Courier'}
                </span>
                <span className="block mt-2 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 bg-clip-text text-transparent">
                  {language === 'tr' ? 'Özgürce Kazan!' : language === 'mk' ? 'Заработувајте Слободно!' : 'Earn Freely!'}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto font-medium">
                {t('courierHeroDesc')}
              </p>
            </div>

            {/* Quick Stats - 3D Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4">
              <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-orange-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">€500+</div>
                  <div className="text-sm text-gray-600 mt-1">{t('weeklyEarnings')}</div>
                </div>
              </div>
              
              <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-orange-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">24h</div>
                  <div className="text-sm text-gray-600 mt-1">{t('approval24h')}</div>
                </div>
              </div>
              
              <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-orange-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">100%</div>
                  <div className="text-sm text-gray-600 mt-1">{language === 'tr' ? 'Esnek Çalışma' : 'Flexible Hours'}</div>
                </div>
              </div>
              
              <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-orange-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">0€</div>
                  <div className="text-sm text-gray-600 mt-1">{language === 'tr' ? 'Başlangıç Ücreti' : 'Startup Cost'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Soft 3D Cards */}
      <section className="py-12 lg:py-16 relative">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Benefit Card 1 */}
              <div className="group relative bg-gradient-to-br from-white to-orange-50/30 rounded-3xl p-8 border border-orange-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{language === 'tr' ? 'Yüksek Kazanç' : 'High Earnings'}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {language === 'tr' ? 'Haftada ortalama €500+ kazanç. Daha fazla çalış, daha fazla kazan!' : 'Average €500+ per week. Work more, earn more!'}
                  </p>
                </div>
              </div>

              {/* Benefit Card 2 */}
              <div className="group relative bg-gradient-to-br from-white to-orange-50/30 rounded-3xl p-8 border border-orange-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{language === 'tr' ? 'Esnek Saatler' : 'Flexible Hours'}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {language === 'tr' ? 'İstediğin zaman çalış. Tam zamanlı, yarı zamanlı veya hafta sonu.' : 'Work when you want. Full-time, part-time or weekends.'}
                  </p>
                </div>
              </div>

              {/* Benefit Card 3 */}
              <div className="group relative bg-gradient-to-br from-white to-orange-50/30 rounded-3xl p-8 border border-orange-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{language === 'tr' ? 'Hızlı Başlangıç' : 'Quick Start'}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {language === 'tr' ? '24 saat içinde onay. Hemen kazanmaya başla!' : 'Approval within 24 hours. Start earning immediately!'}
                  </p>
                </div>
              </div>
            </div>

            {/* Application Form - Soft 3D Design */}
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white">
                <div className="max-w-3xl mx-auto text-center">
                  <h2 className="text-3xl lg:text-4xl font-bold mb-3">
                    {language === 'tr' ? 'Başvuru Formu' : language === 'mk' ? 'Формулар за Пријава' : 'Application Form'}
                  </h2>
                  <p className="text-orange-50 text-lg">
                    {language === 'tr' ? 'Formu doldur, 24 saat içinde geri dönüş al!' : 'Fill the form, get a response within 24 hours!'}
                  </p>
                </div>
              </div>

              <CardContent className="p-8 lg:p-12">
                <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
                  
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b-2 border-orange-100">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{language === 'tr' ? 'Kişisel Bilgiler' : 'Personal Information'}</h3>
                        <p className="text-sm text-gray-600">{language === 'tr' ? 'Temel bilgilerinizi girin' : 'Enter your basic information'}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold text-gray-900">
                          {language === 'tr' ? 'Ad Soyad' : 'Full Name'}
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          placeholder={language === 'tr' ? 'Adınız ve soyadınız' : 'Your full name'}
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          disabled={isAuthenticated}
                          className="rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 h-12 text-base"
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold text-gray-900">
                          {language === 'tr' ? 'Telefon' : 'Phone'}
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          type="tel"
                          placeholder="+389 XX XXX XXX"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 h-12 text-base"
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-sm font-semibold text-gray-900">
                        {language === 'tr' ? 'Cinsiyet' : 'Gender'}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger className="rounded-xl border-2 border-gray-200 focus:border-orange-500 h-12 text-base">
                          <SelectValue placeholder={language === 'tr' ? 'Seçiniz' : 'Select'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{language === 'tr' ? 'Erkek' : 'Male'}</SelectItem>
                          <SelectItem value="female">{language === 'tr' ? 'Kadın' : 'Female'}</SelectItem>
                          <SelectItem value="other">{language === 'tr' ? 'Diğer' : 'Other'}</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.gender}
                        </p>
                      )}
                    </div>

                    {!isAuthenticated && (
                      <>
                        <div className="space-y-2.5">
                          <Label className="text-sm font-semibold text-gray-900">
                            {language === 'tr' ? 'E-posta' : 'Email'}
                            <span className="text-red-500 ml-1">*</span>
                          </Label>
                          <Input
                            type="email"
                            placeholder="ornek@email.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 h-12 text-base"
                          />
                          {errors.email && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.email}
                            </p>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2.5">
                            <Label className="text-sm font-semibold text-gray-900">
                              {language === 'tr' ? 'Şifre' : 'Password'}
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className="rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 h-12 text-base pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                            {errors.password && (
                              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.password}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2.5">
                            <Label className="text-sm font-semibold text-gray-900">
                              {language === 'tr' ? 'Şifre Onayla' : 'Confirm Password'}
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                className="rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 h-12 text-base pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                            {errors.confirmPassword && (
                              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.confirmPassword}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Vehicle Information */}
                  <div className="space-y-6 pt-6">
                    <div className="flex items-center gap-3 pb-4 border-b-2 border-orange-100">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                        <Bike className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{language === 'tr' ? 'Araç Bilgileri' : 'Vehicle Information'}</h3>
                        <p className="text-sm text-gray-600">{language === 'tr' ? 'Araç detaylarını girin' : 'Enter your vehicle details'}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold text-gray-900">
                          {language === 'tr' ? 'Araç Tipi' : 'Vehicle Type'}
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange('vehicleType', value)}>
                          <SelectTrigger className="rounded-xl border-2 border-gray-200 focus:border-orange-500 h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bicycle">{language === 'tr' ? 'Bisiklet' : 'Bicycle'}</SelectItem>
                            <SelectItem value="motorcycle">{language === 'tr' ? 'Motosiklet' : 'Motorcycle'}</SelectItem>
                            <SelectItem value="car">{language === 'tr' ? 'Araba' : 'Car'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold text-gray-900">
                          {language === 'tr' ? 'Araç Plakası' : 'Vehicle Plate'}
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          placeholder={language === 'tr' ? 'Örn: MK-123-AB' : 'E.g: MK-123-AB'}
                          value={formData.vehiclePlate}
                          onChange={(e) => handleInputChange('vehiclePlate', e.target.value.toUpperCase())}
                          className="rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 h-12 text-base uppercase"
                        />
                        {errors.vehiclePlate && (
                          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.vehiclePlate}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold text-gray-900">
                          {language === 'tr' ? 'Deneyim' : 'Experience'}
                        </Label>
                        <Textarea
                          placeholder={language === 'tr' ? 'Kurye deneyiminizi yazın (opsiyonel)' : 'Write your courier experience (optional)'}
                          value={formData.experience}
                          onChange={(e) => handleInputChange('experience', e.target.value)}
                          className="rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 min-h-[120px] text-base resize-none"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold text-gray-900">
                          {language === 'tr' ? 'Çalışma Saatleri' : 'Working Hours'}
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value)}>
                          <SelectTrigger className="rounded-xl border-2 border-gray-200 focus:border-orange-500 h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fulltime">{language === 'tr' ? 'Tam Zamanlı' : 'Full-time'}</SelectItem>
                            <SelectItem value="parttime">{language === 'tr' ? 'Yarı Zamanlı' : 'Part-time'}</SelectItem>
                            <SelectItem value="weekend">{language === 'tr' ? 'Hafta Sonu' : 'Weekends'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="pt-6 border-t-2 border-orange-100 space-y-6">
                    <div className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                      <Checkbox 
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked === true)}
                        className="mt-1 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                        {language === 'tr' ? 'Şartları ve koşulları kabul ediyorum' : 'I agree to the terms and conditions'}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.agreeToTerms}
                      </p>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {registerMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {language === 'tr' ? 'Gönderiliyor...' : 'Submitting...'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {language === 'tr' ? 'Başvuruyu Gönder' : 'Submit Application'}
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
