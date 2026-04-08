import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Bike,
  MapPin,
  RefreshCw,
  Star,
  Navigation,
  CheckCircle2,
  Clock,
  XCircle,
  Circle,
  Wifi,
  WifiOff,
  Search,
} from "lucide-react";

declare global {
  interface Window {
    google: any;
    googleMapsLoading?: boolean;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

// Üsküp merkezi koordinatları
const SKOPJE_CENTER = { lat: 41.9981, lng: 21.4254 };

// Üsküp genelinde dağınık manuel koordinatlar
const SKOPJE_LOCATIONS = [
  { lat: 41.9981, lng: 21.4254, area: "Merkez" },
  { lat: 42.0050, lng: 21.4180, area: "Çarşı" },
  { lat: 41.9920, lng: 21.4320, area: "Karşıyaka" },
  { lat: 42.0120, lng: 21.4100, area: "Butel" },
  { lat: 41.9850, lng: 21.4400, area: "Aerodrom" },
  { lat: 42.0200, lng: 21.4350, area: "Şuto Orizari" },
  { lat: 41.9780, lng: 21.4150, area: "Kisela Voda" },
  { lat: 42.0080, lng: 21.4500, area: "Gazi Baba" },
  { lat: 41.9950, lng: 21.3980, area: "Saraj" },
  { lat: 42.0030, lng: 21.4620, area: "Ilinden" },
  { lat: 41.9900, lng: 21.4050, area: "Centar" },
  { lat: 42.0150, lng: 21.4250, area: "Çair" },
  { lat: 41.9860, lng: 21.4480, area: "Novo Lisice" },
  { lat: 42.0220, lng: 21.4080, area: "Mirkovci" },
  { lat: 41.9750, lng: 21.4300, area: "Dračevo" },
  { lat: 42.0100, lng: 21.4700, area: "Vizbegovo" },
  { lat: 41.9930, lng: 21.4130, area: "Topansko Pole" },
  { lat: 42.0060, lng: 21.4380, area: "Radišani" },
  { lat: 41.9820, lng: 21.4220, area: "Vodno" },
  { lat: 42.0180, lng: 21.4450, area: "Pobeda" },
];

// Küçük rastgele offset ekle (her kurye için sabit görünüm)
function getOffset(id: number, axis: "lat" | "lng") {
  const seed = id * (axis === "lat" ? 7 : 13);
  return ((seed % 100) - 50) * 0.00004;
}

function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; color: string; bg: string; border: string; icon: any; pinColor: string }> = {
    approved: { label: "Onaylı", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, pinColor: "#10b981" },
    pending: { label: "Beklemede", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: Clock, pinColor: "#f59e0b" },
    rejected: { label: "Reddedildi", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: XCircle, pinColor: "#ef4444" },
  };
  return configs[status] || { label: status, color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200", icon: Circle, pinColor: "#6b7280" };
}

function getVehicleEmoji(vehicleType: string) {
  if (!vehicleType) return "🛵";
  const v = vehicleType.toLowerCase();
  if (v.includes("bicycle") || v.includes("bisiklet")) return "🚲";
  if (v.includes("car") || v.includes("araba")) return "🚗";
  if (v.includes("truck") || v.includes("kamyon")) return "🚚";
  return "🛵";
}

export default function AdminMap() {
  const { data: couriers, refetch, isLoading } = trpc.admin.getAllCouriersWithUsers.useQuery();
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [mapReady, setMapReady] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const infoWindowRef = useRef<any>(null);
  const couriersWithCoordsRef = useRef<any[]>([]);

  // Kuryelere sabit koordinat ata
  const couriersWithCoords = couriers?.map((c: any, i: number) => {
    const loc = SKOPJE_LOCATIONS[i % SKOPJE_LOCATIONS.length];
    return {
      ...c,
      lat: loc.lat + getOffset(c.id, "lat"),
      lng: loc.lng + getOffset(c.id, "lng"),
      area: loc.area,
    };
  });

  couriersWithCoordsRef.current = couriersWithCoords || [];

  const filtered = couriersWithCoords?.filter((c: any) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || c.userName?.toLowerCase().includes(q) || c.userEmail?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: couriers?.length || 0,
    approved: couriers?.filter((c: any) => c.status === "approved").length || 0,
    pending: couriers?.filter((c: any) => c.status === "pending").length || 0,
    online: couriers?.filter((c: any) => c.isOnline).length || 0,
  };

  // Google Maps yükle
  useEffect(() => {
    let mounted = true;
    let checkInterval: NodeJS.Timeout | null = null;

    const initMap = () => {
      if (!mounted || !mapContainer.current || !window.google?.maps || mapRef.current) return;
      try {
        mapRef.current = new window.google.maps.Map(mapContainer.current, {
          zoom: 13,
          center: SKOPJE_CENTER,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: false,
          scaleControl: true,
          gestureHandling: "greedy",
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
          ],
        });
        infoWindowRef.current = new window.google.maps.InfoWindow();
        setMapReady(true);
      } catch (error) {
        console.error("Map init error:", error);
      }
    };

    const loadGoogleMaps = async () => {
      if (!mounted) return;
      if (window.google?.maps) { initMap(); return; }
      if (window.googleMapsLoading) {
        checkInterval = setInterval(() => {
          if (window.google?.maps) { clearInterval(checkInterval!); initMap(); }
        }, 100);
        return;
      }
      window.googleMapsLoading = true;
      try {
        const scriptUrl = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&libraries=places,marker`;
        const response = await fetch(scriptUrl, { headers: { Origin: window.location.origin } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const scriptContent = await response.text();
        if (!mounted) return;
        const script = document.createElement("script");
        script.textContent = scriptContent;
        document.head.appendChild(script);
        checkInterval = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkInterval!);
            window.googleMapsLoading = false;
            initMap();
          }
        }, 100);
        setTimeout(() => { if (checkInterval) clearInterval(checkInterval); window.googleMapsLoading = false; }, 15000);
      } catch (error) {
        console.error("Maps load error:", error);
        window.googleMapsLoading = false;
      }
    };

    loadGoogleMaps();
    return () => { mounted = false; if (checkInterval) clearInterval(checkInterval); };
  }, []);

  // Pinleri güncelle
  useEffect(() => {
    if (!mapReady || !mapRef.current || !couriersWithCoords?.length) return;

    // Eski pinleri temizle
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    couriersWithCoords.forEach((courier: any) => {
      const statusCfg = getStatusConfig(courier.status);
      const pinColor = courier.isOnline ? statusCfg.pinColor : "#9ca3af";
      const name = courier.userName || courier.userEmail?.split("@")[0] || "Kurye";
      const vehicleEmoji = getVehicleEmoji(courier.vehicleType);

      const svgMarker = {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: pinColor,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: 1.8,
        anchor: new window.google.maps.Point(12, 22),
      };

      const marker = new window.google.maps.Marker({
        position: { lat: courier.lat, lng: courier.lng },
        map: mapRef.current,
        icon: svgMarker,
        title: name,
      });

      const infoContent = `
        <div style="font-family:system-ui,sans-serif;padding:4px;min-width:200px;max-width:240px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,${pinColor}cc,${pinColor});display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:15px;flex-shrink:0;">
              ${name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-weight:700;font-size:14px;color:#111;line-height:1.2;">${name}</div>
              <div style="font-size:11px;color:#888;margin-top:1px;">${courier.area || "Üsküp"}</div>
            </div>
          </div>
          <div style="font-size:12px;color:#555;margin-bottom:4px;">📧 ${courier.userEmail || "—"}</div>
          <div style="font-size:12px;color:#555;margin-bottom:8px;">${vehicleEmoji} ${courier.vehicleType || "Motosiklet"}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${courier.isOnline ? "#dcfce7" : "#f3f4f6"};color:${courier.isOnline ? "#16a34a" : "#6b7280"};">
              ${courier.isOnline ? "● Çevrimiçi" : "○ Çevrimdışı"}
            </span>
            <span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${pinColor}22;color:${pinColor};border:1px solid ${pinColor}44;">
              ${statusCfg.label}
            </span>
          </div>
          ${courier.rating ? `<div style="margin-top:8px;font-size:12px;color:#d97706;">⭐ ${Number(courier.rating).toFixed(1)} puan</div>` : ""}
        </div>
      `;

      marker.addListener("click", () => {
        infoWindowRef.current?.setContent(infoContent);
        infoWindowRef.current?.open(mapRef.current, marker);
        setSelectedCourier(courier);
      });

      markersRef.current.set(courier.id, marker);
    });
  }, [mapReady, couriers]);

  // Seçili kurye değişince haritayı orala
  const handleSelectCourier = (courier: any) => {
    setSelectedCourier(courier);
    if (mapRef.current && courier.lat && courier.lng) {
      mapRef.current.panTo({ lat: courier.lat, lng: courier.lng });
      mapRef.current.setZoom(16);
      const marker = markersRef.current.get(courier.id);
      if (marker && window.google?.maps) {
        infoWindowRef.current?.close();
        const statusCfg = getStatusConfig(courier.status);
        const pinColor = courier.isOnline ? statusCfg.pinColor : "#9ca3af";
        const name = courier.userName || courier.userEmail?.split("@")[0] || "Kurye";
        const vehicleEmoji = getVehicleEmoji(courier.vehicleType);
        const infoContent = `
          <div style="font-family:system-ui,sans-serif;padding:4px;min-width:200px;max-width:240px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,${pinColor}cc,${pinColor});display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:15px;flex-shrink:0;">
                ${name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style="font-weight:700;font-size:14px;color:#111;line-height:1.2;">${name}</div>
                <div style="font-size:11px;color:#888;margin-top:1px;">${courier.area || "Üsküp"}</div>
              </div>
            </div>
            <div style="font-size:12px;color:#555;margin-bottom:4px;">📧 ${courier.userEmail || "—"}</div>
            <div style="font-size:12px;color:#555;margin-bottom:8px;">${vehicleEmoji} ${courier.vehicleType || "Motosiklet"}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${courier.isOnline ? "#dcfce7" : "#f3f4f6"};color:${courier.isOnline ? "#16a34a" : "#6b7280"};">
                ${courier.isOnline ? "● Çevrimiçi" : "○ Çevrimdışı"}
              </span>
              <span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${pinColor}22;color:${pinColor};border:1px solid ${pinColor}44;">
                ${statusCfg.label}
              </span>
            </div>
            ${courier.rating ? `<div style="margin-top:8px;font-size:12px;color:#d97706;">⭐ ${Number(courier.rating).toFixed(1)} puan</div>` : ""}
          </div>
        `;
        infoWindowRef.current?.setContent(infoContent);
        infoWindowRef.current?.open(mapRef.current, marker);
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 1500);
      }
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
              <Navigation className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Canlı Kurye Haritası</h1>
              <p className="text-xs text-gray-500 mt-0.5">Üsküp genelinde kurye konumları</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-xs font-semibold text-gray-600">{stats.total} Toplam</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">{stats.approved} Onaylı</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-amber-700">{stats.pending} Beklemede</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
              <Wifi className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">{stats.online} Çevrimiçi</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 h-8 text-xs border-gray-200">
              <RefreshCw className="h-3.5 w-3.5" />
              Yenile
            </Button>
          </div>
        </div>
      </div>

      {/* Ana içerik */}
      <div className="flex flex-1 overflow-hidden">
        {/* Harita */}
        <div className="flex-1 relative bg-gray-100">
          {/* Yükleniyor overlay */}
          {!mapReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-10">
              <div className="w-14 h-14 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mb-4" />
              <p className="text-sm font-semibold text-gray-700">Harita yükleniyor...</p>
              <p className="text-xs text-gray-400 mt-1">Üsküp, Kuzey Makedonya</p>
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full" />

          {/* Renk açıklaması */}
          {mapReady && (
            <div className="absolute bottom-8 left-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-4 z-10">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Renk Kodu</p>
              <div className="space-y-2">
                {[
                  { color: "#10b981", label: "Onaylı & Çevrimiçi" },
                  { color: "#f59e0b", label: "Onay Bekliyor" },
                  { color: "#ef4444", label: "Reddedildi" },
                  { color: "#9ca3af", label: "Çevrimdışı" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ panel */}
        <div className="w-80 flex-shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden shadow-xl">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-sm">Kurye Listesi</h2>
              <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200 font-medium">
                {filtered?.length || 0} / {stats.total}
              </span>
            </div>
            {/* Arama */}
            <div className="relative mb-2.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="İsim veya e-posta ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
              />
            </div>
            {/* Filtre butonları */}
            <div className="flex gap-1.5">
              {[
                { value: "all", label: "Tümü" },
                { value: "approved", label: "Onaylı" },
                { value: "pending", label: "Beklemede" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-xl transition-all ${
                    filterStatus === f.value
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs">Yükleniyor...</p>
              </div>
            ) : !filtered?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Bike className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-xs">Kurye bulunamadı</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((courier: any) => {
                  const name = courier.userName || courier.userEmail?.split("@")[0] || "İsimsiz";
                  const statusCfg = getStatusConfig(courier.status);
                  const StatusIcon = statusCfg.icon;
                  const pinColor = courier.isOnline ? statusCfg.pinColor : "#9ca3af";
                  const isSelected = selectedCourier?.id === courier.id;

                  return (
                    <div
                      key={courier.id}
                      onClick={() => handleSelectCourier(courier)}
                      className={`px-4 py-3 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-orange-50 border-l-[3px] border-orange-500"
                          : "hover:bg-gray-50/80 border-l-[3px] border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${pinColor}bb, ${pinColor})` }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                        {/* Bilgi */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border} flex-shrink-0`}>
                              <StatusIcon className="h-2.5 w-2.5" />
                              {statusCfg.label}
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">{courier.userEmail || "—"}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-gray-500">
                              {getVehicleEmoji(courier.vehicleType)} {courier.vehicleType || "Motosiklet"}
                            </span>
                            <span className="text-[10px] text-gray-300">•</span>
                            <span className={`text-[10px] font-medium flex items-center gap-0.5 ${courier.isOnline ? "text-emerald-600" : "text-gray-400"}`}>
                              {courier.isOnline ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                              {courier.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                            </span>
                            {courier.rating && (
                              <>
                                <span className="text-[10px] text-gray-300">•</span>
                                <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                  {Number(courier.rating).toFixed(1)}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-2.5 w-2.5 text-orange-400 flex-shrink-0" />
                            <span className="text-[10px] text-orange-600 font-medium">{courier.area || "Üsküp"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 flex-shrink-0 bg-gray-50/30">
            <p className="text-[10px] text-gray-400 text-center">
              📍 Konumlar Üsküp genelinde dağıtılmıştır
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
