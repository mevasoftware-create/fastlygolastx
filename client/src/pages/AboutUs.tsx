import { t } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { getAboutUsSchemas } from '@/lib/structuredData';
import { Users, Zap, Target, Heart, TrendingUp, MapPin, Bike, Package, Shield, Star, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useSeoFromDatabase } from '@/hooks/useSeoFromDatabase';

export default function AboutUs() {
  const { language } = useLanguage();

  const { data: pageData, isLoading: isSeoLoading } = trpc.pages.getBySlug.useQuery({ slug: 'about-us' }, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const seoData = useSeoFromDatabase(pageData?.seoMeta);

  const structuredData = getAboutUsSchemas();

  const l = (tr: string, mk: string, en: string) =>
    language === 'tr' ? tr : language === 'mk' ? mk : en;

  const stats = [
    { value: '50+', label: l('Aktif Kurye', 'Активни Курири', 'Active Couriers'), color: 'text-orange-500' },
    { value: '20K+', label: l('Teslimat', 'Достави', 'Deliveries'), color: 'text-amber-500' },
    { value: '4.9', label: l('Müşteri Puanı', 'Оценка', 'Customer Rating'), color: 'text-green-500' },
    { value: '15dk', label: l('Ort. Süre', 'Просечно', 'Avg. Time'), color: 'text-blue-500' },
  ];

  const values = [
    {
      icon: Zap,
      title: l('Hız', 'Брзина', 'Speed'),
      desc: l('15 dakika ortalama teslimat süresi ile Üsküp\'ün en hızlı kurye servisi.', 'Просечно 15 минути за достава низ Скопје.', '15-minute average delivery across Skopje.'),
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-500',
    },
    {
      icon: Shield,
      title: l('Güvenilirlik', 'Доверливост', 'Reliability'),
      desc: l('Her teslimat sigortalı, her kurye doğrulanmış. Güvenli teslimat garantisi.', 'Секоја достава е осигурена, секој курир верификуван.', 'Every delivery insured, every courier verified.'),
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
    },
    {
      icon: Heart,
      title: l('Müşteri Odaklılık', 'Клиент Прво', 'Customer First'),
      desc: l('7/24 destek, gerçek zamanlı takip ve memnuniyet garantisi.', '7/24 поддршка и следење во реално време.', '24/7 support, real-time tracking, satisfaction guaranteed.'),
      bg: 'bg-rose-50',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-500',
    },
    {
      icon: TrendingUp,
      title: l('İnovasyon', 'Иновација', 'Innovation'),
      desc: l('Teknoloji destekli rota optimizasyonu ve canlı takip sistemi.', 'Технолошка оптимизација на рути и систем за следење.', 'Tech-powered route optimization and live tracking.'),
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-500',
    },
  ];

  const milestones = [
    {
      year: '2024',
      title: l('Kuruluş', 'Основање', 'Founded'),
      desc: l('FastlyGo, Üsküp\'te kuruldu. İlk kuryelerimizle yolculuğumuza başladık.', 'FastlyGo е основан во Скопје.', 'FastlyGo was founded in Skopje.'),
    },
    {
      year: '2024',
      title: l('İlk 1.000 Teslimat', 'Први 1.000 Достави', 'First 1,000 Deliveries'),
      desc: l('İlk ayda 1.000 başarılı teslimatı tamamladık.', 'Завршени 1.000 достави во првиот месец.', 'Completed 1,000 successful deliveries in the first month.'),
    },
    {
      year: '2025',
      title: l('Tüm Üsküp\'e Genişleme', 'Проширување низ Скопје', 'City-Wide Expansion'),
      desc: l('Tüm Üsküp ilçelerine hizmet vermeye başladık.', 'Услугата е проширена низ цело Скопје.', 'Expanded service across all districts of Skopje.'),
    },
  ];

  return (
    <>
      <SEOHead
        title={isSeoLoading ? "" : seoData.title}
        description={isSeoLoading ? "" : seoData.description}
        keywords={isSeoLoading ? "" : seoData.keywords}
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col bg-white">
        <Header />

        {/* ── Hero ── */}
        <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50/40 to-white">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100/40 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-orange-600 text-sm font-semibold shadow-sm border border-orange-100">
                <Heart className="w-4 h-4 fill-orange-400 text-orange-400" />
                FastlyGo — Skopje
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                {t('aboutUsTitle', language)}
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
                {t('aboutUsSubtitle', language)}
              </p>

              <div className="flex flex-wrap justify-center gap-10 pt-4">
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Our Story ── */}
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-orange-100/60 to-amber-100/40 rounded-[2.5rem] blur-2xl" />
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/about_mission-5fRnEYq2DDyTLyXvGGL3i5.webp"
                  alt="FastlyGo Story"
                  className="relative rounded-3xl w-full h-auto object-cover shadow-xl"
                />
                <div className="absolute -bottom-5 -right-5 bg-white rounded-2xl px-5 py-4 shadow-xl border border-orange-100 flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-white fill-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-800 leading-none">4.9</div>
                    <div className="text-xs text-gray-400 mt-0.5">{l('Müşteri Puanı', 'Оценка', 'Customer Rating')}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 text-sm font-semibold">
                  <Heart className="w-4 h-4" />
                  {t('ourStory', language)}
                </div>
                <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">
                  {t('ourStoryTitle', language)}
                </h2>
                <div className="space-y-4 text-gray-500 leading-relaxed text-lg">
                  <p>{t('ourStoryDesc1', language)}</p>
                  <p>{t('ourStoryDesc2', language)}</p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  {[
                    l('Profesyonel ve doğrulanmış kuryeler', 'Професионални и верификувани курири', 'Professional, verified couriers'),
                    l('Gerçek zamanlı GPS takibi', 'Следење во реално време', 'Real-time GPS tracking'),
                    l('Sigortalı teslimat garantisi', 'Осигурена достава', 'Insured delivery guarantee'),
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      <span className="text-gray-600 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="py-20 bg-gradient-to-br from-orange-50/60 to-amber-50/30">
          <div className="container">
            <div className="text-center mb-14 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-orange-600 text-sm font-semibold shadow-sm border border-orange-100">
                <Target className="w-4 h-4" />
                {t('ourValues', language)}
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900">
                {l('Bizi Farklı Kılan Değerler', 'Вредности кои не издвојуваат', 'What Sets Us Apart')}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {values.map((v, i) => (
                <div key={i} className={`${v.bg} rounded-3xl p-7 space-y-4 hover:scale-[1.02] transition-transform duration-300`}>
                  <div className={`w-12 h-12 ${v.iconBg} rounded-2xl flex items-center justify-center`}>
                    <v.icon className={`w-6 h-6 ${v.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team ── */}
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div className="space-y-6 order-2 md:order-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 text-sm font-semibold">
                  <Users className="w-4 h-4" />
                  {t('ourTeam', language)}
                </div>
                <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">
                  {t('ourTeam', language)}
                </h2>
                <p className="text-lg text-gray-500 leading-relaxed">
                  {t('ourTeamDesc', language)}
                </p>
                <div className="space-y-4 pt-2">
                  {[
                    { icon: Bike, title: l('Profesyonel Kuryeler', 'Професионални Курири', 'Professional Couriers'), sub: l('Deneyimli ve güvenilir', 'Искусни и доверливи', 'Experienced and reliable'), bg: 'bg-orange-50', color: 'text-orange-500' },
                    { icon: Shield, title: l('Güvenli Teslimat', 'Безбедна Достава', 'Safe Delivery'), sub: l('Sigortalı paketler', 'Осигурени пакети', 'Insured packages'), bg: 'bg-blue-50', color: 'text-blue-500' },
                    { icon: Package, title: l('Özenli Taşıma', 'Внимателно Ракување', 'Careful Handling'), sub: l('Her paket özel', 'Секој пакет е специјален', 'Every package is special'), bg: 'bg-green-50', color: 'text-green-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-11 h-11 ${item.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{item.title}</div>
                        <div className="text-sm text-gray-400">{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative order-1 md:order-2">
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-100/50 to-orange-100/30 rounded-[2.5rem] blur-2xl" />
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/about_team-ZPnwipWUXwxVLiDYwTqLz2.webp"
                  alt="FastlyGo Team"
                  className="relative rounded-3xl w-full h-auto object-cover shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Timeline ── */}
        <section className="py-20 bg-gradient-to-br from-orange-50/40 to-white">
          <div className="container">
            <div className="text-center mb-14 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-orange-600 text-sm font-semibold shadow-sm border border-orange-100">
                <TrendingUp className="w-4 h-4" />
                {l('Yolculuğumuz', 'Нашето Патување', 'Our Journey')}
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900">
                {l('Kilometre Taşları', 'Пресвртници', 'Milestones')}
              </h2>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="relative pl-10 space-y-10">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-orange-300 via-orange-200 to-transparent" />
                {milestones.map((m, i) => (
                  <div key={i} className="relative flex gap-6 items-start">
                    <div className="absolute -left-10 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="text-orange-500 font-bold text-sm">{m.year}</div>
                      <h3 className="text-xl font-bold text-gray-800">{m.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-20 bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-white">
          <div className="container">
            <div className="text-center mb-14 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-orange-600 text-sm font-semibold shadow-sm border border-orange-100">
                <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                {l('Gerçek Hikayeler', 'Вистински Приказни', 'Real Stories')}
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900">
                {l('Müşterilerimiz Ne Diyor?', 'Што Велат Нашите Клиенти?', 'What Our Customers Say')}
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                {l('FastlyGo\'ya güvenen gerçek insanlardan gerçek hikayeler', 'Вистински приказни од луѓе кои веруваат на FastlyGo', 'Real stories from real people who trust FastlyGo')}
              </p>
            </div>

            {/* Masonry testimonial grid */}
            <div className="max-w-6xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {[
                {
                  name: 'Elena Dimitrova',
                  role: l('Eczane Sahibi', 'Сопственик на Аптека', 'Pharmacy Owner'),
                  avatar: 'ED',
                  avatarBg: 'bg-violet-100',
                  avatarColor: 'text-violet-600',
                  rating: 5,
                  text: l(
                    '"İlaç teslimatlarımız için FastlyGo\'yu kullanıyoruz. Güvenilir, hızlı ve her zaman zamanında. Müşterilerimiz çok memnun!"',
                    '"Ги користиме FastlyGo за достава на лекови. Доверливи, брзи и секогаш навреме."',
                    '"We use FastlyGo for our medicine deliveries. Reliable, fast, and always on time. Our customers love it!"'
                  ),
                  accent: 'border-violet-200',
                },
                {
                  name: 'Marko Petrovski',
                  role: l('Restoran Yöneticisi', 'Менаџер на Ресторан', 'Restaurant Manager'),
                  avatar: 'MP',
                  avatarBg: 'bg-orange-100',
                  avatarColor: 'text-orange-600',
                  rating: 5,
                  text: l(
                    '"Müşterilerimize hızlı teslimat yapabiliyoruz. Kuryeleri gerçek zamanlı takip edebilmek harika! FastlyGo olmadan düşünemiyorum."',
                    '"Можеме да испорачаме брзо на нашите клиенти. Следењето во реално е одлично!"',
                    '"We can deliver fast to our customers. Real-time tracking is amazing! Can\'t imagine without FastlyGo."'
                  ),
                  accent: 'border-orange-200',
                },
                {
                  name: 'Stefan Nikolov',
                  role: l('E-ticaret Satıcısı', 'Онлајн Продавач', 'E-commerce Seller'),
                  avatar: 'SN',
                  avatarBg: 'bg-sky-100',
                  avatarColor: 'text-sky-600',
                  rating: 5,
                  text: l(
                    '"Paket teslimatlarım için en iyi çözüm. Fiyatlar uygun ve servis kaliteli. Kesinlikle tavsiye ederim."',
                    '"Најдобро решение за достава на пакети. Цените се разумни и услугата е квалитетна."',
                    '"Best solution for my package deliveries. Prices are fair and service quality is excellent."'
                  ),
                  accent: 'border-sky-200',
                },
                {
                  name: 'Ana Jovanovska',
                  role: l('Kurye Partner', 'Курир Партнер', 'Courier Partner'),
                  avatar: 'AJ',
                  avatarBg: 'bg-emerald-100',
                  avatarColor: 'text-emerald-600',
                  rating: 5,
                  text: l(
                    '"FastlyGo kurye olarak çalışmak verdiğim en iyi karar oldu! Esneklik sayesinde işi eğitimimle dengeleyebiliyorum."',
                    '"Работењето со FastlyGo е најдобрата одлука. Флексибилноста ми овозможува да го балансирам работата."',
                    '"Working as a FastlyGo courier was the best decision. The flexibility lets me balance work and studies."'
                  ),
                  accent: 'border-emerald-200',
                },
                {
                  name: 'Biljana Ristova',
                  role: l('Market Sahibi', 'Сопственик на Маркет', 'Market Owner'),
                  avatar: 'BR',
                  avatarBg: 'bg-rose-100',
                  avatarColor: 'text-rose-600',
                  rating: 5,
                  text: l(
                    '"Marketten eve teslimat hizmetimiz için FastlyGo mükemmel. Müşteri memnuniyeti %40 arttı!"',
                    '"FastlyGo е совршен за нашата услуга за достава. Задоволството на клиентите се зголеми за 40%!"',
                    '"FastlyGo is perfect for our home delivery service. Customer satisfaction increased by 40%!"'
                  ),
                  accent: 'border-rose-200',
                },
                {
                  name: 'Dimitar Georgiev',
                  role: l('Çiçekçi', 'Цвеќар', 'Florist'),
                  avatar: 'DG',
                  avatarBg: 'bg-pink-100',
                  avatarColor: 'text-pink-600',
                  rating: 5,
                  text: l(
                    '"Çiçek teslimatı için en önemli şey hız ve özen. FastlyGo her ikisini de mükemmel yapıyor."',
                    '"За достава на цвеќиња, брзината и грижата се клучни. FastlyGo ги прави и двете совршено."',
                    '"For flower delivery, speed and care are everything. FastlyGo does both perfectly."'
                  ),
                  accent: 'border-pink-200',
                },
              ].map((review, i) => (
                <div
                  key={i}
                  className={`break-inside-avoid bg-white rounded-3xl p-6 border ${review.accent} shadow-sm hover:shadow-md transition-shadow duration-300 mb-6`}
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(review.rating)].map((_, si) => (
                      <Star key={si} className="w-4 h-4 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  {/* Quote */}
                  <p className="text-gray-700 leading-relaxed text-sm mb-5 italic">
                    {review.text}
                  </p>
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${review.avatarBg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-sm font-bold ${review.avatarColor}`}>{review.avatar}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{review.name}</div>
                      <div className={`text-xs ${review.avatarColor} font-medium`}>{review.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact ── */}
        <section className="py-16 bg-gradient-to-br from-orange-50/60 to-amber-50/30">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-orange-600 text-sm font-semibold shadow-sm border border-orange-100">
                <MapPin className="w-4 h-4" />
                Skopje, North Macedonia
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {t('contact', language)}
              </h2>
              <p className="text-gray-500">
                {l('Bizimle iletişime geçin', 'Контактирајте не', 'Get in touch with us')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <a
                  href="mailto:info@fastlygo.mk"
                  className="flex items-center gap-2 bg-white px-6 py-3.5 rounded-2xl shadow-sm border border-orange-100 hover:shadow-md hover:border-orange-200 transition-all text-gray-700 font-medium"
                >
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  info@fastlygo.mk
                </a>
                <a
                  href="tel:+38971246756"
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-3.5 rounded-2xl shadow-sm hover:shadow-lg hover:scale-105 transition-all text-white font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +389 71 246 756
                </a>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
