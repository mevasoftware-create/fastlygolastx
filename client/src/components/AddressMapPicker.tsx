import { useState, useRef, useEffect, useCallback } from "react";
import { MapView } from "./Map";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { MapPin, Search, Navigation, X, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface AddressMapPickerProps {
  label: string;
  value: string;
  onChange: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  compact?: boolean;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function AddressMapPicker({
  label,
  value,
  onChange,
  placeholder,
  compact = false,
}: AddressMapPickerProps) {
  const { t } = useTranslation();
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || "");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [marker, setMarker] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [autocompleteService, setAutocompleteService] = useState<any>(null);
  const [placesService, setPlacesService] = useState<any>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [servicesReady, setServicesReady] = useState(false);
  const [loadGoogleMaps, setLoadGoogleMaps] = useState(true);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const predictionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Skopje center coordinates
  const SKOPJE_CENTER = { lat: 41.9973, lng: 21.4280 };

  // Initialize Google Places services immediately when component mounts
  useEffect(() => {
    const initializeServices = () => {
      if (!window.google?.maps?.places) {
        return false;
      }

      try {
        // Initialize Autocomplete Service (doesn't need a map)
        const autocompleteServiceInstance = new window.google.maps.places.AutocompleteService();
        setAutocompleteService(autocompleteServiceInstance);

        // Initialize Geocoder (doesn't need a map)
        const geocoderInstance = new window.google.maps.Geocoder();
        setGeocoder(geocoderInstance);

        setServicesReady(true);
        console.log('✅ Google Places services initialized successfully');
        return true;
      } catch (error) {
        console.error('Failed to initialize Google Places services:', error);
        return false;
      }
    };

    // Try to initialize immediately
    if (!initializeServices()) {
      // If not ready, check every 500ms until Google Maps is loaded
      initCheckInterval.current = setInterval(() => {
        if (initializeServices() && initCheckInterval.current) {
          clearInterval(initCheckInterval.current);
          initCheckInterval.current = null;
        }
      }, 500);
    }

    // Cleanup
    return () => {
      if (initCheckInterval.current) {
        clearInterval(initCheckInterval.current);
      }
    };
  }, []);

  // Sync searchQuery with value prop
  useEffect(() => {
    if (value && value !== searchQuery) {
      setSearchQuery(value);
    }
  }, [value]);

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        predictionsRef.current &&
        !predictionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMapReady = useCallback((mapInstance: any) => {
    if (!mapInstance || !window.google?.maps) {
      console.error('Map instance or Google Maps not available');
      return;
    }
    
    console.log('✅ Map ready, initializing marker and listeners');
    setMap(mapInstance);

    // Initialize PlacesService (needs a map)
    try {
      if (window.google.maps.places && !placesService) {
        const placesServiceInstance = new window.google.maps.places.PlacesService(mapInstance);
        setPlacesService(placesServiceInstance);
        console.log('✅ PlacesService initialized');
      }
    } catch (error) {
      console.error('Failed to initialize PlacesService:', error);
    }

    // Create draggable marker
    try {
      const markerInstance = new window.google.maps.Marker({
        map: mapInstance,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#f97316",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 3,
        },
      });
      setMarker(markerInstance);
      console.log('✅ Marker created');

      // Add click listener to map - CRITICAL FIX
      const clickListener = mapInstance.addListener("click", (e: any) => {
        console.log('🗺️ Map clicked at:', e.latLng.lat(), e.latLng.lng());
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        markerInstance.setPosition(e.latLng);
        markerInstance.setVisible(true);
        
        // Use the geocoder from state or create a new one
        const geocoderInstance = geocoder || new window.google.maps.Geocoder();
        reverseGeocode(lat, lng, geocoderInstance);
      });

      // Add drag end listener to marker - CRITICAL FIX
      const dragListener = markerInstance.addListener("dragend", (e: any) => {
        console.log('📍 Marker dragged to:', e.latLng.lat(), e.latLng.lng());
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        // Use the geocoder from state or create a new one
        const geocoderInstance = geocoder || new window.google.maps.Geocoder();
        reverseGeocode(lat, lng, geocoderInstance);
      });

      // If we have a selected location, show it
      if (selectedLocation) {
        markerInstance.setPosition({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        markerInstance.setVisible(true);
        mapInstance.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        mapInstance.setZoom(16);
        console.log('✅ Marker positioned at selected location');
      }

      // Cleanup function to remove listeners
      return () => {
        if (clickListener) window.google.maps.event.removeListener(clickListener);
        if (dragListener) window.google.maps.event.removeListener(dragListener);
      };
    } catch (error) {
      console.error('Failed to create marker:', error);
    }
  }, [selectedLocation, geocoder, placesService]);

  const reverseGeocode = (lat: number, lng: number, geocoderInstance: any) => {
    console.log('🔍 Reverse geocoding:', lat, lng);
    geocoderInstance.geocode(
      { location: { lat, lng } },
      (results: any[], status: string) => {
        console.log('📍 Geocode status:', status);
        if (status === "OK" && results[0]) {
          const address = results[0].formatted_address;
          console.log('✅ Address found:', address);
          setSelectedLocation({ lat, lng, address });
          setSearchQuery(address);
        } else {
          console.error('❌ Geocoding failed:', status);
        }
      }
    );
  };

  // Debounced search for autocomplete - Works WITHOUT opening map
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query || query.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      // Use the autocomplete service that was initialized on mount
      if (!autocompleteService) {
        console.warn('⚠️ Autocomplete service not ready yet');
        setIsSearching(false);
        return;
      }
      
      console.log('🔍 Searching for:', query);
      autocompleteService.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "mk" },
          locationBias: {
            center: SKOPJE_CENTER,
            radius: 30000,
          },
        },
        (results: PlacePrediction[] | null, status: string) => {
          console.log('📍 Autocomplete status:', status, 'Results:', results?.length || 0);
          setIsSearching(false);
          if (status === "OK" && results) {
            setPredictions(results);
            setShowPredictions(true);
          } else {
            console.warn('⚠️ No predictions found:', status);
            setPredictions([]);
            setShowPredictions(false);
          }
        }
      );
    }, 300);
  };

  const handlePredictionSelect = (prediction: PlacePrediction) => {
    // For getting place details, we need PlacesService which requires a map
    // If map is not open, we'll use Geocoder to get coordinates from the address
    if (!geocoder) {
      console.warn('⚠️ Geocoder not ready');
      return;
    }

    console.log('📍 Prediction selected:', prediction.description);
    setIsSearching(true);
    
    // Use Geocoder to get coordinates from address (doesn't need map)
    geocoder.geocode(
      { address: prediction.description },
      (results: any[], status: string) => {
        console.log('🗺️ Geocode result status:', status);
        setIsSearching(false);
        if (status === "OK" && results[0]?.geometry?.location) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          const address = results[0].formatted_address || prediction.description;

          console.log('✅ Location found:', { lat, lng, address });
          setSelectedLocation({ lat, lng, address });
          setSearchQuery(address);
          setShowPredictions(false);

          // Update parent immediately
          onChange(address, lat, lng);

          // If map is open, update marker position
          if (marker && map) {
            marker.setPosition({ lat, lng });
            marker.setVisible(true);
            map.setCenter({ lat, lng });
            map.setZoom(17);
            console.log('✅ Marker updated on map');
          }
        } else {
          console.error('❌ Geocoding failed:', status);
        }
      }
    );
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('browserNotSupport'));
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (geocoder) {
          geocoder.geocode(
            { location: { lat, lng } },
            (results: any[], status: string) => {
              setIsGettingLocation(false);
              if (status === "OK" && results[0]) {
                const address = results[0].formatted_address;
                setSelectedLocation({ lat, lng, address });
                setSearchQuery(address);
                onChange(address, lat, lng);

                // If map is open, update marker position
                if (marker && map) {
                  marker.setPosition({ lat, lng });
                  marker.setVisible(true);
                  map.setCenter({ lat, lng });
                  map.setZoom(17);
                }
              }
            }
          );
        } else {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Konum alınamadı:", error);
        alert(t('locationError'));
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onChange(selectedLocation.address, selectedLocation.lat, selectedLocation.lng);
      setShowMap(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedLocation(null);
    setPredictions([]);
    setShowPredictions(false);
    if (marker) {
      marker.setVisible(false);
    }
    onChange("", 0, 0);
  };

  const handleMapToggle = () => {
    setShowMap(!showMap);
    // Close predictions when opening map
    if (!showMap) {
      setShowPredictions(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden MapView to load Google Maps API */}
      {loadGoogleMaps && !servicesReady && (
        <div className="hidden">
          <MapView
            center={SKOPJE_CENTER}
            zoom={13}
            className="w-0 h-0"
            onMapReady={() => {
              setLoadGoogleMaps(false);
              console.log('✅ Google Maps API loaded via hidden MapView');
            }}
          />
        </div>
      )}
      <Label className="text-sm md:text-base font-semibold text-gray-700">{label}</Label>
      
      {/* Enhanced Input with Autocomplete - Works WITHOUT map */}
      <div className="relative">
        {compact ? (
          /* COMPACT MODE: All controls inside a single clean input row */
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (predictions.length > 0) setShowPredictions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery && !isSearching) {
                  e.preventDefault();
                  if (predictions.length > 0) {
                    handlePredictionSelect(predictions[0]);
                  } else if (geocoder && searchQuery.length >= 3) {
                    setIsSearching(true);
                    geocoder.geocode(
                      { address: searchQuery },
                      (results: any[], status: string) => {
                        setIsSearching(false);
                        if (status === "OK" && results[0]?.geometry?.location) {
                          const lat = results[0].geometry.location.lat();
                          const lng = results[0].geometry.location.lng();
                          const address = results[0].formatted_address || searchQuery;
                          setSelectedLocation({ lat, lng, address });
                          setSearchQuery(address);
                          onChange(address, lat, lng);
                        }
                      }
                    );
                  }
                }
              }}
              placeholder={placeholder || t('searchOrSelectOnMap')}
              className="pl-9 pr-20 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none w-full text-base"
              style={{ height: '48px', paddingTop: '0', paddingBottom: '0', lineHeight: '48px' }}
            />
            {/* Right side icons inside input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isSearching && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
              {searchQuery && !isSearching && (
                <button type="button" onClick={handleClear} className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleMapToggle}
                className={`p-1.5 rounded-lg transition-all ${
                  showMap ? "text-orange-600 bg-orange-100" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                }`}
                title={t('openMap')}
              >
                <MapPin className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                title={t('currentLocation')}
              >
                {isGettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              </button>
            </div>
            {/* Autocomplete Predictions Dropdown */}
            {showPredictions && predictions.length > 0 && (
              <div
                ref={predictionsRef}
                className="absolute z-[9999] left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-hidden"
              >
                <div className="overflow-y-auto max-h-72">
                  {predictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onClick={() => handlePredictionSelect(prediction)}
                      className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                          <MapPin className="w-3.5 h-3.5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                            {prediction.structured_formatting.main_text}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {prediction.structured_formatting.secondary_text}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* FULL MODE: Separate buttons outside input */
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (predictions.length > 0) setShowPredictions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery && !isSearching) {
                    e.preventDefault();
                    if (predictions.length > 0) {
                      handlePredictionSelect(predictions[0]);
                    } else if (geocoder && searchQuery.length >= 3) {
                      setIsSearching(true);
                      geocoder.geocode(
                        { address: searchQuery },
                        (results: any[], status: string) => {
                          setIsSearching(false);
                          if (status === "OK" && results[0]?.geometry?.location) {
                            const lat = results[0].geometry.location.lat();
                            const lng = results[0].geometry.location.lng();
                            const address = results[0].formatted_address || searchQuery;
                            setSelectedLocation({ lat, lng, address });
                            setSearchQuery(address);
                            onChange(address, lat, lng);
                          } else {
                            console.error('❌ Geocoding failed:', status);
                          }
                        }
                      );
                    }
                  }
                }}
                placeholder={placeholder || t('searchOrSelectOnMap')}
                className="pl-9 md:pl-10 pr-9 md:pr-10 h-11 md:h-12 border-2 border-gray-200 focus:border-orange-500 rounded-lg text-sm md:text-base"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-orange-500" />
                </div>
              )}
              {searchQuery && !isSearching && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              )}
              {/* Autocomplete Predictions Dropdown */}
              {showPredictions && predictions.length > 0 && (
                <div
                  ref={predictionsRef}
                  className="absolute z-[9999] w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 md:max-h-96 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 border-b border-orange-100">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {predictions.length} {t('searchResults') || 'Sonuç'}
                    </p>
                  </div>
                  <div className="overflow-y-auto max-h-64 md:max-h-80">
                    {predictions.map((prediction) => (
                      <button
                        key={prediction.place_id}
                        type="button"
                        onClick={() => handlePredictionSelect(prediction)}
                        className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                            <MapPin className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                              {prediction.structured_formatting.main_text}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                              {prediction.structured_formatting.secondary_text}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Map Toggle Button */}
            <Button
              type="button"
              variant={showMap ? "default" : "outline"}
              onClick={handleMapToggle}
              className={`h-11 md:h-12 px-3 md:px-4 transition-all flex-shrink-0 ${
                showMap 
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg" 
                  : "border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50"
              }`}
              title={t('openMap')}
            >
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            {/* Current Location Button */}
            <Button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="h-11 md:h-12 px-3 md:px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all flex-shrink-0"
              title={t('currentLocation')}
            >
              {isGettingLocation ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Selected Location Preview - hidden in compact mode */}
      {selectedLocation && !showMap && !compact && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-3 md:p-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-900 mb-1">{t('selectedAddress')}:</p>
              <p className="text-xs md:text-sm text-gray-700 break-words">{selectedLocation.address}</p>
              <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal Dialog */}
      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden gap-0">
          {/* Header */}
          <DialogHeader className="px-4 pt-4 pb-3 border-b flex-row items-center justify-between">
            <DialogTitle className="text-base font-bold text-gray-900">
              {t('selectAddressOnMap')}
            </DialogTitle>
          </DialogHeader>

          {/* Map - full height, no scroll */}
          <div className="relative">
            <MapView
              center={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : SKOPJE_CENTER}
              zoom={selectedLocation ? 16 : 13}
              className="w-full h-[55vh] min-h-[300px]"
              onMapReady={handleMapReady}
            />

            {/* Bottom overlay inside map: shows selected address OR instructions */}
            <div className="absolute bottom-3 left-3 right-3 z-10">
              {selectedLocation ? (
                /* Selected address card - inside map as overlay */
                <div className="bg-white/97 backdrop-blur-md rounded-2xl shadow-2xl border border-orange-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider mb-0.5">{t('selectedLocation')}</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{selectedLocation.address}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Instructions when no location selected */
                <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t('clickOnMap')}</p>
                      <p className="text-xs text-gray-500">{t('orDragMarker')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - fixed at bottom, no scroll needed */}
          <div className="px-4 py-3 border-t bg-white flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMap(false)}
              className="flex-1 h-11 border-2 hover:bg-gray-50 font-semibold"
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {t('confirmLocation')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
