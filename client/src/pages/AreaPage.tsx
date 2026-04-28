import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import LocalBusinessSchema from '@/components/LocalBusinessSchema';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import { MapPin, Clock, Star, Package, Bike, ArrowRight, CheckCircle, Building2, Users, Zap, Shield, Home, ShoppingBag, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSeoFromDatabase } from '@/hooks/useSeoFromDatabase';
import { useEffect } from 'react';
import { BASE_URL } from '@/const';

// Area-specific content configurations
const getAreaConfig = (slug: string, language: string) => {
  // Popular areas in Skopje
  const configs: Record<string, any> = {
    'centar': {
      icon: '🏛️',
      features: [
        { 
          icon: Clock, 
          title: language === 'tr' ? 'Süper Hızlı' : language === 'mk' ? 'Супер Брзо' : language === 'sq' ? 'Super i Shpejtë' : 'Super Fast',
          desc: language === 'tr' ? 'Merkez konumda 10 dakikada teslimat' : language === 'mk' ? 'Достава во центарот за 10 минути' : language === 'sq' ? 'Dorëzim në qendër për 10 minuta' : 'Delivery in center in 10 minutes',
          color: 'from-orange-400 to-orange-500' 
        },
        { 
          icon: Building2, 
          title: language === 'tr' ? 'İş Merkezi' : language === 'mk' ? 'Деловен Центар' : language === 'sq' ? 'Qendër Biznesi' : 'Business Center',
          desc: language === 'tr' ? 'Ofislere öncelikli teslimat' : language === 'mk' ? 'Приоритетна достава до канцеларии' : language === 'sq' ? 'Dorëzim prioritar në zyra' : 'Priority delivery to offices',
          color: 'from-blue-400 to-blue-500' 
        },
        { 
          icon: Utensils, 
          title: language === 'tr' ? 'Zengin Seçenek' : language === 'mk' ? 'Богат Избор' : language === 'sq' ? 'Zgjedhje e Pasur' : 'Rich Selection',
          desc: language === 'tr' ? '200+ restoran ve mağaza' : language === 'mk' ? '200+ ресторани и продавници' : language === 'sq' ? '200+ restorante dhe dyqane' : '200+ restaurants and stores',
          color: 'from-green-400 to-green-500' 
        },
      ],
      stats: [
        { value: '10', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '200+', label: language === 'tr' ? 'İşletme' : language === 'mk' ? 'Бизниси' : language === 'sq' ? 'Biznese' : 'Businesses' },
        { value: '50K+', label: language === 'tr' ? 'Teslimat' : language === 'mk' ? 'Достави' : language === 'sq' ? 'Dorëzime' : 'Deliveries' },
        { value: '4.9', label: '⭐' },
      ],
      landmarks: [
        { name: language === 'tr' ? 'Makedonya Meydanı' : language === 'mk' ? 'Плоштад Македонија' : language === 'sq' ? 'Sheshi i Maqedonisë' : 'Macedonia Square', emoji: '🏛️' },
        { name: language === 'tr' ? 'Taş Köprü' : language === 'mk' ? 'Камен Мост' : language === 'sq' ? 'Ura e Gurit' : 'Stone Bridge', emoji: '🌉' },
        { name: language === 'tr' ? 'Çarşı' : language === 'mk' ? 'Старата Чаршија' : language === 'sq' ? 'Çarshia e Vjetër' : 'Old Bazaar', emoji: '🕌' },
        { name: language === 'tr' ? 'Kale' : language === 'mk' ? 'Кале' : language === 'sq' ? 'Kalaja' : 'Fortress', emoji: '🏰' },
        { name: language === 'tr' ? 'Vardar' : language === 'mk' ? 'Вардар' : language === 'sq' ? 'Vardari' : 'Vardar', emoji: '🌊' },
        { name: language === 'tr' ? 'Alışveriş Merkezi' : language === 'mk' ? 'Тржен Центар' : language === 'sq' ? 'Qendra Tregtare' : 'Shopping Mall', emoji: '🏬' },
      ],
      landmarksTitle: language === 'tr' ? 'Popüler Noktalar' : language === 'mk' ? 'Популарни Локации' : language === 'sq' ? 'Vendndodhje Popullore' : 'Popular Locations'
    },
    'karpos': {
      icon: '🏘️',
      features: [
        { 
          icon: Home, 
          title: language === 'tr' ? 'Yerleşim Bölgesi' : language === 'mk' ? 'Населба' : language === 'sq' ? 'Zonë Banimi' : 'Residential Area',
          desc: language === 'tr' ? 'Evlere güvenli teslimat' : language === 'mk' ? 'Безбедна достава до домови' : language === 'sq' ? 'Dorëzim i sigurt në shtëpi' : 'Safe delivery to homes',
          color: 'from-green-400 to-green-500' 
        },
        { 
          icon: Clock, 
          title: language === 'tr' ? 'Hızlı Servis' : language === 'mk' ? 'Брз Сервис' : language === 'sq' ? 'Shërbim i Shpejtë' : 'Fast Service',
          desc: language === 'tr' ? '15 dakikada kapınızda' : language === 'mk' ? 'На врата за 15 минути' : language === 'sq' ? 'Në derë për 15 minuta' : 'At your door in 15 minutes',
          color: 'from-orange-400 to-orange-500' 
        },
        { 
          icon: ShoppingBag, 
          title: language === 'tr' ? 'Market Teslimatı' : language === 'mk' ? 'Достава од Маркет' : language === 'sq' ? 'Dorëzim nga Marketi' : 'Grocery Delivery',
          desc: language === 'tr' ? 'Günlük ihtiyaçlarınız için' : language === 'mk' ? 'За вашите секојдневни потреби' : language === 'sq' ? 'Për nevojat tuaja të përditshme' : 'For your daily needs',
          color: 'from-blue-400 to-blue-500' 
        },
      ],
      stats: [
        { value: '15', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '100+', label: language === 'tr' ? 'İşletme' : language === 'mk' ? 'Бизниси' : language === 'sq' ? 'Biznese' : 'Businesses' },
        { value: '30K+', label: language === 'tr' ? 'Teslimat' : language === 'mk' ? 'Достави' : language === 'sq' ? 'Dorëzime' : 'Deliveries' },
        { value: '4.8', label: '⭐' },
      ],
      landmarks: [
        { name: language === 'tr' ? 'Karpoş Parkı' : language === 'mk' ? 'Парк Карпош' : language === 'sq' ? 'Parku Karpos' : 'Karpos Park', emoji: '🌳' },
        { name: language === 'tr' ? 'Alışveriş Merkezi' : language === 'mk' ? 'Тржен Центар' : language === 'sq' ? 'Qendra Tregtare' : 'Shopping Center', emoji: '🏬' },
        { name: language === 'tr' ? 'Okullar' : language === 'mk' ? 'Училишта' : language === 'sq' ? 'Shkolla' : 'Schools', emoji: '🏫' },
        { name: language === 'tr' ? 'Marketler' : language === 'mk' ? 'Маркети' : language === 'sq' ? 'Markete' : 'Supermarkets', emoji: '🛒' },
        { name: language === 'tr' ? 'Restoranlar' : language === 'mk' ? 'Ресторани' : language === 'sq' ? 'Restorante' : 'Restaurants', emoji: '🍽️' },
        { name: language === 'tr' ? 'Eczaneler' : language === 'mk' ? 'Аптеки' : language === 'sq' ? 'Farmaci' : 'Pharmacies', emoji: '💊' },
      ],
      landmarksTitle: language === 'tr' ? 'Bölge Noktaları' : language === 'mk' ? 'Локации во Населба' : language === 'sq' ? 'Vendndodhje në Zonë' : 'Area Locations'
    },
    'aerodrom': {
      icon: '✈️',
      features: [
        { 
          icon: Zap, 
          title: language === 'tr' ? 'Havalimanı Bölgesi' : language === 'mk' ? 'Аеродромска Зона' : language === 'sq' ? 'Zona e Aeroportit' : 'Airport Zone',
          desc: language === 'tr' ? 'Havalimanına özel servis' : language === 'mk' ? 'Специјален сервис до аеродром' : language === 'sq' ? 'Shërbim i veçantë në aeroport' : 'Special service to airport',
          color: 'from-blue-400 to-blue-500' 
        },
        { 
          icon: Clock, 
          title: language === 'tr' ? '7/24 Hizmet' : language === 'mk' ? '24/7 Услуга' : language === 'sq' ? 'Shërbim 24/7' : '24/7 Service',
          desc: language === 'tr' ? 'Her zaman ulaşılabilir' : language === 'mk' ? 'Секогаш достапно' : language === 'sq' ? 'Gjithmonë i disponueshëm' : 'Always available',
          color: 'from-orange-400 to-orange-500' 
        },
        { 
          icon: Building2, 
          title: language === 'tr' ? 'İş & Alışveriş' : language === 'mk' ? 'Бизнис & Шопинг' : language === 'sq' ? 'Biznes & Blerje' : 'Business & Shopping',
          desc: language === 'tr' ? 'Modern bölge, zengin seçenek' : language === 'mk' ? 'Модерна зона, богат избор' : language === 'sq' ? 'Zonë moderne, zgjedhje e pasur' : 'Modern zone, rich selection',
          color: 'from-green-400 to-green-500' 
        },
      ],
      stats: [
        { value: '15', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
        { value: '150+', label: language === 'tr' ? 'İşletme' : language === 'mk' ? 'Бизниси' : language === 'sq' ? 'Biznese' : 'Businesses' },
        { value: '40K+', label: language === 'tr' ? 'Teslimat' : language === 'mk' ? 'Достави' : language === 'sq' ? 'Dorëzime' : 'Deliveries' },
        { value: '4.9', label: '⭐' },
      ],
      landmarks: [
        { name: language === 'tr' ? 'Havalimanı' : language === 'mk' ? 'Аеродром' : language === 'sq' ? 'Aeroporti' : 'Airport', emoji: '✈️' },
        { name: language === 'tr' ? 'City Mall' : language === 'mk' ? 'Сити Мол' : language === 'sq' ? 'City Mall' : 'City Mall', emoji: '🏬' },
        { name: language === 'tr' ? 'Oteller' : language === 'mk' ? 'Хотели' : language === 'sq' ? 'Hotele' : 'Hotels', emoji: '🏨' },
        { name: language === 'tr' ? 'İş Merkezleri' : language === 'mk' ? 'Деловни Центри' : language === 'sq' ? 'Qendra Biznesi' : 'Business Centers', emoji: '🏢' },
        { name: language === 'tr' ? 'Restoranlar' : language === 'mk' ? 'Ресторани' : language === 'sq' ? 'Restorante' : 'Restaurants', emoji: '🍽️' },
        { name: language === 'tr' ? 'Spor Tesisleri' : language === 'mk' ? 'Спортски Објекти' : language === 'sq' ? 'Objekte Sportive' : 'Sports Facilities', emoji: '⚽' },
      ],
      landmarksTitle: language === 'tr' ? 'Önemli Noktalar' : language === 'mk' ? 'Важни Локации' : language === 'sq' ? 'Vendndodhje të Rëndësishme' : 'Important Locations'
    },
  };

  // Default config for areas not specifically defined
  const defaultConfig = {
    icon: '📍',
    features: [
      { 
        icon: Clock, 
        title: language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery',
        desc: language === 'tr' ? 'Bölgenizde 15 dakikada' : language === 'mk' ? 'Во вашата област за 15 минути' : language === 'sq' ? 'Në zonën tuaj për 15 minuta' : 'In your area in 15 minutes',
        color: 'from-orange-400 to-orange-500' 
      },
      { 
        icon: MapPin, 
        title: language === 'tr' ? 'Yerel Hizmet' : language === 'mk' ? 'Локална Услуга' : language === 'sq' ? 'Shërbim Lokal' : 'Local Service',
        desc: language === 'tr' ? 'Bölgenizi iyi tanıyan kuryeler' : language === 'mk' ? 'Курири кои ја познаваат вашата област' : language === 'sq' ? 'Korrier që njohin zonën tuaj' : 'Couriers who know your area',
        color: 'from-blue-400 to-blue-500' 
      },
      { 
        icon: Star, 
        title: language === 'tr' ? 'Kaliteli Hizmet' : language === 'mk' ? 'Квалитетна Услуга' : language === 'sq' ? 'Shërbim Cilësor' : 'Quality Service',
        desc: language === 'tr' ? 'Profesyonel ve güvenilir' : language === 'mk' ? 'Професионално и доверливо' : language === 'sq' ? 'Profesionale dhe e besueshme' : 'Professional and reliable',
        color: 'from-green-400 to-green-500' 
      },
    ],
    stats: [
      { value: '15', label: language === 'tr' ? 'Dakika' : language === 'mk' ? 'Минути' : language === 'sq' ? 'Minuta' : 'Minutes' },
      { value: '50+', label: language === 'tr' ? 'İşletme' : language === 'mk' ? 'Бизниси' : language === 'sq' ? 'Biznese' : 'Businesses' },
      { value: '10K+', label: language === 'tr' ? 'Teslimat' : language === 'mk' ? 'Достави' : language === 'sq' ? 'Dorëzime' : 'Deliveries' },
      { value: '4.8', label: '⭐' },
    ],
    landmarks: [
      { name: language === 'tr' ? 'Restoranlar' : language === 'mk' ? 'Ресторани' : language === 'sq' ? 'Restorante' : 'Restaurants', emoji: '🍽️' },
      { name: language === 'tr' ? 'Marketler' : language === 'mk' ? 'Маркети' : language === 'sq' ? 'Markete' : 'Supermarkets', emoji: '🛒' },
      { name: language === 'tr' ? 'Eczaneler' : language === 'mk' ? 'Аптеки' : language === 'sq' ? 'Farmaci' : 'Pharmacies', emoji: '💊' },
      { name: language === 'tr' ? 'Kafeler' : language === 'mk' ? 'Кафулиња' : language === 'sq' ? 'Kafene' : 'Cafes', emoji: '☕' },
      { name: language === 'tr' ? 'Parklar' : language === 'mk' ? 'Паркови' : language === 'sq' ? 'Parqe' : 'Parks', emoji: '🌳' },
      { name: language === 'tr' ? 'Okullar' : language === 'mk' ? 'Училишта' : language === 'sq' ? 'Shkolla' : 'Schools', emoji: '🏫' },
    ],
    landmarksTitle: language === 'tr' ? 'Bölge Noktaları' : language === 'mk' ? 'Локации во Област' : language === 'sq' ? 'Vendndodhje në Zonë' : 'Area Locations'
  };

  return configs[slug] || defaultConfig;
};

export default function AreaPage() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const params = useParams();
  const slug = params.slug || '';

  // Fetch area data from backend - this is the single source of truth
  const { data: area, isLoading, error } = trpc.areas.getBySlug.useQuery({ slug }, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour to prevent refetching
  });

  // Call all hooks BEFORE any conditional returns (React Rules of Hooks)
  const seoData = useSeoFromDatabase(area?.seoMeta || '{}');

  // Redirect to 404 if area not found
  useEffect(() => {
    if (!isLoading && (!area || error)) {
      setLocation('/404');
    }
  }, [isLoading, area, error, setLocation]);

  // Prepare SEO data BEFORE conditional return (for Google bot)
  // Add lang parameter to canonical URL if language is not English
  const currentUrl = language !== 'en' 
    ? `${BASE_URL}/areas/${slug}?lang=${language}`
    : `${BASE_URL}/areas/${slug}`;
  const seoMeta = area?.seoMeta ? (typeof area.seoMeta === 'object' ? area.seoMeta as Record<string, any> : null) : null;
  const content = seoMeta ? (seoMeta[language] || seoMeta.en || {}) : {};
  const finalTitle = seoData.title || content.title || '';
  const finalDescription = seoData.description || content.description || '';

  // Don't render content until data is loaded
  if (isLoading) {
    return (
      <>
        <meta name="prerender-status-code" content="200" />
        <SEOHead 
          canonical={currentUrl}
          noindex={false}
        />
      </>
    );
  }

  // If area not found, show nothing (useEffect will redirect to 404)
  if (!area) {
    return null;
  }

  // Get static config only for features/icons (not for content)
  const config = getAreaConfig(slug, language);
  const areaName = content.name || content.title || '';
  // How it works steps
  const steps = [
    { 
      num: '01', 
      title: language === 'tr' ? 'Sipariş Oluştur' : language === 'mk' ? 'Креирај Нарачка' : language === 'sq' ? 'Krijo Porosi' : 'Create Order',
      desc: language === 'tr' ? 'Teslimat adresinizi girin' : language === 'mk' ? 'Внесете ја вашата адреса за достава' : language === 'sq' ? 'Vendosni adresën tuaj të dorëzimit' : 'Enter your delivery address'
    },
    { 
      num: '02', 
      title: language === 'tr' ? 'Kurye Geliyor' : language === 'mk' ? 'Курирот Доаѓа' : language === 'sq' ? 'Korrieri Vjen' : 'Courier Coming',
      desc: language === 'tr' ? 'Bölgenizdeki kurye yola çıkıyor' : language === 'mk' ? 'Курирот од вашата област тргнува' : language === 'sq' ? 'Korrieri nga zona juaj niset' : 'Courier from your area departs'
    },
    { 
      num: '03', 
      title: language === 'tr' ? 'Teslim Edildi' : language === 'mk' ? 'Доставено' : language === 'sq' ? 'Dorëzuar' : 'Delivered',
      desc: language === 'tr' ? 'Siparişiniz güvenle teslim edildi' : language === 'mk' ? 'Вашата нарачка безбедно е доставена' : language === 'sq' ? 'Porosia juaj është dorëzuar në mënyrë të sigurt' : 'Your order safely delivered'
    },
  ];

  return (
    <>
      <meta name="prerender-status-code" content="200" />
      {/* Always render SEOHead for Google bot */}
      <SEOHead 
        title={finalTitle}
        description={finalDescription}
        keywords={seoData.keywords}
        canonical={currentUrl}
      />
      {/* Structured Data for Google Rich Snippets */}
      <LocalBusinessSchema
        areaName={content.heading || areaName}
        areaSlug={slug}
        description={finalDescription}
        rating={config.stats?.[3]?.value ? parseFloat(config.stats[3].value) : 4.9}
        reviewCount={1250}
      />
      <BreadcrumbSchema
        areaName={content.heading || areaName}
        areaSlug={slug}
      />

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30">
        <Header />
        
        <main role="main">
          {/* Hero Section */}
          <section className="relative py-16 md:py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100/80 via-orange-50/50 to-amber-50/60" />
            <div className="absolute top-10 right-10 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl" />
            
            <div className="container relative">
              <div className="max-w-4xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-orange-100 mx-auto">
                  <span className="text-5xl">{config.icon}</span>
                </div>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-orange-600 text-sm font-medium shadow-sm">
                  <MapPin className="w-4 h-4" />
                  {content.badge || `${areaName} • ${language === 'tr' ? 'Üsküp' : language === 'mk' ? 'Скопје' : language === 'sq' ? 'Shkup' : 'Skopje'}`}
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-gray-800 leading-tight">
                  {content.heading || content.title}
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
                  {content.subtitle || content.description}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button 
                    size="lg" 
                    className="h-14 px-8 text-base font-semibold rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
                    onClick={() => setLocation('/new-order')}
                  >
                    {t('orderNow')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="h-14 px-8 text-base font-semibold rounded-2xl border-2 border-orange-200 text-orange-600 hover:bg-orange-50 transition-all duration-300"
                    onClick={() => setLocation('/how-it-works')}
                  >
                    {t('howItWorks')}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Landmarks Section */}
          {config.landmarks && (
            <section className="py-12 bg-white">
              <div className="container">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-8">
                  {config.landmarksTitle}
                </h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
                  {config.landmarks.map((landmark: any, idx: number) => (
                    <div key={idx} className="text-center p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
                      <div className="text-4xl mb-2">{landmark.emoji}</div>
                      <div className="text-sm font-medium text-gray-700">{landmark.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Features Section */}
          <section className="py-16 md:py-20 relative">
            <div className="container">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  {content.whyUsTitle || (language === 'tr' ? `${areaName} Bölgesinde Neden Biz?` : language === 'mk' ? `Зошто Ние во ${areaName}?` : language === 'sq' ? `Pse Ne në ${areaName}?` : `Why Us in ${areaName}?`)}
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {content.whyUsDescription || content.description}
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {config.features.map((feature: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-orange-100/50 hover:border-orange-200 hover:-translate-y-1"
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-16 md:py-20 bg-gradient-to-br from-orange-50/60 to-amber-50/40 relative overflow-hidden">
            <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
            
            <div className="container relative">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-sm font-medium mb-4">
                  <Clock className="w-4 h-4" />
                  {language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery'}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  {t('howItWorks')}
                </h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {steps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-orange-100/50 h-full">
                      <div className="text-5xl font-bold text-orange-200 mb-4">{step.num}</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h3>
                      <p className="text-gray-600 text-sm">{step.desc}</p>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                        <ArrowRight className="w-8 h-8 text-orange-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-12 bg-white">
            <div className="container">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {config.stats.map((stat: any, idx: number) => (
                  <div key={idx} className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50">
                    <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 md:py-20 bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            
            <div className="container relative text-center space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold">
                {language === 'tr' ? `${areaName} Bölgesinde Sipariş Verin!` : language === 'mk' ? `Нарачајте во ${areaName}!` : language === 'sq' ? `Porosisni në ${areaName}!` : `Order in ${areaName}!`}
              </h2>
              <p className="text-xl max-w-2xl mx-auto opacity-90">
                {language === 'tr' ? 'Hemen sipariş verin, 15 dakikada kapınızda!' : language === 'mk' ? 'Нарачајте сега, на врата за 15 минути!' : language === 'sq' ? 'Porosisni tani, në derë për 15 minuta!' : 'Order now, at your door in 15 minutes!'}
              </p>
              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="h-14 px-10 text-lg font-semibold rounded-2xl bg-white text-orange-600 hover:bg-orange-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
                  onClick={() => setLocation('/new-order')}
                >
                  <Package className="mr-2 h-5 w-5" />
                  {t('startOrdering')}
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
