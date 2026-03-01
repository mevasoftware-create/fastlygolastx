import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";

export function HomeCourierMap({ showDemoCouriers = true }: { showDemoCouriers?: boolean }) {
  const [map, setMap] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  const hasFitBoundsRef = useRef(false);
  const [trafficLayerEnabled, setTrafficLayerEnabled] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const trafficLayerRef = useRef<any>(null);
  
  const { data: allCouriers, error: couriersError } = trpc.public.getActiveCouriers.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Log error if any
  if (couriersError) {
    console.error('Couriers query error:', couriersError);
  }
  
  // Filter couriers based on showDemoCouriers prop
  const couriers = allCouriers?.filter(courier => 
    showDemoCouriers ? true : !courier.isDemo
  );

  // Vehicle type to emoji mapping
  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case "motorcycle": return "🏍️";
      case "bicycle": return "🚲";
      case "car": return "🚗";
      default: return "📦";
    }
  };

  // Add courier markers to map
  useEffect(() => {
    if (!map || !couriers) return;

    // Clear existing markers
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
    }
    const newMarkers: any[] = [];

    // Add courier markers
    couriers.forEach(courier => {
      if (!courier.currentLatitude || !courier.currentLongitude) return;

      const position = {
        lat: parseFloat(courier.currentLatitude),
        lng: parseFloat(courier.currentLongitude),
      };

      // Use isAvailable to determine if courier is active
      const isActive = courier.isAvailable;

      // Color based on availability
      // All couriers: orange (same color for demo and real)
      const markerColor = '#FF6B00'; // Orange for all
      const color = isActive ? markerColor : markerColor + "66"; // Add opacity for inactive

      const vehicleIcon = getVehicleIcon(courier.vehicleType);

      // Create custom animated marker with pulse effect
      const markerDiv = document.createElement('div');
      markerDiv.className = 'courier-marker-wrapper';
      markerDiv.style.cssText = 'position: relative;';
      
      markerDiv.innerHTML = `
        <style>
          @keyframes pulse-ring {
            0% {
              transform: scale(0.8);
              opacity: 1;
            }
            100% {
              transform: scale(1.8);
              opacity: 0;
            }
          }
          .courier-pulse {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: ${markerColor};
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
            z-index: 0;
          }
          .courier-marker-content {
            position: relative;
            z-index: 1;
          }
        </style>
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          ${isActive ? `<div class="courier-pulse"></div>` : ''}
          <div class="courier-marker-content" style="display: flex; flex-direction: column; align-items: center;">
            <div style="
              background: ${markerColor};
              color: white;
              border-radius: 50%;
              width: 48px;
              height: 48px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              border: 3px solid white;
              opacity: ${isActive ? '1' : '0.4'};
            ">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="8.5" cy="16.5" r="2.5"/>
                <circle cx="18.5" cy="16.5" r="2.5"/>
                <path d="M3 12h3l2-4h8l2 4h3"/>
                <path d="M16 12v-4"/>
              </svg>
            </div>
            <!-- Badge removed, will show in InfoWindow -->
          </div>
        </div>
      `;

      const marker = new (window as any).google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        content: markerDiv,
        title: `Courier #${courier.id}`,
      });

      // Info window content with demo badge
      const infoContent = `
        <div style="padding: 12px; min-width: 220px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
              ${vehicleIcon} Kurye #${courier.id}
            </h3>
            ${courier.isDemo ? '<span style="background: #3b82f6; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px;">DEMO</span>' : ''}
          </div>
          <div style="font-size: 14px; color: #666;">
            <p style="margin: 4px 0;"><strong>Araç:</strong> ${courier.vehicleType}</p>
            <p style="margin: 4px 0;"><strong>Durum:</strong> 
              <span style="color: ${isActive ? '#10b981' : '#6b7280'};">
                ${isActive ? '🟢 Müsait' : '⚫ Meşgul'}
              </span>
            </p>
            ${courier.isDemo ? '<p style="margin: 4px 0; font-size: 12px; color: #3b82f6; font-style: italic;">Bu bir demo kuryedir</p>' : ''}

          </div>
        </div>
      `;

      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

    // Fit bounds to show all couriers - only on first load
    if (newMarkers.length > 0 && !hasFitBoundsRef.current) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        // Advanced Marker uses 'position' property, not getPosition() method
        const pos = marker.position;
        if (pos) bounds.extend(pos);
      });
      map.fitBounds(bounds);
      hasFitBoundsRef.current = true;
    }
  }, [map, couriers, showDemoCouriers]);

  // Traffic layer toggle
  useEffect(() => {
    if (!map) return;

    if (trafficLayerEnabled) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new (window as any).google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(map);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    }
  }, [map, trafficLayerEnabled]);

  // Map type change
  useEffect(() => {
    if (!map) return;
    map.setMapTypeId(mapType);
  }, [map, mapType]);

  const handleMapReady = (googleMap: any) => {
    setMap(googleMap);
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Traffic Layer Toggle */}
        <button
          onClick={() => setTrafficLayerEnabled(!trafficLayerEnabled)}
          className={`px-4 py-2 rounded-lg shadow-lg font-semibold text-sm transition-all ${
            trafficLayerEnabled 
              ? 'bg-orange-600 text-white hover:bg-orange-700' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Trafik Durumu"
        >
          🚗 Trafik
        </button>

        {/* Map Type Selector */}
        <select
          value={mapType}
          onChange={(e) => setMapType(e.target.value as any)}
          className="px-4 py-2 rounded-lg shadow-lg bg-white text-gray-700 font-semibold text-sm hover:bg-gray-100 cursor-pointer"
          title="Harita Tipi"
        >
          <option value="roadmap">🗺️ Yol Haritası</option>
          <option value="satellite">🛰️ Uydu</option>
          <option value="hybrid">🌍 Hibrit</option>
          <option value="terrain">⛰️ Arazi</option>
        </select>

        {/* Fullscreen Button */}
        <button
          onClick={() => {
            const mapContainer = document.querySelector('.map-container');
            if (mapContainer) {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                mapContainer.requestFullscreen();
              }
            }
          }}
          className="px-4 py-2 rounded-lg shadow-lg bg-white text-gray-700 hover:bg-gray-100 font-semibold text-sm"
          title="Tam Ekran"
        >
          ⛶ Tam Ekran
        </button>
      </div>

      <div className="map-container w-full h-full">
        <MapView 
          center={{ lat: 41.9973, lng: 21.4280 }} 
          zoom={13}
          onMapReady={handleMapReady}
        />
      </div>
    </div>
  );
}
