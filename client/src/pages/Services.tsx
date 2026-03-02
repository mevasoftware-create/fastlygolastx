import { Clock, MapPin, Shield, Zap, ArrowRight, CheckCircle, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { useSeoFromDatabase } from "@/hooks/useSeoFromDatabase";

// Category image map keyed by slug
const CATEGORY_IMAGES: Record<string, string> = {
  "food-delivery": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_food-bpcuKRVYanjnQoHZCcayPb.webp",
  "grocery-delivery": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_grocery-GAfHzBbxSmJN8ZYhgVSxjQ.webp",
  "pharmacy-delivery": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_pharmacy-a89kr9L8f8sTHHtB3aZKtP.webp",
  "flower-delivery": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_flower-F7jhT8u42NZKwUpKvJTEWF.webp",
  "pet-supplies": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_pet-QrHt37npK2RXL53jBJp9Rc.webp",
  "cargo-delivery": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_cargo-BVWj8R8aTKb4MhFd7NkP7W.webp",
};

// Fallback image for unknown categories
const FALLBACK_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_cargo-BVWj8R8aTKb4MhFd7NkP7W.webp";

// Pastel gradient backgrounds per category
const CATEGORY_GRADIENTS: Record<string, string> = {
  "food-delivery": "from-orange-50 to-amber-50",
  "grocery-delivery": "from-emerald-50 to-teal-50",
  "pharmacy-delivery": "from-violet-50 to-indigo-50",
  "flower-delivery": "from-pink-50 to-rose-50",
  "pet-supplies": "from-yellow-50 to-amber-50",
  "cargo-delivery": "from-sky-50 to-blue-50",
};

const CATEGORY_ACCENT: Record<string, string> = {
  "food-delivery": "text-orange-500",
  "grocery-delivery": "text-emerald-500",
  "pharmacy-delivery": "text-violet-500",
  "flower-delivery": "text-pink-500",
  "pet-supplies": "text-yellow-600",
  "cargo-delivery": "text-sky-500",
};

const CATEGORY_BORDER: Record<string, string> = {
  "food-delivery": "border-orange-200",
  "grocery-delivery": "border-emerald-200",
  "pharmacy-delivery": "border-violet-200",
  "flower-delivery": "border-pink-200",
  "pet-supplies": "border-yellow-200",
  "cargo-delivery": "border-sky-200",
};

// Category features per slug and language
const CATEGORY_FEATURES: Record<string, Record<string, string[]>> = {
  "food-delivery": {
    en: ["Restaurant pickup", "Hot food delivery", "Multiple restaurant orders"],
    tr: ["Restoran alımı", "Sıcak yemek teslimatı", "Çoklu restoran siparişi"],
    mk: ["Преземање од ресторан", "Достава на топла храна", "Нарачки од повеќе ресторани"],
    sq: ["Marrja nga restoranti", "Dorëzim ushqimi të ngrohtë", "Porosi nga shumë restorante"],
  },
  "grocery-delivery": {
    en: ["Fresh products guaranteed", "Temperature controlled", "Heavy items delivery"],
    tr: ["Taze ürün garantisi", "Sıcaklık kontrollü", "Ağır eşya teslimatı"],
    mk: ["Гаранција за свежи производи", "Контрола на температура", "Достава на тешки предмети"],
    sq: ["Garanci produktesh të freskëta", "Kontroll i temperaturës", "Dorëzim artikujsh të rëndë"],
  },
  "pharmacy-delivery": {
    en: ["Prescription medicines", "24/7 urgent delivery", "Confidential handling"],
    tr: ["Reçeteli ilaçlar", "7/24 acil teslimat", "Gizli taşıma"],
    mk: ["Лекови на рецепт", "Итна достава 24/7", "Доверлива манипулација"],
    sq: ["Ilaçe me recetë", "Dorëzim urgjent 24/7", "Trajtim konfidencial"],
  },
  "flower-delivery": {
    en: ["Same-day delivery", "Fresh flowers guaranteed", "Special packaging"],
    tr: ["Aynı gün teslimat", "Taze çiçek garantisi", "Özel paketleme"],
    mk: ["Достава истиот ден", "Гаранција за свежи цвеќиња", "Специјално пакување"],
    sq: ["Dorëzim të njëjtën ditë", "Garanci lulesh të freskëta", "Paketim special"],
  },
  "pet-supplies": {
    en: ["All pet types", "Food & accessories", "Fast delivery"],
    tr: ["Tüm evcil hayvanlar", "Mama ve aksesuar", "Hızlı teslimat"],
    mk: ["Сите видови миленици", "Храна и додатоци", "Брза достава"],
    sq: ["Të gjitha llojet e kafshëve", "Ushqim dhe aksesorë", "Dorëzim i shpejtë"],
  },
  "cargo-delivery": {
    en: ["Secure packaging", "Insurance included", "All sizes accepted"],
    tr: ["Güvenli paketleme", "Sigorta dahil", "Her boyut kabul edilir"],
    mk: ["Безбедно пакување", "Вклучено осигурување", "Прифаќаат се сите големини"],
    sq: ["Paketim i sigurt", "Sigurimi i përfshirë", "Pranohen të gjitha madhësitë"],
  },
};

export default function Services() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch SEO from pages table
  const { data: pageData } = trpc.pages.getBySlug.useQuery({ slug: 'services' }, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const dbSeo = useSeoFromDatabase(pageData?.seoMeta);
  // Fetch categories from database
  const { data: categories = [], isLoading } = trpc.categories.list.useQuery();
  // Intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute("data-index") || "0");
            setVisibleCards((prev) => { const next = new Set(prev); next.add(index); return next; });
          }
        });
      },
      { threshold: 0.15 }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [categories]);

  const lang = language as "en" | "tr" | "mk" | "sq";

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        heroTag: "All Services",
        heroTitle: "Everything Delivered,",
        heroTitleAccent: "Right to Your Door",
        heroSubtitle: "From food to flowers, medicines to packages — FastlyGo delivers everything you need across Skopje in minutes.",
        orderNow: "Order Now",
        learnMore: "Learn More",
        featuresTitle: "Why Choose FastlyGo",
        fastDelivery: "Fast Delivery",
        fastDeliveryDesc: "Average 15-minute delivery in city center",
        liveTracking: "Live Tracking",
        liveTrackingDesc: "Real-time GPS tracking of your courier",
        secureDelivery: "Secure & Safe",
        secureDeliveryDesc: "Insurance protection for all deliveries",
        instantOrder: "Instant Order",
        instantOrderDesc: "Place your order in seconds",
        serviceAreas: "Service Areas",
        serviceAreasDesc: "We deliver across all neighborhoods in Skopje",
        ctaTitle: "Ready to Order?",
        ctaSubtitle: "Join thousands of satisfied customers in Skopje",
        ctaButton: "Start Ordering Now",
        loading: "Loading services...",
        includes: "Includes",
      },
      tr: {
        heroTag: "Tüm Hizmetler",
        heroTitle: "Her Şey Kapınıza,",
        heroTitleAccent: "Dakikalar İçinde",
        heroSubtitle: "Yemekten çiçeğe, ilaçtan kargoya — FastlyGo, Üsküp'te ihtiyacınız olan her şeyi dakikalar içinde teslim eder.",
        orderNow: "Hemen Sipariş Ver",
        learnMore: "Daha Fazla",
        featuresTitle: "Neden FastlyGo",
        fastDelivery: "Hızlı Teslimat",
        fastDeliveryDesc: "Şehir merkezinde ortalama 15 dakika teslimat",
        liveTracking: "Canlı Takip",
        liveTrackingDesc: "Kuryenizin gerçek zamanlı GPS takibi",
        secureDelivery: "Güvenli ve Emin",
        secureDeliveryDesc: "Tüm teslimatlar için sigorta koruması",
        instantOrder: "Anında Sipariş",
        instantOrderDesc: "Siparişinizi saniyeler içinde verin",
        serviceAreas: "Hizmet Bölgeleri",
        serviceAreasDesc: "Üsküp'ün tüm mahallelerine teslimat yapıyoruz",
        ctaTitle: "Sipariş Vermeye Hazır mısınız?",
        ctaSubtitle: "Üsküp'teki binlerce memnun müşteriye katılın",
        ctaButton: "Hemen Sipariş Ver",
        loading: "Hizmetler yükleniyor...",
        includes: "İçerir",
      },
      mk: {
        heroTag: "Сите Услуги",
        heroTitle: "Сè Доставено,",
        heroTitleAccent: "До Вашата Врата",
        heroSubtitle: "Од храна до цвеќиња, лекови до пакети — FastlyGo доставува сè што ви треба низ Скопје за минути.",
        orderNow: "Нарачај Сега",
        learnMore: "Дознај Повеќе",
        featuresTitle: "Зошто FastlyGo",
        fastDelivery: "Брза Достава",
        fastDeliveryDesc: "Просечна достава од 15 минути во центарот на градот",
        liveTracking: "Следење во живо",
        liveTrackingDesc: "GPS следење на вашиот курир во реално време",
        secureDelivery: "Безбедно и Сигурно",
        secureDeliveryDesc: "Осигурување за сите достави",
        instantOrder: "Моментална Нарачка",
        instantOrderDesc: "Направете нарачка за секунди",
        serviceAreas: "Области на Услуга",
        serviceAreasDesc: "Доставуваме низ сите маала во Скопје",
        ctaTitle: "Подготвени да нарачате?",
        ctaSubtitle: "Придружете се на илјадниците задоволни клиенти во Скопје",
        ctaButton: "Нарачај Сега",
        loading: "Се вчитуваат услугите...",
        includes: "Вклучува",
      },
      sq: {
        heroTag: "Të Gjitha Shërbimet",
        heroTitle: "Çdo Gjë Dorëzohet,",
        heroTitleAccent: "Direkt në Derën Tuaj",
        heroSubtitle: "Nga ushqimi te lulet, ilaçet te paketat — FastlyGo dorëzon gjithçka që ju nevojitet nëpër Shkup brenda minutave.",
        orderNow: "Porosit Tani",
        learnMore: "Mëso Më Shumë",
        featuresTitle: "Pse FastlyGo",
        fastDelivery: "Dorëzim i Shpejtë",
        fastDeliveryDesc: "Mesatarisht 15 minuta dorëzim në qendër të qytetit",
        liveTracking: "Gjurmim i Drejtpërdrejtë",
        liveTrackingDesc: "Gjurmim GPS në kohë reale i korrierin tuaj",
        secureDelivery: "I Sigurt dhe i Besueshëm",
        secureDeliveryDesc: "Mbrojtje sigurimesh për të gjitha dorëzimet",
        instantOrder: "Porosi e Menjëhershme",
        instantOrderDesc: "Bëni porosinë tuaj brenda sekondave",
        serviceAreas: "Zonat e Shërbimit",
        serviceAreasDesc: "Dorëzojmë në të gjitha lagjet e Shkupit",
        ctaTitle: "Gati për të Porositur?",
        ctaSubtitle: "Bashkohuni me mijëra klientë të kënaqur në Shkup",
        ctaButton: "Fillo të Porosisësh Tani",
        loading: "Po ngarkohen shërbimet...",
        includes: "Përfshin",
      },
    };
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  const getCategoryName = (cat: { shortName: string }) => {
    try {
      const parsed = JSON.parse(cat.shortName);
      return parsed[lang] || parsed.en || "";
    } catch {
      return cat.shortName;
    }
  };

  const getCategoryDescription = (cat: { seoMeta: string }) => {
    try {
      const parsed = JSON.parse(cat.seoMeta);
      return parsed[lang]?.description || parsed.en?.description || "";
    } catch {
      return "";
    }
  };

  const getCategorySubtitle = (cat: { seoMeta: string }) => {
    try {
      const parsed = JSON.parse(cat.seoMeta);
      return parsed[lang]?.subtitle || parsed.en?.subtitle || "";
    } catch {
      return "";
    }
  };

  const features = [
    { icon: Zap, key: "fastDelivery", descKey: "fastDeliveryDesc", color: "text-orange-500", bg: "bg-orange-50" },
    { icon: MapPin, key: "liveTracking", descKey: "liveTrackingDesc", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Shield, key: "secureDelivery", descKey: "secureDeliveryDesc", color: "text-green-500", bg: "bg-green-50" },
    { icon: Clock, key: "instantOrder", descKey: "instantOrderDesc", color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={dbSeo.title || t("heroTag") + " - FastlyGo"}
        description={dbSeo.description || t("heroSubtitle")}
        keywords={dbSeo.keywords || "delivery services skopje, courier services, FastlyGo"}
      />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-white pt-24 pb-16">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full opacity-40 blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-100 rounded-full opacity-30 blur-2xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-full px-4 py-1.5 text-sm text-orange-600 font-medium mb-6 shadow-sm">
            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
            {t("heroTag")}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-3 leading-tight">
            {t("heroTitle")}
          </h1>
          <h1 className="text-4xl md:text-6xl font-bold text-orange-500 mb-6 leading-tight">
            {t("heroTitleAccent")}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            {t("heroSubtitle")}
          </p>
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Zap className="w-5 h-5" />
            {t("orderNow")}
          </button>
        </div>
      </section>

      {/* Services Grid - from database */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-3xl bg-gray-100 animate-pulse h-80" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, index) => {
              const slug = cat.slug;
              const image = CATEGORY_IMAGES[slug] || FALLBACK_IMAGE;
              const gradient = CATEGORY_GRADIENTS[slug] || "from-gray-50 to-slate-50";
              const accent = CATEGORY_ACCENT[slug] || "text-orange-500";
              const border = CATEGORY_BORDER[slug] || "border-gray-200";
              const features = CATEGORY_FEATURES[slug]?.[lang] || CATEGORY_FEATURES[slug]?.en || [];
              const isVisible = visibleCards.has(index);

              return (
                <div
                  key={cat.id}
                  ref={(el) => { cardRefs.current[index] = el; }}
                  data-index={index}
                  className={`group relative rounded-3xl overflow-hidden border ${border} bg-gradient-to-br ${gradient} transition-all duration-700 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 80}ms` }}
                  onClick={() => setLocation(`/categories/${slug}`)}
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={image}
                      alt={getCategoryName(cat)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Soft gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    {/* Emoji badge */}
                    <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center text-xl shadow-sm">
                      {cat.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className={`text-lg font-bold text-gray-900 mb-1`}>
                      {getCategoryName(cat)}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {getCategorySubtitle(cat)}
                    </p>

                    {/* Features */}
                    {features.length > 0 && (
                      <ul className="space-y-1.5 mb-4">
                        {features.map((feature, fi) => (
                          <li key={fi} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className={`w-4 h-4 flex-shrink-0 ${accent}`} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* CTA */}
                    <div className={`flex items-center gap-1 text-sm font-semibold ${accent} group-hover:gap-2 transition-all`}>
                      {t("orderNow")}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Why FastlyGo - Feature Pills */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-orange-50/30">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t("featuresTitle")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${feature.bg} rounded-2xl flex items-center justify-center mb-3`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{t(feature.key)}</h3>
                <p className="text-xs text-gray-500">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-12 shadow-2xl shadow-orange-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{t("ctaTitle")}</h2>
            <p className="text-orange-100 mb-8">{t("ctaSubtitle")}</p>
            <button
              onClick={() => setLocation("/")}
              className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-3.5 rounded-full hover:bg-orange-50 transition-all shadow-lg hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5" />
              {t("ctaButton")}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
