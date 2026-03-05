/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 * 
 * CRITICAL: SDK Loading Pattern (MUST use this exact approach)
 * ============================================================
 * 
 * ❌ WRONG: script.src = url  (gets blocked by ad blockers)
 * ✅ CORRECT: fetch(url).then(text => script.textContent = text)
 * 
 * const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
 * const FORGE_BASE_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL;
 * const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;
 * 
 * const scriptUrl = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&libraries=places,drawing,geometry,visualization`;
 * 
 * fetch(scriptUrl, { headers: { 'Origin': window.location.origin } })
 *   .then(r => r.text())
 *   .then(content => {
 *     const script = document.createElement('script');
 *     script.textContent = content;  // NOT script.src!
 *     document.head.appendChild(script);
 *     // Poll for window.google.maps availability
 *   });
 * 
 * Available Libraries:
 * - places: PlacesService, AutocompleteService
 * - drawing: DrawingManager (markers, polygons, circles, polylines, rectangles)
 * - geometry: distance/area calculations
 * - visualization: HeatmapLayer
 * 
 * Common Services (initialize after map creation):
 * - new google.maps.places.PlacesService(map)
 * - new google.maps.Geocoder()
 * - new google.maps.DirectionsService()
 * - new google.maps.DistanceMatrixService()
 * - new google.maps.ElevationService()
 * - new google.maps.drawing.DrawingManager(options)
 * 
 * Layers:
 * - new google.maps.TrafficLayer()
 * - new google.maps.TransitLayer()
 * - new google.maps.BicyclingLayer()
 * - new google.maps.visualization.HeatmapLayer({ data: [] })
 */

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
    googleMapsLoading?: boolean;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onMapReady?: (map: any) => void;
}

export function MapView({
  center = { lat: 37.7749, lng: -122.4194 },
  zoom = 12,
  className = "w-full h-[500px]",
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    let checkInterval: NodeJS.Timeout | null = null;

    const initMap = () => {
      if (!mounted || !mapContainer.current || !window.google?.maps || map.current) return;

      try {
        map.current = new window.google.maps.Map(mapContainer.current, {
          zoom,
          center,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          streetViewControl: false,
          scaleControl: false,
          rotateControl: false,
          mapId: 'DEMO_MAP_ID',
          gestureHandling: 'greedy',
        });

        if (onMapReady) {
          onMapReady(map.current);
        }
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    const loadGoogleMaps = async () => {
      if (!mounted) return;
      
      // Prevent multiple simultaneous loads
      if (window.googleMapsLoading) {
        // Wait for the other load to complete
        checkInterval = setInterval(() => {
          if (window.google?.maps) {
            if (checkInterval) clearInterval(checkInterval);
            initMap();
          }
        }, 100);
        return;
      }
      
      window.googleMapsLoading = true;

      try {
        const scriptUrl = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&libraries=places,drawing,geometry,visualization,marker`;
        
        const response = await fetch(scriptUrl, {
          method: 'GET',
          headers: { 'Origin': window.location.origin },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const scriptContent = await response.text();
        
        if (!mounted) return;

        const script = document.createElement('script');
        script.textContent = scriptContent;
        document.head.appendChild(script);
        
        // Poll for Google Maps availability
        checkInterval = setInterval(() => {
          if (window.google?.maps) {
            if (checkInterval) clearInterval(checkInterval);
            window.googleMapsLoading = false;
            initMap();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (checkInterval) clearInterval(checkInterval);
          window.googleMapsLoading = false;
        }, 10000);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        window.googleMapsLoading = false;
      }
    };

    if (!window.google?.maps) {
      loadGoogleMaps();
    } else {
      initMap();
    }

    return () => {
      mounted = false;
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // Allow external code to update center/zoom after mount (e.g., when data loads)
  useEffect(() => {
    if (map.current && center) {
      map.current.setCenter(center);
    }
  }, [center?.lat, center?.lng]);

  useEffect(() => {
    if (map.current && zoom !== undefined) {
      map.current.setZoom(zoom);
    }
  }, [zoom]);

  return <div ref={mapContainer} className={className} />;
}
