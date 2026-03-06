import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Clock, ArrowRight, Zap, Package, Utensils, Timer, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSeoFromDatabase } from '@/hooks/useSeoFromDatabase';
import { BASE_URL } from '@/const';

export default function FoodDeliveryPage() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: category } = trpc.categories.getBySlug.useQuery({ slug: 'food-delivery' }, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const translations = category?.seoMeta ? (typeof category.seoMeta === 'string' ? JSON.parse(category.seoMeta) : category.seoMeta as Record<string, any>) : {};
  const content = translations[language] || translations.en || {};
  const seoData = useSeoFromDatabase(category?.seoMeta);

  // Add lang parameter to canonical URL if language is not English
  const currentUrl = language !== 'en' 
    ? `${BASE_URL}/categories/food-delivery?lang=${language}`
    : `${BASE_URL}/categories/food-delivery`;

  // Food delivery specific features
  const features = [
    { 
      icon: Timer, 
      title: language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery',
      desc: language === 'tr' ? 'Yemeğiniz 15 dakikada kapınızda' : language === 'mk' ? 'Вашата храна на врата за 15 минути' : language === 'sq' ? 'Ushqimi juaj në derë për 15 minuta' : 'Your food at your door in 15 minutes',
      color: 'from-orange-400 to-orange-500' 
    },
    { 
      icon: Utensils, 
      title: language === 'tr' ? 'Geniş Restoran Seçeneği' : language === 'mk' ? 'Широк Избор на Ресторани' : language === 'sq' ? 'Zgjedhje e Gjerë e Restoranteve' : 'Wide Restaurant Selection',
      desc: language === 'tr' ? 'Yüzlerce restorandan seçim yapın' : language === 'mk' ? 'Изберете од стотици ресторани' : language === 'sq' ? 'Zgjidhni nga qindra restorante' : 'Choose from hundreds of restaurants',
      color: 'from-blue-400 to-blue-500' 
    },
    { 
      icon: ThumbsUp, 
      title: language === 'tr' ? 'Taze ve Sıcak' : language === 'mk' ? 'Свежо и Топло' : language === 'sq' ? 'E Freskët dhe e Ngrohtë' : 'Fresh and Hot',
      desc: language === 'tr' ? 'Yemeğiniz her zaman taze ve sıcak' : language === 'mk' ? 'Вашата храна секогаш свежа и топла' : language === 'sq' ? 'Ushqimi juaj gjithmonë i freskët dhe i ngrohtë' : 'Your food always fresh and hot',
      color: 'from-green-400 to-green-500' 
    },
  ];

  // Popular cuisines
  const cuisines = [
    { name: language === 'tr' ? 'Pizza' : 'Pizza', emoji: '🍕' },
    { name: language === 'tr' ? 'Burger' : 'Burger', emoji: '🍔' },
    { name: language === 'tr' ? 'Sushi' : 'Sushi', emoji: '🍣' },
    { name: language === 'tr' ? 'Kebap' : language === 'mk' ? 'Кебап' : language === 'sq' ? 'Qebap' : 'Kebab', emoji: '🥙' },
    { name: language === 'tr' ? 'Tatlı' : language === 'mk' ? 'Десерт' : language === 'sq' ? 'Ëmbëlsirë' : 'Dessert', emoji: '🍰' },
    { name: language === 'tr' ? 'Kahve' : language === 'mk' ? 'Кафе' : language === 'sq' ? 'Kafe' : 'Coffee', emoji: '☕' },
  ];

  // How it works steps
  const steps = [
    { 
      num: '01', 
      title: language === 'tr' ? 'Restoran Seçin' : language === 'mk' ? 'Изберете Ресторан' : language === 'sq' ? 'Zgjidhni Restorantin' : 'Choose Restaurant',
      desc: language === 'tr' ? 'Favori restoranınızı bulun ve menüye göz atın' : language === 'mk' ? 'Најдете го вашиот омилен ресторан и прелистајте го менито' : language === 'sq' ? 'Gjeni restorantin tuaj të preferuar dhe shfletoni menunë' : 'Find your favorite restaurant and browse the menu'
    },
    { 
      num: '02', 
      title: language === 'tr' ? 'Sipariş Verin' : language === 'mk' ? 'Нарачајте' : language === 'sq' ? 'Porosisni' : 'Place Order',
      desc: language === 'tr' ? 'Yemeklerinizi seçin ve siparişi tamamlayın' : language === 'mk' ? 'Изберете ги вашите јадења и завршете ја нарачката' : language === 'sq' ? 'Zgjidhni ushqimet tuaja dhe përfundoni porosinë' : 'Select your meals and complete the order'
    },
    { 
      num: '03', 
      title: language === 'tr' ? 'Kapınızda' : language === 'mk' ? 'На Врата' : language === 'sq' ? 'Në Derë' : 'At Your Door',
      desc: language === 'tr' ? 'Kurye yemeğinizi 15 dakikada teslim eder' : language === 'mk' ? 'Курирот ја доставува вашата храна за 15 минути' : language === 'sq' ? 'Korrieri e dorëzon ushqimin tuaj për 15 minuta' : 'Courier delivers your food in 15 minutes'
    },
  ];

  return (
    <>
      <meta name="prerender-status-code" content="200" />
      <SEOHead 
        title={seoData.title || content.title || 'Food Delivery Skopje'}
        description={seoData.description || content.description || 'Fast food delivery service in Skopje'}
        keywords={seoData.keywords}
        canonical={currentUrl}
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
                  <span className="text-5xl">🍔</span>
                </div>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-orange-600 text-sm font-medium shadow-sm">
                  <Zap className="w-4 h-4" />
                  {language === 'tr' ? 'Hızlı Teslimat' : language === 'mk' ? 'Брза Достава' : language === 'sq' ? 'Dorëzim i Shpejtë' : 'Fast Delivery'} • 15 {t('minutes')}
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-gray-800 leading-tight">
                  {content.title || (language === 'tr' ? 'Yemek Siparişi' : language === 'mk' ? 'Нарачка на Храна' : language === 'sq' ? 'Porosi Ushqimi' : 'Food Delivery')}
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
                  {content.subtitle || (language === 'tr' ? 'Üsküp\'te en hızlı yemek teslimat hizmeti. Favori restoranlarınızdan sipariş verin, 15 dakikada kapınızda.' : language === 'mk' ? 'Најбрзата услуга за достава на храна во Скопје. Нарачајте од вашите омилени ресторани, на врата за 15 минути.' : language === 'sq' ? 'Shërbimi më i shpejtë i dorëzimit të ushqimit në Shkup. Porosisni nga restorantet tuaja të preferuara, në derë për 15 minuta.' : 'Fastest food delivery service in Skopje. Order from your favorite restaurants, at your door in 15 minutes.')}
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

          {/* Popular Cuisines */}
          <section className="py-12 bg-white">
            <div className="container">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-8">
                {language === 'tr' ? 'Popüler Mutfaklar' : language === 'mk' ? 'Популарни Кујни' : language === 'sq' ? 'Kuzhinat Popullore' : 'Popular Cuisines'}
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
                {cuisines.map((cuisine, idx) => (
                  <div key={idx} className="text-center p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
                    <div className="text-4xl mb-2">{cuisine.emoji}</div>
                    <div className="text-sm font-medium text-gray-700">{cuisine.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 md:py-20 relative">
            <div className="container">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  {t('whyChooseUs')}
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {content.description || (language === 'tr' ? 'Üsküp\'te en iyi yemek teslimat deneyimini sunuyoruz' : language === 'mk' ? 'Нудиме најдобро искуство за достава на храна во Скопје' : language === 'sq' ? 'Ofrojmë përvojën më të mirë të dorëzimit të ushqimit në Shkup' : 'We offer the best food delivery experience in Skopje')}
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {features.map((feature, idx) => (
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
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50">
                  <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">500+</div>
                  <div className="text-sm text-gray-600">{language === 'tr' ? 'Restoran' : language === 'mk' ? 'Ресторани' : language === 'sq' ? 'Restorante' : 'Restaurants'}</div>
                </div>
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50">
                  <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">15</div>
                  <div className="text-sm text-gray-600">{t('minutes')}</div>
                </div>
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50">
                  <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">50K+</div>
                  <div className="text-sm text-gray-600">{t('deliveries')}</div>
                </div>
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50">
                  <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">4.9</div>
                  <div className="text-sm text-gray-600">⭐</div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 md:py-20 bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            
            <div className="container relative text-center space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold">{t('readyToOrder')}</h2>
              <p className="text-xl max-w-2xl mx-auto opacity-90">
                {language === 'tr' ? 'Favori restoranınızdan sipariş verin, 15 dakikada kapınızda!' : language === 'mk' ? 'Нарачајте од вашиот омилен ресторан, на врата за 15 минути!' : language === 'sq' ? 'Porosisni nga restoranti juaj i preferuar, në derë për 15 minuta!' : 'Order from your favorite restaurant, at your door in 15 minutes!'}
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
