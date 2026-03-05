import { useState, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { MapView } from '@/components/Map';
import { MapPin, Search, CheckCircle, Clock, Loader2, Zap, ArrowRight, List, Map as MapIcon, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

// City color palette
const cityColors: Record<string, { bg: string; dot: string; badge: string; hex: string }> = {
  Skopje:   { bg: 'from-orange-50 to-amber-50',   dot: 'bg-orange-400',  badge: 'bg-orange-100 text-orange-600',  hex: '#f97316' },
  Tetovo:   { bg: 'from-blue-50 to-sky-50',        dot: 'bg-blue-400',    badge: 'bg-blue-100 text-blue-600',      hex: '#3b82f6' },
  Bitola:   { bg: 'from-purple-50 to-violet-50',   dot: 'bg-purple-400',  badge: 'bg-purple-100 text-purple-600',  hex: '#a855f7' },
  Ohrid:    { bg: 'from-teal-50 to-cyan-50',        dot: 'bg-teal-400',    badge: 'bg-teal-100 text-teal-600',      hex: '#14b8a6' },
  Kumanovo: { bg: 'from-rose-50 to-pink-50',        dot: 'bg-rose-400',    badge: 'bg-rose-100 text-rose-600',      hex: '#f43f5e' },
  Gostivar: { bg: 'from-green-50 to-emerald-50',   dot: 'bg-green-400',   badge: 'bg-green-100 text-green-600',    hex: '#22c55e' },
  Strumica: { bg: 'from-yellow-50 to-lime-50',     dot: 'bg-yellow-400',  badge: 'bg-yellow-100 text-yellow-700',  hex: '#eab308' },
  Veles:    { bg: 'from-indigo-50 to-blue-50',     dot: 'bg-indigo-400',  badge: 'bg-indigo-100 text-indigo-600',  hex: '#6366f1' },
  Kocani:   { bg: 'from-amber-50 to-orange-50',    dot: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700',    hex: '#f59e0b' },
  Istip:    { bg: 'from-cyan-50 to-teal-50',        dot: 'bg-cyan-400',    badge: 'bg-cyan-100 text-cyan-600',      hex: '#06b6d4' },
  Prilep:   { bg: 'from-fuchsia-50 to-pink-50',    dot: 'bg-fuchsia-400', badge: 'bg-fuchsia-100 text-fuchsia-600',hex: '#d946ef' },
};
const defaultCityColor = { bg: 'from-gray-50 to-slate-50', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600', hex: '#6b7280' };

function getCityForSlug(slug: string): string {
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
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedArea, setSelectedArea] = useState<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const { data: pageData, isLoading: isSeoLoading } = trpc.pages.getBySlug.useQuery({ slug: 'areas' });
  const pageSeoMeta = pageData?.seoMeta ? (typeof pageData.seoMeta === 'string' ? JSON.parse(pageData.seoMeta) : pageData.seoMeta) : null;
  const seoData = pageSeoMeta?.[language] || pageSeoMeta?.en || {};

  const { data: areas, isLoading } = trpc.areas.list.useQuery();

  const getAreaName = (area: any) => {
    const meta = area.seoMeta?.[language] || area.seoMeta?.en || {};
    return meta.heading || meta.badge || meta.shortTitle || area.slug;
  };

  const getAreaSubtitle = (area: any) => {
    const meta = area.seoMeta?.[language] || area.seoMeta?.en || {};
    return meta.subtitle || '';
  };

  const filteredAreas = (areas || []).filter((area: any) =>
    getAreaName(area).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group for list view
  const groupedAreas = filteredAreas.reduce((acc: Record<string, any[]>, area: any) => {
    const city = getCityForSlug(area.slug);
    if (!acc[city]) acc[city] = [];
    acc[city].push(area);
    return acc;
  }, {});

  const sortedCities = Object.keys(groupedAreas).sort((a, b) => {
    if (a === 'Skopje') return -1;
    if (b === 'Skopje') return 1;
    return a.localeCompare(b);
  });

  const handleMapReady = useCallback((map: any) => {
    if (!areas) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
    infoWindowRef.current = new window.google.maps.InfoWindow();

    const bounds = new window.google.maps.LatLngBounds();

    areas.forEach((area: any) => {
      if (!area.lat || !area.lng) return;

      const city = getCityForSlug(area.slug);
      const colors = cityColors[city] || defaultCityColor;
      const areaName = getAreaName(area);
      const subtitle = getAreaSubtitle(area);

      // Custom SVG pin marker
      const svgMarker = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: colors.hex,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.8,
        anchor: new window.google.maps.Point(12, 22),
      };

      const marker = new window.google.maps.Marker({
        position: { lat: area.lat, lng: area.lng },
        map,
        title: areaName,
        icon: svgMarker,
        animation: window.google.maps.Animation.DROP,
      });

      marker.addListener('click', () => {
        setSelectedArea(area);

        const content = `
          <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 180px; max-width: 240px;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
              <span style="width:10px; height:10px; border-radius:50%; background:${colors.hex}; flex-shrink:0;"></span>
              <strong style="font-size:15px; color:#1f2937;">${areaName}</strong>
            </div>
            ${subtitle ? `<p style="font-size:12px; color:#6b7280; margin:0 0 8px 0; line-height:1.4;">${subtitle}</p>` : ''}
            <a href="/areas/${area.slug}" style="display:inline-block; background:${colors.hex}; color:white; font-size:12px; font-weight:600; padding:5px 12px; border-radius:8px; text-decoration:none;">
              ${t('viewArea') || 'View Area'} →
            </a>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(map, marker);

        // Handle link click inside InfoWindow
        window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
          const link = document.querySelector('.gm-style-iw a[href^="/areas/"]') as HTMLAnchorElement;
          if (link) {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              navigate(link.getAttribute('href') || '/areas');
            });
          }
        });
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: area.lat, lng: area.lng });
    });

    if (markersRef.current.length > 0) {
      map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
    }
  }, [areas, language]);

  const pageHeading = seoData.heading || t('areasPageTitle') || 'Where We Deliver';

  return (
    <>
      <SEOHead
        title={isSeoLoading ? '' : (seoData.title || t('areas') + ' - FastlyGo')}
        description={isSeoLoading ? '' : (seoData.description || 'Explore our delivery coverage areas across North Macedonia.')}
        keywords={isSeoLoading ? '' : (seoData.keywords || 'delivery areas, Skopje delivery, courier service areas')}
      />

      <div className="min-h-screen flex flex-col bg-white">
        <Header />

        {/* ── Hero ── */}
        <section className="relative pt-20 pb-10 overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50/40 to-white">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-orange-600 text-sm font-semibold shadow-sm border border-orange-100">
                <MapPin className="w-4 h-4 text-orange-500" />
                {t('deliveryAreas') || 'Delivery Areas'}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
                {pageHeading}
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
                {t('areasPageSubtitle') || 'Fast and reliable delivery service across North Macedonia. Choose your city and district to get started.'}
              </p>

              {/* Controls row */}
              <div className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto pt-1">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('searchCityOrDistrict') || 'Search city or district...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-orange-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-sm transition-all"
                  />
                </div>

                {/* View toggle */}
                <div className="flex items-center bg-white border border-orange-100 rounded-xl shadow-sm overflow-hidden flex-shrink-0">
                  <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all ${
                      viewMode === 'map'
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-500 hover:text-orange-500'
                    }`}
                  >
                    <MapIcon className="w-4 h-4" />
                    {t('mapView') || 'Map'}
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all ${
                      viewMode === 'list'
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-500 hover:text-orange-500'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    {t('listView') || 'List'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Map View ── */}
        {viewMode === 'map' && (
          <section className="flex-1 relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-[600px]">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : (
              <div className="relative">
                {/* Map */}
                <MapView
                  center={{ lat: 41.6086, lng: 21.7453 }}
                  zoom={8}
                  className="w-full h-[600px] md:h-[680px]"
                  onMapReady={handleMapReady}
                />

                {/* Selected area card (bottom overlay) */}
                {selectedArea && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-10">
                    <div className={`bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}
                        style={{ background: (cityColors[getCityForSlug(selectedArea.slug)] || defaultCityColor).hex + '22' }}>
                        <MapPin className="w-5 h-5" style={{ color: (cityColors[getCityForSlug(selectedArea.slug)] || defaultCityColor).hex }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-base leading-tight">{getAreaName(selectedArea)}</p>
                        {getAreaSubtitle(selectedArea) && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{getAreaSubtitle(selectedArea)}</p>
                        )}
                        <Link href={`/areas/${selectedArea.slug}`}>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 mt-2 hover:text-orange-600 cursor-pointer">
                            {t('viewArea') || 'View Area'} <ArrowRight className="w-3 h-3" />
                          </span>
                        </Link>
                      </div>
                      <button
                        onClick={() => setSelectedArea(null)}
                        className="text-gray-300 hover:text-gray-500 flex-shrink-0 mt-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats bar */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-white px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    {filteredAreas.length} {t('areas') || 'areas'}
                  </div>
                </div>
              </div>
            )}

            {/* Area chips below map */}
            {!isLoading && filteredAreas.length > 0 && (
              <div className="py-6 bg-gray-50 border-t border-gray-100">
                <div className="container">
                  <div className="flex flex-wrap gap-2 justify-center max-w-5xl mx-auto">
                    {filteredAreas.map((area: any) => {
                      const city = getCityForSlug(area.slug);
                      const colors = cityColors[city] || defaultCityColor;
                      return (
                        <Link key={area.id} href={`/areas/${area.slug}`}>
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer hover:scale-105 transition-transform border border-transparent hover:border-current"
                            style={{ background: colors.hex + '18', color: colors.hex }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colors.hex }} />
                            {getAreaName(area)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── List View ── */}
        {viewMode === 'list' && (
          <section className="py-12">
            <div className="container">
              {isLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                </div>
              )}

              {!isLoading && filteredAreas.length === 0 && (
                <div className="text-center py-20 space-y-3">
                  <MapPin className="w-14 h-14 text-orange-200 mx-auto" />
                  <p className="text-gray-400 text-lg">{t('noAreasFound') || 'No areas found matching your search.'}</p>
                </div>
              )}

              {!isLoading && filteredAreas.length > 0 && (
                <div className="space-y-12 max-w-6xl mx-auto">
                  {sortedCities.map(cityName => {
                    const colors = cityColors[cityName] || defaultCityColor;
                    return (
                      <div key={cityName}>
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-3 h-3 rounded-full ${colors.dot} flex-shrink-0`} />
                          <h2 className="text-2xl font-extrabold text-gray-900">{cityName}</h2>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                            {groupedAreas[cityName].length} {t('districts') || 'districts'}
                          </span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupedAreas[cityName]
                            .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
                            .map((area: any) => {
                              const areaName = getAreaName(area);
                              const areaSubtitle = getAreaSubtitle(area);
                              return (
                                <Link key={area.id} href={`/areas/${area.slug}`}>
                                  <div className={`group relative bg-gradient-to-br ${colors.bg} rounded-2xl p-5 border border-white hover:border-orange-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer`}>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                          area.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                          {area.active
                                            ? <><CheckCircle className="w-3 h-3" />{t('active') || 'Active'}</>
                                            : <><Clock className="w-3 h-3" />{t('comingSoon') || 'Coming Soon'}</>
                                          }
                                        </div>
                                        <h3 className="text-base font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                                          {areaName}
                                        </h3>
                                        {areaSubtitle && (
                                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{areaSubtitle}</p>
                                        )}
                                      </div>
                                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
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
        )}

        {/* ── CTA ── */}
        <section className="py-14 bg-gradient-to-br from-orange-50/60 to-amber-50/30">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-5">
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
