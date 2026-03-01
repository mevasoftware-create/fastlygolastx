/**
 * Google Maps API Loader
 * Loads Google Maps API once globally at app startup
 * Ensures autocomplete and other services work without opening the map
 */

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

let loadPromise: Promise<void> | null = null;
let isLoaded = false;

export async function loadGoogleMapsAPI(): Promise<void> {
  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  // Return immediately if already loaded
  if (isLoaded || window.google?.maps) {
    isLoaded = true;
    return Promise.resolve();
  }

  loadPromise = (async () => {
    try {
      const scriptUrl = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&libraries=places,drawing,geometry,visualization,marker`;
      
      console.log('🗺️ Loading Google Maps API...');
      
      const response = await fetch(scriptUrl, {
        method: 'GET',
        headers: { 'Origin': window.location.origin },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const scriptContent = await response.text();
      
      const script = document.createElement('script');
      script.textContent = scriptContent;
      document.head.appendChild(script);
      
      // Wait for Google Maps to be available
      await new Promise<void>((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkInterval);
            isLoaded = true;
            console.log('✅ Google Maps API loaded successfully');
            resolve();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.google?.maps) {
            reject(new Error('Google Maps API failed to load within 10 seconds'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('❌ Failed to load Google Maps API:', error);
      loadPromise = null; // Reset so it can be retried
      throw error;
    }
  })();

  return loadPromise;
}

export function isGoogleMapsLoaded(): boolean {
  return isLoaded && !!window.google?.maps;
}
