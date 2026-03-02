import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { MapPin, Search, CheckCircle, Clock, Loader2, Zap, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';

interface AreaData {
  id: number;
  slug: string;
  seoMeta: string;
  active: boolean;
  displayOrder: number;
}

interface ParsedArea extends AreaData {
  seoMeta: any;
}

// Soft pastel color palette per city
const cityColors: Record<string, { bg: string; dot: string; badge: string }> = {
  Skopje:   { bg: 'from-orange-50 to-amber-50',   dot: 'bg-orange-400',  badge: 'bg-orange-100 text-orange-600' },
  Tetovo:   { bg: 'from-blue-50 to-sky-50',        dot: 'bg-blue-400',    badge: 'bg-blue-100 text-blue-600' },
  Bitola:   { bg: 'from-purple-50 to-violet-50',   dot: 'bg-purple-400',  badge: 'bg-purple-100 text-purple-600' },
  Ohrid:    { bg: 'from-teal-50 to-cyan-50',        dot: 'bg-teal-400',    badge: 'bg-teal-100 text-teal-600' },
  Kumanovo: { bg: 'from-rose-50 to-pink-50',        dot: 'bg-rose-400',    badge: 'bg-rose-100 text-rose-600' },
  Gostivar: { bg: 'from-green-50 to-emerald-50',   dot: 'bg-green-400',   badge: 'bg-green-100 text-green-600' },
  Strumica: { bg: 'from-yellow-50 to-lime-50',     dot: 'bg-yellow-400',  badge: 'bg-yellow-100 text-yellow-700' },
  Veles:    { bg: 'from-indigo-50 to-blue-50',     dot: 'bg-indigo-400',  badge: 'bg-indigo-100 text-indigo-600' },
  Kocani:   { bg: 'from-amber-50 to-orange-50',    dot: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700' },
  Istip:    { bg: 'from-cyan-50 to-teal-50',        dot: 'bg-cyan-400',    badge: 'bg-cyan-100 text-cyan-600' },
  Prilep:   { bg: 'from-fuchsia-50 to-pink-50',    dot: 'bg-fuchsia-400', badge: 'bg-fuchsia-100 text-fuchsia-600' },
};

const defaultCityColor = { bg: 'from-gray-50 to-slate-50', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' };

export default function Areas() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: pageData, isLoading: isSeoLoading } = trpc.pages.getBySlug.useQuery({ slug: 'areas' });
  const pageSeoMeta = pageData?.seoMeta ? (typeof pageData.seoMeta === 'string' ? JSON.parse(pageData.seoMeta) : pageData.seoMeta) : null;
  const seoData = pageSeoMeta?.[language] || pageSeoMeta?.en || {};

  const { data: areas, isLoading, error } = trpc.areas.list.useQuery();

  // seoMeta is already a parsed JSON object from the API (superjson)
  const parsedAreas = (areas || []);

  const getAreaName = (area: any) => {
    const meta = area.seoMeta?.[language] || area.seoMeta?.en || {};
    return meta.badge || meta.shortTitle || meta.title || area.slug;
  };

  const getAreaSubtitle = (area: any) => {
    const meta = area.seoMeta?.[language] || area.seoMeta?.en || {};
    return meta.subtitle || '';
  };

  const filteredAreas = parsedAreas.filter((area: any) =>
    getAreaName(area).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedAreas = filteredAreas.reduce((acc: Record<string, ParsedArea[]>, area: ParsedArea) => {
    let city = 'Skopje';
    if (area.slug.includes('tetovo')) city = 'Tetovo';
    else if (area.slug.includes('bitola')) city = 'Bitola';
    else if (area.slug.includes('ohrid')) city = 'Ohrid';
    else if (area.slug.includes('kumanovo')) city = 'Kumanovo';
    else if (area.slug.includes('prilep')) city = 'Prilep';
    else if (area.slug.includes('gostivar')) city = 'Gostivar';
    else if (area.slug.includes('strumica')) city = 'Strumica';
    else if (area.slug.includes('veles')) city = 'Veles';
    else if (area.slug.includes('kocani')) city = 'Kocani';
    else if (area.slug.includes('istip')) city = 'Istip';
    if (!acc[city]) acc[city] = [];
    acc[city].push(area);
    return acc;
  }, {});

  const sortedCities = Object.keys(groupedAreas).sort((a, b) => {
    if (a === 'Skopje') return -1;
    if (b === 'Skopje') return 1;
    return a.localeCompare(b);
  });

  const pageHeading = seoData.heading || t('areasPageTitle') || 'Where We Deliver';

  return (
    <>
      <SEOHead
        title={isSeoLoading ? '' : (seoData.title || t('areas') + ' - FastlyGo')}
        description={isSeoLoading ? '' : (seoData.description || 'Explore our delivery coverage areas across North Macedonia. Fast delivery in Skopje and beyond.')}
        keywords={isSeoLoading ? '' : (seoData.keywords || 'delivery areas, Skopje delivery, courier service areas')}
      />

      <div className="min-h-screen flex flex-col bg-white">
        <Header />

        {/* ── Hero ── */}
        <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50/40 to-white">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-orange-600 text-sm font-semibold shadow-sm border border-orange-100">
                <MapPin className="w-4 h-4 text-orange-500" />
                {t('deliveryAreas') || 'Delivery Areas'}
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                {pageHeading}
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
                {t('areasPageSubtitle') || 'Fast and reliable delivery service across North Macedonia. Choose your city and district to get started.'}
              </p>

              {/* Search */}
              <div className="max-w-xl mx-auto pt-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('searchCityOrDistrict') || 'Search city or district...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl border border-orange-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-base transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Areas ── */}
        <section className="py-16">
          <div className="container">

            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            )}

            {error && (
              <div className="text-center py-20">
                <p className="text-red-400 text-lg">{t('errorLoadingAreas') || 'Failed to load areas. Please try again later.'}</p>
              </div>
            )}

            {!isLoading && !error && filteredAreas.length === 0 && (
              <div className="text-center py-20 space-y-3">
                <MapPin className="w-14 h-14 text-orange-200 mx-auto" />
                <p className="text-gray-400 text-lg">{t('noAreasFound') || 'No areas found matching your search.'}</p>
              </div>
            )}

            {!isLoading && !error && filteredAreas.length > 0 && (
              <div className="space-y-16 max-w-6xl mx-auto">
                {sortedCities.map(cityName => {
                  const colors = cityColors[cityName] || defaultCityColor;
                  return (
                    <div key={cityName}>
                      {/* City heading */}
                      <div className="flex items-center gap-4 mb-8">
                        <div className={`w-3 h-3 rounded-full ${colors.dot} flex-shrink-0`} />
                        <h2 className="text-3xl font-extrabold text-gray-900">{cityName}</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                          {groupedAreas[cityName].length} {t('districts') || 'districts'}
                        </span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>

                      {/* Area cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {groupedAreas[cityName]
                          .sort((a: ParsedArea, b: ParsedArea) => a.displayOrder - b.displayOrder)
                          .map((area: ParsedArea) => {
                            const areaName = getAreaName(area);
                            const areaSubtitle = getAreaSubtitle(area);
                            return (
                              <Link key={area.id} href={`/areas/${area.slug}`}>
                                <div className={`group relative bg-gradient-to-br ${colors.bg} rounded-3xl p-6 border border-white hover:border-orange-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer overflow-hidden`}>
                                  {/* Subtle glow on hover */}
                                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/30 rounded-3xl transition-all duration-300" />

                                  <div className="relative space-y-3">
                                    {/* Status */}
                                    <div className="flex items-center justify-between">
                                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        area.active
                                          ? 'bg-green-100 text-green-600'
                                          : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        {area.active ? (
                                          <><CheckCircle className="w-3 h-3" />{t('active') || 'Active'}</>
                                        ) : (
                                          <><Clock className="w-3 h-3" />{t('comingSoon') || 'Coming Soon'}</>
                                        )}
                                      </div>
                                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all duration-300" />
                                    </div>

                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-2xl ${colors.dot} bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                                      style={{ background: 'rgba(255,255,255,0.6)' }}>
                                      <MapPin className={`w-6 h-6`} style={{ color: 'inherit' }} />
                                    </div>

                                    {/* Name */}
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors leading-tight">
                                      {areaName}
                                    </h3>

                                    {/* Subtitle */}
                                    {areaSubtitle && (
                                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                        {areaSubtitle}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 bg-gradient-to-br from-orange-50/60 to-amber-50/30">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-orange-600 text-sm font-semibold shadow-sm border border-orange-100">
                <Zap className="w-4 h-4" />
                {t('readyToOrder') || 'Ready to Order?'}
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                {t('orderNow') || 'Order Now'}
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed max-w-xl mx-auto">
                {t('orderNowDesc') || 'Get your package delivered in minutes. Fast, reliable, and affordable.'}
              </p>
              <Link href="/new-order">
                <button
                  className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg mt-2"
                  style={{ background: 'linear-gradient(135deg, #ff7a35 0%, #f55f00 100%)' }}
                >
                  <Zap className="w-5 h-5" />
                  {t('callCourier') || 'Call a Courier'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
