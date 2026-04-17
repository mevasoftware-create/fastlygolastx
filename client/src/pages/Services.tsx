import { Clock, MapPin, Shield, Zap, ArrowRight, CheckCircle, Star, Search, X, Truck, Package, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { getServicesSchemas } from "@/lib/structuredData";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState, useMemo } from "react";
import { useSeoFromDatabase } from "@/hooks/useSeoFromDatabase";
import { Link } from "wouter";

// Category image map keyed by slug
const CATEGORY_IMAGES: Record<string, string> = {
  "food-delivery": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_food-bpcuKRVYanjnQoHZCcayPb.webp",
  "grocery-delivery": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_grocery-GAfHzBbxSmJN8ZYhgVSxjQ.webp",
  "pharmacy-delivery": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_pharmacy-a89kr9L8f8sTHHtB3aZKtP.webp",
  "flower-delivery": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_flower-F7jhT8u42NZKwUpKvJTEWF.webp",
  "pet-supplies": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_pet-QrHt37npK2RXL53jBJp9Rc.webp",
  "cargo-delivery": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_cargo-BVWj8R8aTKb4MhFd7NkP7W.webp",
};

const FALLBACK_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/svc_cargo-BVWj8R8aTKb4MhFd7NkP7W.webp";

// Color themes per category
const CATEGORY_THEME: Record<string, { gradient: string; accent: string; border: string; bg: string; badge: string }> = {
  "food-delivery": { gradient: "from-orange-50 to-amber-50", accent: "text-orange-500", border: "border-orange-200 hover:border-orange-300", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700" },
  "grocery-delivery": { gradient: "from-emerald-50 to-teal-50", accent: "text-emerald-500", border: "border-emerald-200 hover:border-emerald-300", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700" },
  "pharmacy-delivery": { gradient: "from-violet-50 to-indigo-50", accent: "text-violet-500", border: "border-violet-200 hover:border-violet-300", bg: "bg-violet-50", badge: "bg-violet-100 text-violet-700" },
  "flower-delivery": { gradient: "from-pink-50 to-rose-50", accent: "text-pink-500", border: "border-pink-200 hover:border-pink-300", bg: "bg-pink-50", badge: "bg-pink-100 text-pink-700" },
  "pet-supplies": { gradient: "from-yellow-50 to-amber-50", accent: "text-yellow-600", border: "border-yellow-200 hover:border-yellow-300", bg: "bg-yellow-50", badge: "bg-yellow-100 text-yellow-700" },
  "cargo-delivery": { gradient: "from-sky-50 to-blue-50", accent: "text-sky-500", border: "border-sky-200 hover:border-sky-300", bg: "bg-sky-50", badge: "bg-sky-100 text-sky-700" },
};

const DEFAULT_THEME = { gradient: "from-gray-50 to-slate-50", accent: "text-orange-500", border: "border-gray-200 hover:border-gray-300", bg: "bg-gray-50", badge: "bg-gray-100 text-gray-700" };

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
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Fetch SEO from pages table
  const { data: pageData, isLoading: isSeoLoading } = trpc.pages.getBySlug.useQuery({ slug: 'services' }, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
  });
  const dbSeo = useSeoFromDatabase(pageData?.seoMeta);

  // Fetch categories from database
  const { data: categories = [], isLoading } = trpc.categories.list.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60,
  });

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
      { threshold: 0.1 }
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
        heroTag: "Delivery Services",
        heroTitle: "Everything Delivered,",
        heroTitleAccent: "Right to Your Door",
        heroSubtitle: "From food to flowers, medicines to packages — FastlyGo delivers everything you need across Skopje in minutes.",
        orderNow: "Order Now",
        searchPlaceholder: "Search services...",
        noResults: "No services found matching your search.",
        featuresTitle: "Why Choose FastlyGo",
        fastDelivery: "Fast Delivery",
        fastDeliveryDesc: "Average 15-minute delivery in city center",
        liveTracking: "Live Tracking",
        liveTrackingDesc: "Real-time GPS tracking of your courier",
        secureDelivery: "Secure & Safe",
        secureDeliveryDesc: "Insurance protection for all deliveries",
        instantOrder: "Instant Order",
        instantOrderDesc: "Place your order in seconds",
        ctaTitle: "Ready to Order?",
        ctaSubtitle: "Join thousands of satisfied customers in Skopje",
        ctaButton: "Start Ordering Now",
        loading: "Loading services...",
        viewDetails: "View Details",
        activeCouriers: "Active Couriers",
        deliveryTime: "Avg. Delivery",
        serviceAreas: "Service Areas",
        minutes: "min",
        allServices: "All Services",
        browseAll: "Browse All",
      },
      tr: {
        heroTag: "Teslimat Hizmetleri",
        heroTitle: "Her Şey Kapınıza,",
        heroTitleAccent: "Dakikalar İçinde",
        heroSubtitle: "Yemekten çiçeğe, ilaçtan kargoya — FastlyGo, Üsküp'te ihtiyacınız olan her şeyi dakikalar içinde teslim eder.",
        orderNow: "Hemen Sipariş Ver",
        searchPlaceholder: "Hizmet ara...",
        noResults: "Aramanızla eşleşen hizmet bulunamadı.",
        featuresTitle: "Neden FastlyGo?",
        fastDelivery: "Hızlı Teslimat",
        fastDeliveryDesc: "Şehir merkezinde ortalama 15 dakika teslimat",
        liveTracking: "Canlı Takip",
        liveTrackingDesc: "Kuryenizin gerçek zamanlı GPS takibi",
        secureDelivery: "Güvenli Teslimat",
        secureDeliveryDesc: "Tüm teslimatlar için sigorta koruması",
        instantOrder: "Anında Sipariş",
        instantOrderDesc: "Siparişinizi saniyeler içinde verin",
        ctaTitle: "Sipariş Vermeye Hazır mısınız?",
        ctaSubtitle: "Üsküp'teki binlerce memnun müşteriye katılın",
        ctaButton: "Hemen Sipariş Ver",
        loading: "Hizmetler yükleniyor...",
        viewDetails: "Detayları Gör",
        activeCouriers: "Aktif Kurye",
        deliveryTime: "Ort. Teslimat",
        serviceAreas: "Hizmet Bölgesi",
        minutes: "dk",
        allServices: "Tüm Hizmetler",
        browseAll: "Tümünü Gör",
      },
      mk: {
        heroTag: "Услуги за Достава",
        heroTitle: "Сè Доставено,",
        heroTitleAccent: "До Вашата Врата",
        heroSubtitle: "Од храна до цвеќиња, лекови до пакети — FastlyGo доставува сè што ви треба низ Скопје за минути.",
        orderNow: "Нарачај Сега",
        searchPlaceholder: "Пребарај услуги...",
        noResults: "Не се пронајдени услуги.",
        featuresTitle: "Зошто FastlyGo?",
        fastDelivery: "Брза Достава",
        fastDeliveryDesc: "Просечна достава од 15 минути во центарот",
        liveTracking: "Следење во живо",
        liveTrackingDesc: "GPS следење на курирот во реално време",
        secureDelivery: "Безбедно и Сигурно",
        secureDeliveryDesc: "Осигурување за сите достави",
        instantOrder: "Моментална Нарачка",
        instantOrderDesc: "Направете нарачка за секунди",
        ctaTitle: "Подготвени да нарачате?",
        ctaSubtitle: "Придружете се на задоволните клиенти во Скопје",
        ctaButton: "Нарачај Сега",
        loading: "Се вчитуваат услугите...",
        viewDetails: "Погледни Детали",
        activeCouriers: "Активни Курири",
        deliveryTime: "Просечна Достава",
        serviceAreas: "Области на Услуга",
        minutes: "мин",
        allServices: "Сите Услуги",
        browseAll: "Прегледај Сè",
      },
      sq: {
        heroTag: "Shërbime Dorëzimi",
        heroTitle: "Çdo Gjë Dorëzohet,",
        heroTitleAccent: "Direkt në Derën Tuaj",
        heroSubtitle: "Nga ushqimi te lulet, ilaçet te paketat — FastlyGo dorëzon gjithçka që ju nevojitet nëpër Shkup brenda minutave.",
        orderNow: "Porosit Tani",
        searchPlaceholder: "Kërko shërbime...",
        noResults: "Nuk u gjetën shërbime.",
        featuresTitle: "Pse FastlyGo?",
        fastDelivery: "Dorëzim i Shpejtë",
        fastDeliveryDesc: "Mesatarisht 15 minuta dorëzim në qendër",
        liveTracking: "Gjurmim i Drejtpërdrejtë",
        liveTrackingDesc: "Gjurmim GPS në kohë reale i korrierit",
        secureDelivery: "I Sigurt dhe i Besueshëm",
        secureDeliveryDesc: "Mbrojtje sigurimesh për të gjitha dorëzimet",
        instantOrder: "Porosi e Menjëhershme",
        instantOrderDesc: "Bëni porosinë tuaj brenda sekondave",
        ctaTitle: "Gati për të Porositur?",
        ctaSubtitle: "Bashkohuni me mijëra klientë të kënaqur në Shkup",
        ctaButton: "Fillo të Porosisësh Tani",
        loading: "Po ngarkohen shërbimet...",
        viewDetails: "Shiko Detajet",
        activeCouriers: "Korrierë Aktivë",
        deliveryTime: "Dorëzim Mesatar",
        serviceAreas: "Zona Shërbimi",
        minutes: "min",
        allServices: "Të Gjitha Shërbimet",
        browseAll: "Shfleto të Gjitha",
      },
    };
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  const getCategoryName = (cat: { shortName: any }) => {
    try {
      const parsed = typeof cat.shortName === 'string' ? JSON.parse(cat.shortName) : cat.shortName;
      return parsed[lang] || parsed.en || "";
    } catch {
      return typeof cat.shortName === 'string' ? cat.shortName : "";
    }
  };

  const getCategoryDescription = (cat: { seoMeta: any }) => {
    try {
      const parsed = typeof cat.seoMeta === 'string' ? JSON.parse(cat.seoMeta) : cat.seoMeta;
      return parsed[lang]?.description || parsed.en?.description || "";
    } catch {
      return "";
    }
  };

  const getCategorySubtitle = (cat: { seoMeta: any }) => {
    try {
      const parsed = typeof cat.seoMeta === 'string' ? JSON.parse(cat.seoMeta) : cat.seoMeta;
      return parsed[lang]?.subtitle || parsed.en?.subtitle || "";
    } catch {
      return "";
    }
  };

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter((cat) => {
      const name = getCategoryName(cat).toLowerCase();
      const desc = getCategoryDescription(cat).toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  }, [categories, searchQuery, lang]);

  const features = [
    { icon: Zap, key: "fastDelivery", descKey: "fastDeliveryDesc", color: "text-orange-500", bg: "bg-orange-100" },
    { icon: MapPin, key: "liveTracking", descKey: "liveTrackingDesc", color: "text-blue-500", bg: "bg-blue-100" },
    { icon: Shield, key: "secureDelivery", descKey: "secureDeliveryDesc", color: "text-green-500", bg: "bg-green-100" },
    { icon: Clock, key: "instantOrder", descKey: "instantOrderDesc", color: "text-purple-500", bg: "bg-purple-100" },
  ];

  const stats = [
    { icon: Users, value: "53+", label: t("activeCouriers") },
    { icon: Clock, value: "15", label: t("deliveryTime"), suffix: t("minutes") },
    { icon: MapPin, value: "38+", label: t("serviceAreas") },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={isSeoLoading ? "" : dbSeo.title}
        description={isSeoLoading ? "" : dbSeo.description}
        keywords={isSeoLoading ? "" : dbSeo.keywords}
        structuredData={getServicesSchemas()}
      />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50/50 to-white pt-24 pb-20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100 rounded-full opacity-30 blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-100 rounded-full opacity-20 blur-[80px] translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-orange-50 to-amber-50 rounded-full opacity-40 blur-[120px]" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-full px-5 py-2 text-sm text-orange-600 font-medium mb-8 shadow-sm">
            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
            {t("heroTag")}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-2 leading-tight tracking-tight">
            {t("heroTitle")}
          </h1>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-orange-500 mb-6 leading-tight tracking-tight">
            {t("heroTitleAccent")}
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            {t("heroSubtitle")}
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold text-gray-900">
                    {stat.value}{stat.suffix && <span className="text-sm font-medium text-gray-500 ml-1">{stat.suffix}</span>}
                  </div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all outline-none text-base shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section ref={sectionRef} className="py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t("allServices")}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {filteredCategories.length} {t("allServices").toLowerCase()}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-3xl bg-gray-100 animate-pulse h-[420px]" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t("noResults")}</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-orange-500 hover:text-orange-600 font-medium text-sm"
              >
                {t("browseAll")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((cat, index) => {
                const slug = cat.slug;
                const image = CATEGORY_IMAGES[slug] || FALLBACK_IMAGE;
                const theme = CATEGORY_THEME[slug] || DEFAULT_THEME;
                const catFeatures = CATEGORY_FEATURES[slug]?.[lang] || CATEGORY_FEATURES[slug]?.en || [];
                const isVisible = visibleCards.has(index);
                const name = getCategoryName(cat);
                const subtitle = getCategorySubtitle(cat);

                return (
                  <div
                    key={cat.id}
                    id={slug}
                    ref={(el) => { cardRefs.current[index] = el; }}
                    data-index={index}
                    className={`group relative rounded-3xl overflow-hidden border ${theme.border} bg-white transition-all duration-700 hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                    onClick={() => setLocation(`/categories/${slug}`)}
                  >
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      {/* Emoji badge */}
                      <div className="absolute top-4 left-4 w-11 h-11 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {cat.icon}
                      </div>
                      {/* Active badge */}
                      {cat.active && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-medium text-green-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Active
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 pb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-orange-600 transition-colors">
                        {name}
                      </h3>
                      {subtitle && (
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                          {subtitle}
                        </p>
                      )}

                      {/* Features */}
                      {catFeatures.length > 0 && (
                        <ul className="space-y-2 mb-5">
                          {catFeatures.map((feature, fi) => (
                            <li key={fi} className="flex items-center gap-2.5 text-sm text-gray-600">
                              <CheckCircle className={`w-4 h-4 flex-shrink-0 ${theme.accent}`} />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* CTA */}
                      <div className={`flex items-center gap-1.5 text-sm font-semibold ${theme.accent} group-hover:gap-3 transition-all duration-300`}>
                        {t("viewDetails")}
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Why FastlyGo */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {t("featuresTitle")}
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-lg mx-auto">
            {t("heroSubtitle").split("—")[0]}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-6 md:p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">{t(feature.key)}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-10 md:p-14 shadow-2xl shadow-orange-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{t("ctaTitle")}</h2>
            <p className="text-orange-100 mb-8 text-lg">{t("ctaSubtitle")}</p>
            <button
              onClick={() => setLocation("/")}
              className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-4 rounded-full hover:bg-orange-50 transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
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
