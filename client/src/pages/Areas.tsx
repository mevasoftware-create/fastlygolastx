import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { MapView } from '@/components/Map';
import { MapPin, Search, CheckCircle, ArrowRight, Loader2, Zap, List, Map as MapIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';

const cityColors: Record<string, string> = {
  Skopje:   '#f97316',
  Tetovo:   '#3b82f6',
  Bitola:   '#a855f7',
  Ohrid:    '#14b8a6',
  Kumanovo: '#f43f5e',
  Gostivar: '#22c55e',
  Strumica: '#eab308',
  Veles:    '#6366f1',
  Kocani:   '#f59e0b',
  Istip:    '#06b6d4',
  Prilep:   '#d946ef',
};
const defaultHex = '#6b7280';

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

type MobileTab = 'list' | 'map';

export default function Areas() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<any | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('list');
  const markersRef = useRef<Map<number, any>>(new Map());
  const infoWindowRef = useRef<any>(null);

  const { data: pageData, isLoading: isPageLoading } = trpc.pages.getBySlug.useQuery({ slug: 'areas' });
  const pageSeoMeta = pageData?.seoMeta ? (typeof pageData.seoMeta === 'string' ? JSON.parse(pageData.seoMeta) : pageData.seoMeta) : null;
  const seoData = pageSeoMeta?.[language] || pageSeoMeta?.en || {};

  const { data: areas, isLoading } = trpc.areas.list.useQuery();

  const getAreaName = (area: any) => {
    const meta = area.seoMeta?.[language] || area.seoMeta?.en || {};
    return meta.heading || meta.badge || area.slug;
  };

  const getAreaSubtitle = (area: any) => {
    const meta = area.seoMeta?.[language] || area.seoMeta?.en || {};
    return meta.subtitle || '';
  };

  const filteredAreas = (areas || []).filter((area: any) =>
    getAreaName(area).toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  useEffect(() => {
    if (!mapInstance || !areas || areas.length === 0) return;
    if (markersRef.current.size > 0) return;

    mapInstance.setOptions({
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f0f0eb' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b8d8e8' }] },
      ]
    });

    infoWindowRef.current = new window.google.maps.InfoWindow({ maxWidth: 240 });

    areas.forEach((area: any) => {
      if (!area.lat || !area.lng) return;

      const city = getCityForSlug(area.slug);
      const hex = cityColors[city] || defaultHex;
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
          strokeWeight: 2.5,
          scale: 1.8,
          anchor: new window.google.maps.Point(12, 22),
        },
      });

      marker.addListener('click', () => {
        setSelectedArea(area);
        const subtitle = getAreaSubtitle(area);
        const subtitleHtml = subtitle
          ? `<p style="font-size:11px;color:#6b7280;margin:0 0 8px 0;line-height:1.4;padding-left:13px;">${subtitle.length > 70 ? subtitle.slice(0, 70) + '...' : subtitle}</p>`
          : '';
        infoWindowRef.current.setContent(
          `<div style="font-family:-apple-system,sans-serif;padding:2px 0;min-width:150px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:${subtitle ? '4px' : '8px'};">
              <span style="width:7px;height:7px;border-radius:50%;background:${hex};flex-shrink:0;"></span>
              <strong style="font-size:13px;color:#111827;">${areaName}</strong>
            </div>
            ${subtitleHtml}
            <a href="/areas/${area.slug}"
               onclick="event.preventDefault();window.__navigateTo('/areas/${area.slug}')"
               style="display:inline-flex;align-items:center;gap:4px;background:${hex};color:white;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;text-decoration:none;margin-left:13px;">
              View Area
            </a>
          </div>`
        );
        infoWindowRef.current.open(mapInstance, marker);
      });

      markersRef.current.set(area.id, marker);
    });
  }, [mapInstance, areas]);

  useEffect(() => {
    if (!selectedArea || !mapInstance || !selectedArea.lat || !selectedArea.lng) return;
    mapInstance.panTo({ lat: selectedArea.lat, lng: selectedArea.lng });
    mapInstance.setZoom(13);
    const marker = markersRef.current.get(selectedArea.id);
    if (marker) window.google?.maps?.event?.trigger(marker, 'click');
  }, [selectedArea?.id]);

  useEffect(() => {
    (window as any).__navigateTo = (path: string) => { window.location.href = path; };
    return () => { delete (window as any).__navigateTo; };
  }, []);

  useEffect(() => {
    if (mobileTab === 'map' && mapInstance) {
      setTimeout(() => {
        window.google?.maps?.event?.trigger(mapInstance, 'resize');
        mapInstance.setCenter({ lat: 41.9981, lng: 21.4254 });
      }, 100);
    }
  }, [mobileTab, mapInstance]);

  const AreaListContent = () => (
    <div className="flex-1 overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
        </div>
      ) : filteredAreas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-300">
          <MapPin className="w-8 h-8" />
          <p className="text-sm">{t('noAreasFound') || 'No areas found.'}</p>
        </div>
      ) : (
        <div className="pb-4">
          {sortedCities.map(cityName => {
            const hex = cityColors[cityName] || defaultHex;
            return (
              <div key={cityName}>
                <div className="flex items-center gap-2 px-4 py-2.5 sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-50">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: hex }} />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{cityName}</span>
                  <span className="ml-auto text-[10px] text-gray-300 font-medium">{groupedAreas[cityName].length}</span>
                </div>

                {groupedAreas[cityName]
                  .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                  .map((area: any) => {
                    const areaName = getAreaName(area);
                    const isSelected = selectedArea?.id === area.id;
                    return (
                      <button
                        key={area.id}
                        onClick={() => {
                          setSelectedArea(isSelected ? null : area);
                          if (!isSelected) setMobileTab('map');
                        }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all group border-l-[3px] ${
                          isSelected
                            ? 'bg-orange-50 border-l-orange-400'
                            : 'hover:bg-gray-50 border-l-transparent hover:border-l-orange-200'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: hex + '18' }}
                        >
                          <MapPin className="w-3.5 h-3.5" style={{ color: hex }} />
                        </div>
                        <span className={`text-sm flex-1 truncate font-medium ${isSelected ? 'text-orange-600' : 'text-gray-700 group-hover:text-gray-900'}`}>
                          {areaName}
                        </span>
                        {area.active && (
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        )}
                        <Link
                          href={`/areas/${area.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0"
                        >
                          <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-400' : 'text-gray-300 group-hover:text-orange-300'}`} />
                        </Link>
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <SEOHead
        title={seoData.title || ''}
        description={seoData.description || ''}
        keywords={seoData.keywords || ''}
        isLoading={isPageLoading}
      />

      <div className="min-h-screen flex flex-col bg-white">
        <Header />

        {/* Page Header */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50/60 border-b border-orange-100/60">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">
                    {seoData.heading || t('areasPageTitle') || 'Delivery Areas'}
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {seoData.subtitle || t('areasPageSubtitle') || 'Fast and reliable delivery across North Macedonia.'}
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-64 flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchCityOrDistrict') || 'Search area...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-orange-200/80 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE: Tab switcher */}
        <div className="md:hidden border-b border-gray-100 bg-white sticky top-0 z-20 shadow-sm">
          <div className="flex">
            <button
              onClick={() => setMobileTab('list')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
                mobileTab === 'list'
                  ? 'border-orange-500 text-orange-600 bg-orange-50/40'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
              {t('listView') || 'List'}
              <span className="bg-orange-100 text-orange-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {filteredAreas.length}
              </span>
            </button>
            <button
              onClick={() => setMobileTab('map')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
                mobileTab === 'map'
                  ? 'border-orange-500 text-orange-600 bg-orange-50/40'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              {t('mapView') || 'Map'}
            </button>
          </div>
        </div>

        {/* MOBILE: Tab content */}
        <div className="md:hidden flex-1 flex flex-col" style={{ minHeight: '60vh' }}>
          {mobileTab === 'list' ? (
            <div className="flex flex-col flex-1">
              <AreaListContent />
            </div>
          ) : (
            <div className="relative flex-1" style={{ minHeight: '60vh' }}>
              <MapView
                center={{ lat: 41.9981, lng: 21.4254 }}
                zoom={10}
                className="w-full h-full absolute inset-0"
                onMapReady={(map) => {
                  map.setCenter({ lat: 41.9981, lng: 21.4254 });
                  map.setZoom(10);
                  setMapInstance(map);
                }}
              />

              {selectedArea && (
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: (cityColors[getCityForSlug(selectedArea.slug)] || defaultHex) + '18' }}
                      >
                        <MapPin className="w-5 h-5" style={{ color: cityColors[getCityForSlug(selectedArea.slug)] || defaultHex }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-base">{getAreaName(selectedArea)}</p>
                        {getAreaSubtitle(selectedArea) && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{getAreaSubtitle(selectedArea)}</p>
                        )}
                        <Link href={`/areas/${selectedArea.slug}`}>
                          <span
                            className="inline-flex items-center gap-1.5 text-sm font-bold mt-2.5 px-3 py-1.5 rounded-lg text-white"
                            style={{ background: cityColors[getCityForSlug(selectedArea.slug)] || defaultHex }}
                          >
                            {t('viewArea') || 'View Area'} <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </Link>
                      </div>
                      <button
                        onClick={() => setSelectedArea(null)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute top-3 right-3 z-10">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm px-3 py-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-600 border border-white/80">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  {filteredAreas.length} {t('areas') || 'areas'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DESKTOP: Side-by-side layout */}
        <div className="hidden md:flex flex-1" style={{ minHeight: '600px' }}>
          <div className="w-72 lg:w-80 flex-shrink-0 flex flex-col border-r border-gray-100 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {t('allAreas') || 'All Areas'}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {filteredAreas.length} {t('areas') || 'areas'}
              </span>
            </div>
            <AreaListContent />
          </div>

          <div className="flex-1 relative overflow-hidden">
            <MapView
              center={{ lat: 41.9981, lng: 21.4254 }}
              zoom={11}
              className="w-full h-full absolute inset-0"
              onMapReady={(map) => {
                map.setCenter({ lat: 41.9981, lng: 21.4254 });
                map.setZoom(11);
                setMapInstance(map);
              }}
            />

            {selectedArea && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-64">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: (cityColors[getCityForSlug(selectedArea.slug)] || defaultHex) + '18' }}
                    >
                      <MapPin className="w-4 h-4" style={{ color: cityColors[getCityForSlug(selectedArea.slug)] || defaultHex }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{getAreaName(selectedArea)}</p>
                      {getAreaSubtitle(selectedArea) && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{getAreaSubtitle(selectedArea)}</p>
                      )}
                      <Link href={`/areas/${selectedArea.slug}`}>
                        <span
                          className="inline-flex items-center gap-1 text-xs font-bold mt-2 px-2.5 py-1.5 rounded-lg text-white"
                          style={{ background: cityColors[getCityForSlug(selectedArea.slug)] || defaultHex }}
                        >
                          {t('viewArea') || 'View Area'} <ArrowRight className="w-3 h-3" />
                        </span>
                      </Link>
                    </div>
                    <button
                      onClick={() => setSelectedArea(null)}
                      className="text-gray-300 hover:text-gray-500 p-0.5 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute top-3 right-3 z-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-white/80">
                <MapPin className="w-3 h-3 text-orange-500" />
                {filteredAreas.length} {t('areas') || 'areas'}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="py-10 bg-gradient-to-br from-orange-50/60 to-amber-50/30 border-t border-orange-100/40">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              {t('orderNow') || 'Call Courier Now!'}
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              {t('orderNowDesc') || 'Get your package delivered in minutes.'}
            </p>
            <Link href="/new-order">
              <button
                className="inline-flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-md text-sm"
                style={{ background: 'linear-gradient(135deg, #ff7a35 0%, #f55f00 100%)' }}
              >
                <Zap className="w-4 h-4" />
                {t('callCourier') || 'Call a Courier'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
