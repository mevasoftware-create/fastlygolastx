import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSeoFromDatabase } from "@/hooks/useSeoFromDatabase";

import { 
  CheckCircle2, 
  Store,
  ShoppingCart,
  Pill,
  Package,
  ArrowRight,
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  FileText,
  TrendingUp,
  Users,
  Clock,
  Shield,
  Sparkles,
  Zap,
  Star,
  BarChart3,
  Truck,
  Globe,
  Headphones,
  Target,
  Rocket,
  Award,
  Heart
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";

type BusinessType = "restaurant" | "market" | "pharmacy" | "retail";



interface FormData {
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  businessType: BusinessType;
  taxNumber: string;
}

export default function BusinessRegister() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Business Partnership - FastlyGo",
    "description": "Partner with FastlyGo for your business delivery needs"
  };
  
  const { t, language } = useTranslation();
  const languageLoading = false;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    businessType: "restaurant",
    taxNumber: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const utils = trpc.useUtils();
  const createBusinessMutation = trpc.business.register.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success(t('businessRegistrationSuccess'));
      // Stay on success screen - do NOT navigate or invalidate auth
      // Navigating to /pending-approval causes login redirect because
      // auth state hasn't updated yet with the new role
    },
    onError: (error) => {
      toast.error(error.message || t('businessRegistrationError'));
    },
  });

  const businessTypes = [
    { 
      value: "restaurant" as BusinessType, 
      label: language === 'tr' ? 'Restoran / Kafe' : language === 'mk' ? 'Ресторан / Кафе' : 'Restaurant / Cafe',
      icon: Store,
      description: language === 'tr' ? 'Yemek ve içecek teslimatı' : 'Food and beverage delivery',
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    { 
      value: "market" as BusinessType, 
      label: language === 'tr' ? 'Market / Bakkal' : language === 'mk' ? 'Маркет / Бакалница' : 'Market / Grocery',
      icon: ShoppingCart,
      description: language === 'tr' ? 'Günlük alışveriş teslimatı' : 'Daily shopping delivery',
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    { 
      value: "pharmacy" as BusinessType, 
      label: language === 'tr' ? 'Eczane' : language === 'mk' ? 'Аптека' : 'Pharmacy',
      icon: Pill,
      description: language === 'tr' ? 'İlaç ve sağlık ürünleri' : 'Medicine and health products',
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    { 
      value: "retail" as BusinessType, 
      label: language === 'tr' ? 'Perakende / Mağaza' : language === 'mk' ? 'Малопродажба' : 'Retail / Store',
      icon: Package,
      description: language === 'tr' ? 'Genel ürün teslimatı' : 'General product delivery',
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!formData.businessName.trim()) {
        newErrors.businessName = t('businessNameRequired');
      }
      if (!formData.contactPerson.trim()) {
        newErrors.contactPerson = t('contactPersonRequired');
      }
      if (!formData.phone.trim()) {
        newErrors.phone = t('phoneRequired');
      } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
        newErrors.phone = t('invalidPhone');
      }
      
      // Only validate email/password if user is not logged in
      if (!isAuthenticated) {
        if (!formData.email.trim()) {
          newErrors.email = t('emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = t('invalidEmailFormat');
        }
        if (!formData.password.trim()) {
          newErrors.password = t('passwordRequired');
        } else if (formData.password.length < 8) {
          newErrors.password = t('passwordMinLength');
        }
      }
    }

    if (step === 2) {
      if (!formData.address.trim()) {
        newErrors.address = t('addressRequired');
      }
      if (!formData.taxNumber.trim()) {
        newErrors.taxNumber = t('taxNumberRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      // Forma scroll et, sayfa başına değil
      setTimeout(() => {
        const formElement = document.querySelector('[data-form-section]');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
    // Forma scroll et, sayfa başına değil
    setTimeout(() => {
      const formElement = document.querySelector('[data-form-section]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  };

  const handleSubmit = async () => {
    if (validateStep(2)) {
      createBusinessMutation.mutate(formData);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Başarı İkonu */}
            <div className="text-center mb-10">
              <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-200/50">
                <CheckCircle2 className="h-14 w-14 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {language === 'tr' ? 'Başvurunuz Alındı!' : language === 'mk' ? 'Вашата апликација е примена!' : 'Application Received!'}
              </h2>
              <p className="text-xl text-gray-600 max-w-lg mx-auto">
                {language === 'tr'
                  ? 'İşletme başvurunuz başarıyla sisteme kaydedildi. Ekibimiz en kısa sürede inceleyecektir.'
                  : language === 'mk'
                  ? 'Вашата апликација за бизнис е успешно регистрирана. Нашиот тим ќе ја прегледа наскоро.'
                  : 'Your business application has been successfully registered. Our team will review it shortly.'}
              </p>
            </div>

            {/* Süreç Adımları */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-lg p-8 mb-6">
              <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                {language === 'tr' ? 'Değerlendirme Süreci' : 'Review Process'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{language === 'tr' ? 'Başvuru Alındı' : 'Application Received'}</p>
                    <p className="text-sm text-gray-500">{language === 'tr' ? 'İşletme bilgileriniz sisteme kaydedildi' : 'Your business information has been saved'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 animate-pulse">2</div>
                  <div>
                    <p className="font-semibold text-gray-900">{language === 'tr' ? 'Belge İncelemesi' : 'Document Review'}</p>
                    <p className="text-sm text-gray-500">{language === 'tr' ? 'Vergi numarası ve ticaret sicil doğrulanıyor (1-2 iş günü)' : 'Tax number and trade registry verification (1-2 business days)'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="font-semibold text-gray-400">{language === 'tr' ? 'Onay & Aktivasyon' : 'Approval & Activation'}</p>
                    <p className="text-sm text-gray-400">{language === 'tr' ? 'Hesabınız aktive edilecek ve giriş yapabileceksiniz' : 'Your account will be activated and you can log in'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bilgi Kutusu */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-sm text-amber-800">
                {language === 'tr'
                  ? 'Onay e-postası kayıt sırasında girdiğiniz e-posta adresine gönderilecektir. Spam klasörünüzü de kontrol etmeyi unutmayın.'
                  : 'An approval email will be sent to the email address you entered during registration. Don\'t forget to check your spam folder.'}
              </p>
            </div>

            {/* Butonlar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate("/login")}
                size="lg"
                className="flex-1 h-13 text-base rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200/50"
              >
                {language === 'tr' ? 'Giriş Sayfasına Git' : 'Go to Login'}
              </Button>
              <Button
                onClick={() => navigate("/")}
                size="lg"
                variant="outline"
                className="flex-1 h-13 text-base rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                {language === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home'}
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/20">
      <SEOHead 
        titleKey="seoTitleBusinessRegister"
        descriptionKey="seoDescriptionBusinessRegister"
        keywordsKey="seoKeywordsBusinessRegister"
        structuredData={structuredData}
      />
      <Header />
      
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 lg:py-24">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0YzAtMiAyLTQgMi00czIgMiAyIDQtMiA0LTIgNC0yLTItMi00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 mb-8 border border-white/20">
              <Rocket className="h-5 w-5 text-orange-400" />
              <span className="text-sm font-semibold">{language === 'tr' ? 'İşletmenizi Büyütün' : 'Grow Your Business'}</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {language === 'tr' ? 'Teslimat Ağımıza' : language === 'mk' ? 'Приклучете се на нашата' : 'Join Our Delivery'}
              <span className="block mt-2 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                {language === 'tr' ? 'Katılın!' : language === 'mk' ? 'мрежа!' : 'Network!'}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
              {language === 'tr' 
                ? 'Binlerce müşteriye ulaşın, satışlarınızı artırın. Profesyonel teslimat hizmetimizle işletmenizi bir üst seviyeye taşıyın.'
                : 'Reach thousands of customers, increase your sales. Take your business to the next level with our professional delivery service.'}
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-orange-400">500+</div>
                <div className="text-sm text-white/70">{language === 'tr' ? 'Partner İşletme' : 'Partner Businesses'}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-orange-400">50K+</div>
                <div className="text-sm text-white/70">{language === 'tr' ? 'Aylık Teslimat' : 'Monthly Deliveries'}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-orange-400">15 dk</div>
                <div className="text-sm text-white/70">{language === 'tr' ? 'Ort. Teslimat' : 'Avg. Delivery'}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-orange-400">4.9</div>
                <div className="text-sm text-white/70">{language === 'tr' ? 'Müşteri Puanı' : 'Customer Rating'}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.05"/>
            <path d="M0 120L60 115C120 110 240 100 360 95C480 90 600 90 720 92C840 94 960 98 1080 100C1200 102 1320 102 1380 102L1440 102V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 lg:py-20">
        <div className="container px-3 sm:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-12">
            
            {/* Left Side - Benefits */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 hidden lg:block">
              
              {/* Why Join Card */}
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{language === 'tr' ? 'Neden FastlyGo?' : 'Why FastlyGo?'}</h3>
                      <p className="text-sm text-white/80">{language === 'tr' ? 'Avantajlarınız' : 'Your advantages'}</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      { icon: Globe, title: language === 'tr' ? 'Geniş Müşteri Ağı' : 'Wide Customer Network', desc: language === 'tr' ? 'Binlerce aktif kullanıcıya ulaşın' : 'Reach thousands of active users' },
                      { icon: Truck, title: language === 'tr' ? 'Hızlı Teslimat' : 'Fast Delivery', desc: language === 'tr' ? 'Ortalama 15 dakikada teslimat' : 'Average 15-minute delivery' },
                      { icon: BarChart3, title: language === 'tr' ? 'Detaylı Raporlama' : 'Detailed Reporting', desc: language === 'tr' ? 'Satış ve performans analizleri' : 'Sales and performance analytics' },
                      { icon: Headphones, title: language === 'tr' ? '7/24 Destek' : '24/7 Support', desc: language === 'tr' ? 'Her zaman yanınızdayız' : 'We are always with you' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-orange-50/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center flex-shrink-0">
                          <item.icon className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Testimonial Card */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/90 mb-6 italic">
                    "{language === 'tr' 
                      ? 'FastlyGo ile çalışmaya başladığımızdan beri satışlarımız %40 arttı. Müşteri memnuniyeti de çok yüksek!'
                      : 'Since we started working with FastlyGo, our sales have increased by 40%. Customer satisfaction is also very high!'}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                      MR
                    </div>
                    <div>
                      <div className="font-semibold">Mehmet R.</div>
                      <div className="text-sm text-white/60">{language === 'tr' ? 'Restoran Sahibi' : 'Restaurant Owner'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Commission Info */}
              <Card className="border-0 shadow-xl border-2 border-green-200 bg-green-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{language === 'tr' ? 'Düşük Komisyon' : 'Low Commission'}</h3>
                      <p className="text-sm text-gray-600">{language === 'tr' ? 'Sektörün en uygun oranları' : 'Best rates in the industry'}</p>
                    </div>
                  </div>
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-green-600">%15</div>
                    <div className="text-sm text-gray-600">{language === 'tr' ? 'başlangıç komisyonu' : 'starting commission'}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Application Form */}
            <div className="lg:col-span-3" data-form-section>
              <Card className="border-0 shadow-lg lg:shadow-2xl overflow-hidden rounded-3xl">
                {/* Form Header with Steps */}
                <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-8 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Building2 className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold">{language === 'tr' ? 'İşletme Başvurusu' : 'Business Application'}</h2>
                        <p className="text-white/80 text-sm mt-1">{language === 'tr' ? 'Adım' : 'Step'} {currentStep} / 2</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="flex gap-2">
                    <div className={`h-1.5 flex-1 rounded-full ${currentStep >= 1 ? 'bg-orange-500' : 'bg-white/20'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${currentStep >= 2 ? 'bg-orange-500' : 'bg-white/20'}`} />
                  </div>
                </div>
                
                <CardContent className="p-6 sm:p-8 lg:p-10 bg-white">
                  {/* Step 1: Business Type & Contact Info */}
                  {currentStep === 1 && (
                    <div className="space-y-8">
                      {/* Business Type Selection */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <Store className="h-5 w-5 text-orange-600" />
                          {language === 'tr' ? 'İşletme Türü Seçin' : 'Select Business Type'}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 md:gap-5">
                          {businessTypes.map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, businessType: type.value })}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                formData.businessType === type.value
                                  ? `${type.borderColor} ${type.bgColor} shadow-lg`
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}>
                                <type.icon className="h-6 w-6 text-white" />
                              </div>
                              <div className="font-semibold text-gray-900">{type.label}</div>
                              <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Contact Information */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <Phone className="h-5 w-5 text-orange-600" />
                          {language === 'tr' ? 'İletişim Bilgileri' : 'Contact Information'}
                        </h3>
                        <div className="space-y-5">
                          <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">{language === 'tr' ? 'İşletme Adı' : 'Business Name'} *</Label>
                              <Input
                                value={formData.businessName}
                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                placeholder={language === 'tr' ? 'Örn: Lezzet Cafe' : 'E.g: Taste Cafe'}
                                className={`h-12 text-base rounded-xl ${errors.businessName ? 'border-red-500' : 'border-gray-200'}`}
                              />
                              {errors.businessName && <p className="text-xs text-red-500">{errors.businessName}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">{language === 'tr' ? 'Yetkili Kişi' : 'Contact Person'} *</Label>
                              <Input
                                value={formData.contactPerson}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                placeholder={language === 'tr' ? 'Ad Soyad' : 'Full Name'}
                                className={`h-12 text-base rounded-xl ${errors.contactPerson ? 'border-red-500' : 'border-gray-200'}`}
                              />
                              {errors.contactPerson && <p className="text-xs text-red-500">{errors.contactPerson}</p>}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">{language === 'tr' ? 'Telefon Numarası' : 'Phone Number'} *</Label>
                            <Input
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+389 70 123 456"
                              className={`h-12 text-base rounded-xl ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                            />
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                          </div>
                          
                          {/* Only show email/password if not authenticated */}
                          {!isAuthenticated && (
                            <div className="grid md:grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">{t('email')} *</Label>
                                <Input
                                  type="email"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  placeholder="example@email.com"
                                  className={`h-12 text-base rounded-xl ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                                />
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">{t('password')} *</Label>
                                <Input
                                  type="password"
                                  value={formData.password}
                                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                  placeholder="••••••••"
                                  className={`h-12 text-base rounded-xl ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                                />
                                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                                <p className="text-xs text-gray-500">{language === 'tr' ? 'En az 8 karakter' : 'At least 8 characters'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleNext}
                        className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:via-orange-700 hover:to-amber-600 shadow-lg shadow-orange-200/50 text-white mt-8"
                      >
                        {language === 'tr' ? 'Devam Et' : 'Continue'}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Step 2: Address & Tax Info */}
                  {currentStep === 2 && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-orange-600" />
                          {language === 'tr' ? 'İşletme Detayları' : 'Business Details'}
                        </h3>
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">{language === 'tr' ? 'İşletme Adresi' : 'Business Address'} *</Label>
                            <Textarea
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              placeholder={language === 'tr' ? 'Tam adres (sokak, numara, mahalle, ilçe)' : 'Full address (street, number, neighborhood, district)'}
                              className={`min-h-[100px] text-base rounded-xl ${errors.address ? 'border-red-500' : 'border-gray-200'}`}
                            />
                            {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">{language === 'tr' ? 'Vergi Numarası' : 'Tax Number'} *</Label>
                            <Input
                              value={formData.taxNumber}
                              onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                              placeholder={language === 'tr' ? 'Vergi numaranızı girin' : 'Enter your tax number'}
                              className={`h-12 text-base rounded-xl ${errors.taxNumber ? 'border-red-500' : 'border-gray-200'}`}
                            />
                            {errors.taxNumber && <p className="text-xs text-red-500">{errors.taxNumber}</p>}
                          </div>
                        </div>
                      </div>
                      
                      {/* Summary Card */}
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-orange-600" />
                          {language === 'tr' ? 'Başvuru Özeti' : 'Application Summary'}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{language === 'tr' ? 'İşletme Türü' : 'Business Type'}</span>
                            <span className="font-medium text-gray-900">{businessTypes.find(t => t.value === formData.businessType)?.label}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{language === 'tr' ? 'İşletme Adı' : 'Business Name'}</span>
                            <span className="font-medium text-gray-900">{formData.businessName || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{language === 'tr' ? 'Yetkili' : 'Contact'}</span>
                            <span className="font-medium text-gray-900">{formData.contactPerson || '-'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 pt-4">
                        <Button
                          variant="outline"
                          onClick={handleBack}
                          className="flex-1 h-14 text-lg font-semibold rounded-2xl border-2 border-gray-300 hover:bg-gray-50"
                        >
                          <ArrowLeft className="mr-2 h-5 w-5" />
                          {language === 'tr' ? 'Geri' : 'Back'}
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={createBusinessMutation.isPending}
                          className="flex-1 h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:via-orange-700 hover:to-amber-600 shadow-lg shadow-orange-200/50 text-white"
                        >
                          {createBusinessMutation.isPending ? (
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              {language === 'tr' ? 'Gönderiliyor...' : 'Submitting...'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              {language === 'tr' ? 'Başvuruyu Gönder' : 'Submit Application'}
                              <CheckCircle2 className="h-5 w-5" />
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Trust Badges */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-white shadow-lg border border-gray-100">
                  <Shield className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">{language === 'tr' ? 'Güvenli' : 'Secure'}</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white shadow-lg border border-gray-100">
                  <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">{language === 'tr' ? '24 Saat Onay' : '24h Approval'}</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white shadow-lg border border-gray-100">
                  <Heart className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">{language === 'tr' ? 'Ücretsiz' : 'Free'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-orange-50/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {language === 'tr' ? 'Nasıl Partner Olunur?' : 'How to Become a Partner?'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {language === 'tr' ? 'Sadece 3 basit adımda işletmenizi büyütmeye başlayın' : 'Start growing your business in just 3 simple steps'}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                icon: FileText,
                title: language === 'tr' ? 'Başvur' : 'Apply',
                desc: language === 'tr' ? 'Formu doldurun, işletme bilgilerinizi girin' : 'Fill out the form, enter your business information'
              },
              {
                step: 2,
                icon: CheckCircle2,
                title: language === 'tr' ? 'Onay Al' : 'Get Approved',
                desc: language === 'tr' ? '24 saat içinde ekibimiz sizinle iletişime geçer' : 'Our team will contact you within 24 hours'
              },
              {
                step: 3,
                icon: Rocket,
                title: language === 'tr' ? 'Satışa Başla' : 'Start Selling',
                desc: language === 'tr' ? 'Panele giriş yapın ve siparişleri almaya başlayın' : 'Log in to the panel and start receiving orders'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-orange-300 to-orange-100" />
                )}
                <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center relative hover:shadow-2xl transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
