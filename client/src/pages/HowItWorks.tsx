import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { getHowItWorksSchemas } from "@/lib/structuredData";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Zap, ArrowRight, CheckCircle2, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSeoFromDatabase } from "@/hooks/useSeoFromDatabase";

/* ─── CDN images ─────────────────────────────────────────────── */
const IMG_ORDER    = "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/hiw_step1_order-fjh3ZhjkSbVn58SrqdPQEN.webp";
const IMG_COURIER  = "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/hiw_step2_courier-HCaZBZS6vcd89mBaKfoVvk.webp";
const IMG_TRACKING = "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/hiw_step3_tracking-5XCXFugYDbR8ZQeb8kRnKt.webp";
const IMG_DONE     = "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/hiw_step4_delivered-k2oCXVxqVceXm7iGqv54pp.webp";

/* ─── Single step component (hooks at top level) ─────────────── */
function StepSection({
  step,
  index,
}: {
  step: {
    num: string;
    title: string;
    desc: string;
    tags: string[];
    img: string;
    badge1: string;
    badge2: string;
    color: string;
    lightBg: string;
    imgLeft: boolean;
  };
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      style={{ background: index % 2 === 0 ? "white" : step.lightBg }}
      className="py-16 sm:py-24"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div
          ref={ref}
          className={`grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-20 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
          style={{ direction: step.imgLeft ? "rtl" : "ltr" }}
        >
          {/* ── Text ── */}
          <div className="min-w-0 w-full" style={{ direction: "ltr" }}>
            {/* Step number row */}
            <div className="flex items-center gap-3 mb-5">
              <span
                className="text-7xl font-black leading-none select-none"
                style={{ color: step.color, opacity: 0.12 }}
              >
                {step.num}
              </span>
              <div className="w-px h-10 bg-gray-200" />
              <span
                className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: `${step.color}18`, color: step.color }}
              >
                Step {step.num}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
              {step.title}
            </h2>
            <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-6 max-w-md">
              {step.desc}
            </p>

            <div className="flex flex-wrap gap-2">
              {step.tags.map((tag, j) => (
                <span
                  key={j}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full"
                  style={{ background: `${step.color}12`, color: step.color }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* ── Image ── */}
          <div className="relative w-full" style={{ direction: "ltr" }}>
            {/* Soft glow blob */}
            <div
              className="absolute inset-0 rounded-3xl scale-110 blur-3xl opacity-30 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${step.color}60, transparent 70%)`,
              }}
            />

            {/* Photo wrapper — floating animation */}
            <div
              className="relative"
              style={{ animation: "imgFloat 5s ease-in-out infinite" }}
            >
              <img
                src={step.img}
                alt={step.title}
                loading="lazy"
                className="relative z-10 w-full h-64 sm:h-72 md:h-80 object-cover rounded-3xl"
                style={{
                  boxShadow: `0 24px 60px ${step.color}35, 0 4px 16px rgba(0,0,0,0.08)`,
                }}
              />

              {/* Badge 1 */}
              <div
                className="absolute z-20 bg-white rounded-2xl px-3 py-2 shadow-xl text-xs font-semibold text-gray-800 flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  top: "14%",
                  [step.imgLeft ? "right" : "left"]: "-14px",
                  animation: "floatBadge 3s ease-in-out infinite",
                }}
              >
                {step.badge1}
              </div>

              {/* Badge 2 */}
              <div
                className="absolute z-20 bg-white rounded-2xl px-3 py-2 shadow-xl text-xs font-semibold text-gray-800 flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  bottom: "14%",
                  [step.imgLeft ? "left" : "right"]: "-14px",
                  animation: "floatBadge2 3.5s ease-in-out infinite 0.5s",
                }}
              >
                {step.badge2}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function HowItWorks() {
  const { language } = useLanguage();
  const { data: pageData, isLoading: isSeoLoading } = trpc.pages.getBySlug.useQuery({ slug: 'how-it-works' }, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const dbSeo = useSeoFromDatabase(pageData?.seoMeta);

  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        title: "How Does Delivery System Work? | FastlyGo",
        description: "FastlyGo delivery system works in 4 simple steps: Create order, courier matching, live tracking, delivery completed.",
        heroLabel: "Simple & Fast",
        heroTitle: "Delivery in 4 steps",
        heroSub: "From placing your order to doorstep delivery — everything happens in minutes.",
        s1num: "01", s1title: "Place Your Order",
        s1desc: "Open the app or website, enter pickup and delivery addresses, choose your package size and get an instant price estimate.",
        s1t1: "Instant price", s1t2: "Multiple sizes", s1t3: "Priority options",
        s1badge1: "€2.50 estimated", s1badge2: "📦 Ready",
        s2num: "02", s2title: "Courier Assigned",
        s2desc: "Our smart algorithm instantly matches you with the nearest available professional courier. No waiting, no manual selection.",
        s2t1: "Auto-matching", s2t2: "Nearest courier", s2t3: "Verified pros",
        s2badge1: "🏍 On the way!", s2badge2: "⚡ 2 min away",
        s3num: "03", s3title: "Live Tracking",
        s3desc: "Watch your courier move on a real-time map. Get live ETA updates and push notifications at every stage.",
        s3t1: "GPS tracking", s3t2: "ETA updates", s3t3: "Push alerts",
        s3badge1: "📍 500m away", s3badge2: "ETA: 3 min",
        s4num: "04", s4title: "Delivered!",
        s4desc: "Your package arrives safely. Receive photo proof of delivery and a digital confirmation. Rate your experience.",
        s4t1: "Photo proof", s4t2: "Digital confirm", s4t3: "Rate & review",
        s4badge1: "✅ Delivered", s4badge2: "⭐ Rate us",
        whyTitle: "Why FastlyGo?",
        w1: "15-min delivery", w2: "Live GPS", w3: "Insured", w4: "24/7", w5: "Notifications", w6: "4.8★ rated",
        ctaTitle: "Ready to send something?",
        ctaSub: "Place your first order in under 60 seconds.",
        ctaBtn: "Call a Courier Now",
        stat1: "15K+", stat1l: "Deliveries",
        stat2: "5K+", stat2l: "Customers",
        stat3: "4.8★", stat3l: "Rating",
        stat4: "50+", stat4l: "Couriers",
      },
      tr: {
        title: "Teslimat Sistemi Nasıl Çalışır? | FastlyGo",
        description: "FastlyGo teslimat sistemi 4 basit adımda çalışır.",
        heroLabel: "Basit & Hızlı",
        heroTitle: "4 adımda teslimat",
        heroSub: "Siparişinizi vermekten kapınıza teslimata kadar — her şey dakikalar içinde gerçekleşir.",
        s1num: "01", s1title: "Sipariş Ver",
        s1desc: "Uygulama veya web sitesini aç, alış ve teslimat adreslerini gir, paket boyutunu seç ve anında fiyat tahmini al.",
        s1t1: "Anında fiyat", s1t2: "Çoklu boyut", s1t3: "Öncelik seçeneği",
        s1badge1: "€2.50 tahmini", s1badge2: "📦 Hazır",
        s2num: "02", s2title: "Kurye Atandı",
        s2desc: "Akıllı algoritmamız seni anında en yakın müsait profesyonel kurye ile eşleştirir. Bekleme yok, manuel seçim yok.",
        s2t1: "Otomatik eşleştirme", s2t2: "En yakın kurye", s2t3: "Doğrulanmış",
        s2badge1: "🏍 Yolda!", s2badge2: "⚡ 2 dk uzakta",
        s3num: "03", s3title: "Canlı Takip",
        s3desc: "Kuryeni gerçek zamanlı haritada izle. Teslimatın her aşamasında canlı tahmini varış ve bildirimler al.",
        s3t1: "GPS takibi", s3t2: "Varış tahmini", s3t3: "Anlık bildirim",
        s3badge1: "📍 500m uzakta", s3badge2: "ETA: 3 dk",
        s4num: "04", s4title: "Teslim Edildi!",
        s4desc: "Paketiniz güvenle ulaşır. Fotoğraflı teslimat kanıtı ve dijital onay alırsın. Deneyimini puanla.",
        s4t1: "Fotoğraf kanıtı", s4t2: "Dijital onay", s4t3: "Puanla",
        s4badge1: "✅ Teslim edildi", s4badge2: "⭐ Bizi değerlendir",
        whyTitle: "Neden FastlyGo?",
        w1: "15 dk teslimat", w2: "Canlı GPS", w3: "Sigortalı", w4: "7/24", w5: "Bildirimler", w6: "4.8★ puan",
        ctaTitle: "Bir şey göndermek ister misin?",
        ctaSub: "İlk siparişini 60 saniyeden kısa sürede ver.",
        ctaBtn: "Hemen Kurye Çağır",
        stat1: "15K+", stat1l: "Teslimat",
        stat2: "5K+", stat2l: "Müşteri",
        stat3: "4.8★", stat3l: "Puan",
        stat4: "50+", stat4l: "Kurye",
      },
      mk: {
        title: "Како Функционира Системот за Достава? | FastlyGo",
        description: "FastlyGo системот за достава работи во 4 едноставни чекори.",
        heroLabel: "Едноставно & Брзо",
        heroTitle: "Достава во 4 чекори",
        heroSub: "Од нарачката до вратата — сè се случува за минути.",
        s1num: "01", s1title: "Направи Нарачка",
        s1desc: "Отвори ја апликацијата, внеси адреси за подигнување и достава, избери големина на пакет и добиј моментална ценовна проценка.",
        s1t1: "Моментална цена", s1t2: "Повеќе големини", s1t3: "Опции за приоритет",
        s1badge1: "€2.50 проценка", s1badge2: "📦 Подготвено",
        s2num: "02", s2title: "Курирот е Доделен",
        s2desc: "Нашиот паметен алгоритам веднаш те поврзува со најблискиот достапен професионален курир.",
        s2t1: "Автоматско спојување", s2t2: "Најблизок курир", s2t3: "Верификувани",
        s2badge1: "🏍 На пат!", s2badge2: "⚡ 2 мин далеку",
        s3num: "03", s3title: "Следење во Живо",
        s3desc: "Следи го курирот на мапа во реално време. Добивај ажурирања за времето на пристигнување.",
        s3t1: "GPS следење", s3t2: "Ажурирање на ETA", s3t3: "Push известувања",
        s3badge1: "📍 500м далеку", s3badge2: "ETA: 3 мин",
        s4num: "04", s4title: "Доставено!",
        s4desc: "Пакетот пристигнува безбедно. Добивај фотографски доказ за достава и дигитална потврда.",
        s4t1: "Фотографски доказ", s4t2: "Дигитална потврда", s4t3: "Оцени",
        s4badge1: "✅ Доставено", s4badge2: "⭐ Оцени нè",
        whyTitle: "Зошто FastlyGo?",
        w1: "Достава 15 мин", w2: "GPS во живо", w3: "Осигурано", w4: "24/7", w5: "Известувања", w6: "Оценка 4.8★",
        ctaTitle: "Подготвен да испратиш нешто?",
        ctaSub: "Направи ја првата нарачка за помалку од 60 секунди.",
        ctaBtn: "Повикај Курир Сега",
        stat1: "15K+", stat1l: "Достави",
        stat2: "5K+", stat2l: "Клиенти",
        stat3: "4.8★", stat3l: "Оценка",
        stat4: "50+", stat4l: "Курири",
      },
      sq: {
        title: "Si Funksionon Sistemi i Dërgesës? | FastlyGo",
        description: "Sistemi i dërgesës FastlyGo funksionon në 4 hapa të thjeshtë.",
        heroLabel: "E Thjeshtë & E Shpejtë",
        heroTitle: "Dërgesë në 4 hapa",
        heroSub: "Nga porosia deri te dera — gjithçka ndodh brenda minutave.",
        s1num: "01", s1title: "Bëj Porosinë",
        s1desc: "Hap aplikacionin, vendos adresat e marrjes dhe dërgesës, zgjidh madhësinë e paketës dhe merr çmim të menjëhershëm.",
        s1t1: "Çmim i menjëhershëm", s1t2: "Madhësi të ndryshme", s1t3: "Opsione prioriteti",
        s1badge1: "€2.50 vlerësim", s1badge2: "📦 Gati",
        s2num: "02", s2title: "Korrierin u Caktua",
        s2desc: "Algoritmi ynë inteligjent të përputhet menjëherë me korrierin profesional më të afërt.",
        s2t1: "Përputhje automatike", s2t2: "Korrier më i afërt", s2t3: "Profesionistë",
        s2badge1: "🏍 Në rrugë!", s2badge2: "⚡ 2 min larg",
        s3num: "03", s3title: "Ndjekje në Kohë Reale",
        s3desc: "Ndiq korrierin tënd në hartë në kohë reale. Merr përditësime të ETA dhe njoftime.",
        s3t1: "Ndjekje GPS", s3t2: "Përditësim ETA", s3t3: "Njoftime Push",
        s3badge1: "📍 500m larg", s3badge2: "ETA: 3 min",
        s4num: "04", s4title: "Dorëzuar!",
        s4desc: "Paketa juaj mbërrin në mënyrë të sigurt. Merr provë fotografike të dërgesës dhe konfirmim dixhital.",
        s4t1: "Provë fotografike", s4t2: "Konfirmim dixhital", s4t3: "Vlerëso",
        s4badge1: "✅ Dorëzuar", s4badge2: "⭐ Vlerësoni",
        whyTitle: "Pse FastlyGo?",
        w1: "Dërgesë 15 min", w2: "GPS live", w3: "E siguruar", w4: "24/7", w5: "Njoftime", w6: "Vlerësim 4.8★",
        ctaTitle: "Gati të dërgosh diçka?",
        ctaSub: "Bëj porosinë tënde të parë në më pak se 60 sekonda.",
        ctaBtn: "Thirr një Korrier Tani",
        stat1: "15K+", stat1l: "Dorëzime",
        stat2: "5K+", stat2l: "Klientë",
        stat3: "4.8★", stat3l: "Vlerësim",
        stat4: "50+", stat4l: "Korrierë",
      },
    };
    return translations[language]?.[key] ?? translations.en[key] ?? key;
  };

  const steps = [
    {
      num: t("s1num"), title: t("s1title"), desc: t("s1desc"),
      tags: [t("s1t1"), t("s1t2"), t("s1t3")],
      img: IMG_ORDER, badge1: t("s1badge1"), badge2: t("s1badge2"),
      color: "#ff7a35", lightBg: "#fff7f2", imgLeft: false,
    },
    {
      num: t("s2num"), title: t("s2title"), desc: t("s2desc"),
      tags: [t("s2t1"), t("s2t2"), t("s2t3")],
      img: IMG_COURIER, badge1: t("s2badge1"), badge2: t("s2badge2"),
      color: "#7c3aed", lightBg: "#f5f3ff", imgLeft: true,
    },
    {
      num: t("s3num"), title: t("s3title"), desc: t("s3desc"),
      tags: [t("s3t1"), t("s3t2"), t("s3t3")],
      img: IMG_TRACKING, badge1: t("s3badge1"), badge2: t("s3badge2"),
      color: "#0ea5e9", lightBg: "#f0f9ff", imgLeft: false,
    },
    {
      num: t("s4num"), title: t("s4title"), desc: t("s4desc"),
      tags: [t("s4t1"), t("s4t2"), t("s4t3")],
      img: IMG_DONE, badge1: t("s4badge1"), badge2: t("s4badge2"),
      color: "#10b981", lightBg: "#f0fdf4", imgLeft: true,
    },
  ];

  const whyItems = [t("w1"), t("w2"), t("w3"), t("w4"), t("w5"), t("w6")];

  return (
    <>
      <style>{`
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes floatBadge2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-9px); }
        }
        @keyframes imgFloat {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50% { transform: translateY(-10px) rotate(0.5deg); }
        }
      `}</style>

      <div className="min-h-screen bg-white">
        <SEOHead
          title={isSeoLoading ? "" : (dbSeo.title || t("title"))}
          description={isSeoLoading ? "" : (dbSeo.description || t("description"))}
          keywords={isSeoLoading ? "" : (dbSeo.keywords || undefined)}
          structuredData={getHowItWorksSchemas()}
        />
        <Header />

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section
          className="relative pt-20 pb-24 overflow-hidden"
          style={{ background: "linear-gradient(160deg, #fff7f2 0%, #fef3ec 40%, #ffffff 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, #ffd4b8, transparent 70%)" }}
            />
            <div
              className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #fde8d8, transparent 70%)" }}
            />
          </div>

          <div className="container relative px-4 sm:px-6">
            <div className="max-w-xl mx-auto text-center">
              <span
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
                style={{ background: "#fff0e8", color: "#f55f00" }}
              >
                <Zap className="w-3 h-3 fill-current" />
                {t("heroLabel")}
              </span>

              <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-5 tracking-tight">
                {t("heroTitle")}
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed max-w-md mx-auto mb-10">
                {t("heroSub")}
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-8 sm:gap-14">
                {[
                  [t("stat1"), t("stat1l")],
                  [t("stat2"), t("stat2l")],
                  [t("stat3"), t("stat3l")],
                  [t("stat4"), t("stat4l")],
                ].map(([val, label]) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-extrabold text-gray-900">{val}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── STEPS ────────────────────────────────────────────── */}
        <section>
          {steps.map((step, i) => (
            <StepSection key={i} step={step} index={i} />
          ))}
        </section>

        {/* ── WHY FASTLYGO ─────────────────────────────────────── */}
        <section
          className="py-20"
          style={{ background: "linear-gradient(160deg, #fafafa 0%, #fff7f2 100%)" }}
        >
          <div className="container px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                {t("whyTitle")}
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
              {whyItems.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-gray-700"
                  style={{
                    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                    border: "1px solid #f3f4f6",
                  }}
                >
                  <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="py-20">
          <div className="container px-4 sm:px-6">
            <div
              className="max-w-2xl mx-auto rounded-[2.5rem] p-12 sm:p-16 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #ff7a35 0%, #f55f00 60%, #e04800 100%)",
                boxShadow: "0 8px 0 #c04000, 0 20px 60px rgba(255,107,53,0.4)",
              }}
            >
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                style={{ background: "white", transform: "translate(30%,-30%)" }}
              />
              <div
                className="absolute bottom-0 left-0 w-36 h-36 rounded-full opacity-10 pointer-events-none"
                style={{ background: "white", transform: "translate(-30%,30%)" }}
              />

              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
                  {t("ctaTitle")}
                </h2>
                <p className="text-white/75 text-base mb-8">{t("ctaSub")}</p>

                <Link href="/new-order">
                  <button
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-orange-600 transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{
                      background: "white",
                      boxShadow: "0 4px 0 rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.12)",
                    }}
                  >
                    <Zap className="w-5 h-5 fill-orange-500 text-orange-500" />
                    {t("ctaBtn")}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
