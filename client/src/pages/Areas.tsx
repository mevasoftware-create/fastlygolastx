import { useState, useRef, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { getAreasPageSchemas } from '@/lib/structuredData';
import { MapView } from '@/components/Map';
import { MapPin, Search, ArrowRight, Loader2, Zap, X, Navigation, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';

/* ── City config ───────────────────────────────────────────── */
interface CityConfig {
  color: string;
  gradient: string;
  lightBg: string;
  emoji: string;
}

const cityConfig: Record<string, CityConfig> = {
  // Makedonya şehirleri
  Skopje:       { color: '#f97316', gradient: 'from-orange-500 to-amber-500', lightBg: 'bg-orange-50', emoji: '🏙️' },
  Tetovo:       { color: '#3b82f6', gradient: 'from-blue-500 to-indigo-500', lightBg: 'bg-blue-50', emoji: '🏔️' },
  Bitola:       { color: '#a855f7', gradient: 'from-purple-500 to-violet-500', lightBg: 'bg-purple-50', emoji: '🏛️' },
  Ohrid:        { color: '#14b8a6', gradient: 'from-teal-500 to-emerald-500', lightBg: 'bg-teal-50', emoji: '🌊' },
  Kumanovo:     { color: '#f43f5e', gradient: 'from-rose-500 to-pink-500', lightBg: 'bg-rose-50', emoji: '🌄' },
  Gostivar:     { color: '#22c55e', gradient: 'from-green-500 to-emerald-500', lightBg: 'bg-green-50', emoji: '🌲' },
  Strumica:     { color: '#eab308', gradient: 'from-yellow-500 to-amber-500', lightBg: 'bg-yellow-50', emoji: '☀️' },
  Veles:        { color: '#6366f1', gradient: 'from-indigo-500 to-blue-500', lightBg: 'bg-indigo-50', emoji: '🌉' },
  Kocani:       { color: '#f59e0b', gradient: 'from-amber-500 to-orange-500', lightBg: 'bg-amber-50', emoji: '🌾' },
  Istip:        { color: '#06b6d4', gradient: 'from-cyan-500 to-teal-500', lightBg: 'bg-cyan-50', emoji: '⛰️' },
  Prilep:       { color: '#d946ef', gradient: 'from-fuchsia-500 to-purple-500', lightBg: 'bg-fuchsia-50', emoji: '🏺' },
  // Arnavutluk şehirleri
  Tirana:       { color: '#e11d48', gradient: 'from-red-600 to-rose-500', lightBg: 'bg-red-50', emoji: '🏙️' },
  'Durrës':     { color: '#0284c7', gradient: 'from-sky-600 to-blue-500', lightBg: 'bg-sky-50', emoji: '⚓' },
  'Vlorë':      { color: '#0891b2', gradient: 'from-cyan-600 to-teal-500', lightBg: 'bg-cyan-50', emoji: '🌊' },
  'Shkodër':    { color: '#7c3aed', gradient: 'from-violet-600 to-purple-500', lightBg: 'bg-violet-50', emoji: '🏰' },
  Elbasan:      { color: '#059669', gradient: 'from-emerald-600 to-green-500', lightBg: 'bg-emerald-50', emoji: '🏭' },
  Fier:         { color: '#d97706', gradient: 'from-amber-600 to-yellow-500', lightBg: 'bg-amber-50', emoji: '🌾' },
  'Korçë':      { color: '#db2777', gradient: 'from-pink-600 to-rose-500', lightBg: 'bg-pink-50', emoji: '🏔️' },
  Berat:        { color: '#92400e', gradient: 'from-amber-800 to-orange-600', lightBg: 'bg-amber-100', emoji: '🏛️' },
  'Gjirokastër':{ color: '#1d4ed8', gradient: 'from-blue-700 to-indigo-600', lightBg: 'bg-blue-100', emoji: '🏯' },
  'Lushnjë':    { color: '#15803d', gradient: 'from-green-700 to-emerald-600', lightBg: 'bg-green-100', emoji: '🌿' },
};
const defaultConfig: CityConfig = { color: '#6b7280', gradient: 'from-gray-500 to-slate-500', lightBg: 'bg-gray-50', emoji: '📍' };

// Domain'e göre ülke kodu tespit et
function getCountryCodeFromDomain(): string {
  if (typeof window !== 'undefined' && window.location.hostname.includes('fastlygo.al')) return 'AL';
  return 'MK';
}

function getCityForSlug(slug: string, cityNameFromDb?: string): string {
  // Önce DB'den gelen cityName'i kullan
  if (cityNameFromDb) return cityNameFromDb;
  if (slug.includes('tetovo')) return 'Tetovo';
  if (slug.includes('bitola')) return 'Bitola';
  if (slug.includes('ohrid')) return 'Ohrid';
  if (slug.includes('kumanovo')) return 'Kumanovo';
  if (slug.includes('prilep')) return 'Prilep';
  if (slug.includes('gostivar')) return 'Gostivar';
  if (slug.includes('strumica')) return 'Strumica';
  if (slug.includes('veles')) return 'Veles';
  if (slug.includes('kocani')) return 'Kocani';
  if (slug.includes('istip')) return 'Istip';
  return 'Skopje';
}

export default function Areas() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const countryCode = useMemo(() => getCountryCodeFromDomain(), []);
  const defaultCity = countryCode === 'AL' ? 'Tirana' : 'Skopje';
  const [expandedCity, setExpandedCity] = useState<string | null>(defaultCity);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);
  const markersRef = useRef<Map<number, any>>(new Map());
  const infoWindowRef = useRef<any>(null);

  const { data: pageData, isLoading: isPageLoading } = trpc.pages.getBySlug.useQuery({ slug: 'areas' });
  const pageSeoMeta = pageData?.seoMeta ? (typeof pageData.seoMeta === 'string' ? JSON.parse(pageData.seoMeta) : pageData.seoMeta) : null;
  const seoData = pageSeoMeta?.[language] || pageSeoMeta?.en || {};

  const { data: areas, isLoading } = trpc.areas.list.useQuery({ countryCode });

  const getAreaName = (area: any) => {
    const meta = area.seoMeta?.[language] || area.seoMeta?.en || {};
    return meta.heading || meta.badge || area.slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  const getAreaSubtitle = (area: any) => {
    const meta = area.seoMeta?.[language] || area.seoMeta?.en || {};
    return meta.subtitle || '';
  };

  const filteredAreas = useMemo(() =>
    (areas || []).filter((area: any) =>
      getAreaName(area).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCityForSlug(area.slug, area.cityName).toLowerCase().includes(searchQuery.toLowerCase())
    ), [areas, searchQuery, language]
  );

  const groupedAreas = useMemo(() =>
    filteredAreas.reduce((acc: Record<string, any[]>, area: any) => {
      const city = getCityForSlug(area.slug, area.cityName);
      if (!acc[city]) acc[city] = [];
      acc[city].push(area);
      return acc;
    }, {}), [filteredAreas]
  );

  const sortedCities = useMemo(() =>
    Object.keys(groupedAreas).sort((a, b) => {
      // Aktif ülkenin başşehri önce gelsin
      if (a === defaultCity) return -1;
      if (b === defaultCity) return 1;
      return a.localeCompare(b);
    }), [groupedAreas, defaultCity]
  );

  const totalAreas = filteredAreas.length;
  const totalCities = sortedCities.length;

  /* ── Map markers ────────────────────────────────────────── */
  useEffect(() => {
    if (!mapInstance || !areas || areas.length === 0) return;
    if (markersRef.current.size > 0) return;

    mapInstance.setOptions({
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f0eb' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c4dfe6' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
      ]
    });

    infoWindowRef.current = new window.google.maps.InfoWindow({ maxWidth: 260 });

    areas.forEach((area: any) => {
      if (!area.lat || !area.lng) return;
      const city = getCityForSlug(area.slug);
      const hex = (cityConfig[city] || defaultConfig).color;
      const areaName = getAreaName(area);

      const marker = new window.google.maps.Marker({
        position: { lat: area.lat, lng: area.lng },
        map: mapInstance,
        title: areaName,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: hex,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.6,
          anchor: new window.google.maps.Point(12, 22),
        },
      });

      marker.addListener('click', () => {
        const subtitle = getAreaSubtitle(area);
        const subtitleHtml = subtitle
          ? `<p style="font-size:12px;color:#6b7280;margin:4px 0 10px;line-height:1.5;">${subtitle.length > 80 ? subtitle.slice(0, 80) + '...' : subtitle}</p>`
          : '';
        infoWindowRef.current.setContent(
          `<div style="font-family:Inter,-apple-system,sans-serif;padding:4px 0;min-width:160px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${hex};flex-shrink:0;"></span>
              <strong style="font-size:14px;color:#111827;">${areaName}</strong>
            </div>
            ${subtitleHtml}
            <a href="/areas/${area.slug}"
               onclick="event.preventDefault();window.__navigateTo('/areas/${area.slug}')"
               style="display:inline-flex;align-items:center;gap:5px;background:${hex};color:white;font-size:12px;font-weight:600;padding:6px 14px;border-radius:8px;text-decoration:none;">
              View Area →
            </a>
          </div>`
        );
        infoWindowRef.current.open(mapInstance, marker);
      });

      markersRef.current.set(area.id, marker);
    });
  }, [mapInstance, areas]);

  useEffect(() => {
    (window as any).__navigateTo = (path: string) => { window.location.href = path; };
    return () => { delete (window as any).__navigateTo; };
  }, []);

  return (
    <>
      <SEOHead
        title={seoData.title || ''}
        description={seoData.description || ''}
        keywords={seoData.keywords || ''}
        isLoading={isPageLoading}
        structuredData={getAreasPageSchemas(areas || [])}
      />

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50/30 via-white to-amber-50/20">
        <Header />

        {/* ── Hero Section ──────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50/40" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-amber-100/30 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-10 md:pt-16 md:pb-14">
            <div className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100/70 border border-orange-200/50 mb-6">
                <Navigation className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-700">
                  {t('deliveryNetwork') || 'Delivery Network'}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
                {seoData.heading || t('areasPageTitle') || 'Where We Deliver'}
              </h1>
              <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
                {seoData.subtitle || t('areasPageSubtitle') || 'Fast and reliable delivery service across North Macedonia. Choose your city and district to get started.'}
              </p>

              {/* Search */}
              <div className="relative max-w-md mx-auto mb-10">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchCityOrDistrict') || 'Search city or district...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-orange-200/60 bg-white/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:border-orange-300 text-sm transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 md:gap-10">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-extrabold text-orange-500">{totalCities}</div>
                  <div className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">{t('cities') || 'Cities'}</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-extrabold text-orange-500">{totalAreas}</div>
                  <div className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">{t('deliveryZones') || 'Delivery Zones'}</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-extrabold text-orange-500">15</div>
                  <div className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">{t('minuteDelivery') || 'Min Delivery'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── City Cards Section ────────────────────────────── */}
        <section className="py-10 md:py-14">
          <div className="max-w-6xl mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : filteredAreas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                <MapPin className="w-10 h-10" />
                <p className="text-base font-medium">{t('noAreasFound') || 'No areas found.'}</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-sm text-orange-500 hover:underline">
                    {t('clearSearch') || 'Clear search'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedCities.map(cityName => {
                  const config = cityConfig[cityName] || defaultConfig;
                  const cityAreas = groupedAreas[cityName].sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
                  const isExpanded = expandedCity === cityName;

                  return (
                    <div key={cityName} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
                      {/* City Header */}
                      <button
                        onClick={() => setExpandedCity(isExpanded ? null : cityName)}
                        className="w-full flex items-center gap-4 p-4 md:p-5 text-left transition-colors hover:bg-gray-50/50"
                      >
                        {/* City Icon */}
                        <div
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}
                        >
                          <span className="text-xl md:text-2xl">{config.emoji}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg md:text-xl font-bold text-gray-900">{cityName}</h2>
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: config.color }}
                            >
                              {cityAreas.length}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {cityAreas.length} {t('deliveryZones') || 'delivery zones'} · <Clock className="w-3 h-3 inline" /> 15 min
                          </p>
                        </div>

                        <div className="flex-shrink-0 text-gray-400 transition-transform">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </button>

                      {/* Area Grid - Expandable */}
                      {isExpanded && (
                        <div className="px-4 pb-4 md:px-5 md:pb-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {cityAreas.map((area: any) => {
                              const areaName = getAreaName(area);
                              const subtitle = getAreaSubtitle(area);
                              return (
                                <Link
                                  key={area.id}
                                  href={`/areas/${area.slug}`}
                                  className="group flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-orange-200/60 hover:shadow-sm transition-all"
                                >
                                  <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: config.color + '14' }}
                                  >
                                    <MapPin className="w-4.5 h-4.5" style={{ color: config.color }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 truncate">
                                      {areaName}
                                    </p>
                                    {subtitle && (
                                      <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
                                    )}
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 flex-shrink-0 transition-all group-hover:translate-x-0.5" />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Interactive Map Section ──────────────────────── */}
        <section className="py-10 md:py-14 bg-gradient-to-b from-white to-gray-50/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
                {t('exploreOnMap') || 'Explore on Map'}
              </h2>
              <p className="text-gray-500 text-sm md:text-base">
                {t('exploreOnMapDesc') || 'Click on any pin to see delivery area details'}
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-200/60 shadow-lg bg-white">
              {/* Map Toggle for Mobile */}
              <button
                onClick={() => setShowMap(!showMap)}
                className="w-full md:hidden flex items-center justify-center gap-2 py-4 text-sm font-semibold text-orange-600 bg-orange-50/50 border-b border-gray-100 transition-colors hover:bg-orange-50"
              >
                <MapPin className="w-4 h-4" />
                {showMap ? (t('hideMap') || 'Hide Map') : (t('showMap') || 'Show Interactive Map')}
              </button>

              <div className={`${showMap ? 'block' : 'hidden'} md:block relative`} style={{ height: '500px' }}>
                <MapView
                  center={{ lat: 41.5, lng: 21.4254 }}
                  zoom={9}
                  className="w-full h-full"
                  onMapReady={(map) => {
                    map.setCenter({ lat: 41.5, lng: 21.4254 });
                    map.setZoom(9);
                    setMapInstance(map);
                  }}
                />

                {/* Map overlay badge */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 flex items-center gap-2 text-sm font-semibold text-gray-700 border border-white/80">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    {totalAreas} {t('areas') || 'areas'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Section ─────────────────────────────────── */}
        <section className="py-14 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative max-w-2xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <Zap className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white/90">{t('fastDelivery') || 'Fast Delivery'}</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
              {t('orderNow') || 'Ready to Order?'}
            </h2>
            <p className="text-white/80 text-base md:text-lg mb-8 leading-relaxed">
              {t('orderNowDesc') || 'Get your package delivered in minutes. Available across all listed areas.'}
            </p>

            <Link href="/new-order">
              <button className="inline-flex items-center gap-2.5 bg-white text-orange-600 font-bold px-8 py-4 rounded-2xl hover:scale-105 hover:shadow-xl transition-all shadow-lg text-base">
                <Zap className="w-5 h-5" />
                {t('callCourier') || 'Call a Courier'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
