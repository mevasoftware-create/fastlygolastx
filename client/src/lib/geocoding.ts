/**
 * Google Maps Geocoding Utility
 * Converts address text to coordinates using Manus proxy
 */

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface GeocodeCache {
  [address: string]: GeocodeResult;
}

// Simple in-memory cache
const geocodeCache: GeocodeCache = {};

/**
 * Geocode an address to coordinates
 * Uses Manus Maps proxy for authentication
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim().length < 3) {
    return null;
  }

  const normalizedAddress = address.trim().toLowerCase();

  // Check cache first
  if (geocodeCache[normalizedAddress]) {
    return geocodeCache[normalizedAddress];
  }

  try {
    // Use Manus Maps proxy
    const response = await fetch('/api/map/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      console.error('Geocoding failed:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const geocodeResult: GeocodeResult = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };

      // Cache the result
      geocodeCache[normalizedAddress] = geocodeResult;

      return geocodeResult;
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Geocode multiple addresses in parallel
 */
export async function geocodeAddresses(addresses: string[]): Promise<(GeocodeResult | null)[]> {
  return Promise.all(addresses.map(addr => geocodeAddress(addr)));
}

/**
 * Calculate distance between two addresses
 */
export async function calculateDistanceBetweenAddresses(
  address1: string,
  address2: string
): Promise<number | null> {
  const [result1, result2] = await geocodeAddresses([address1, address2]);

  if (!result1 || !result2) {
    return null;
  }

  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = toRad(result2.lat - result1.lat);
  const dLon = toRad(result2.lng - result1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(result1.lat)) *
      Math.cos(toRad(result2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // in kilometers
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Clear geocode cache
 */
export function clearGeocodeCache(): void {
  Object.keys(geocodeCache).forEach(key => delete geocodeCache[key]);
}
