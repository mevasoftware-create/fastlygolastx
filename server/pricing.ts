/**
 * Dynamic Pricing System
 * Calculates delivery price based on distance, time, and other factors
 */

export interface PricingConfig {
  baseFee: number; // Base delivery fee
  perKmRate: number; // Price per kilometer
  minPrice: number; // Minimum order price
  maxPrice: number; // Maximum order price
  peakHourMultiplier: number; // Peak hour price multiplier
  urgentDeliveryMultiplier: number; // Urgent delivery multiplier
}

export interface PricingInput {
  distanceKm: number;
  isUrgent?: boolean;
  isPeakHour?: boolean;
  vehicleType?: 'motorcycle' | 'car' | 'bicycle';
}

export interface PricingResult {
  basePrice: number;
  distancePrice: number;
  peakHourSurcharge: number;
  urgentSurcharge: number;
  vehicleSurcharge: number;
  totalPrice: number;
  breakdown: string[];
}

// Default pricing configuration for North Macedonia (MKD)
const DEFAULT_CONFIG: PricingConfig = {
  baseFee: 100, // 100 MKD base fee
  perKmRate: 20, // 20 MKD per km
  minPrice: 150, // Minimum 150 MKD
  maxPrice: 2000, // Maximum 2000 MKD
  peakHourMultiplier: 1.3, // 30% increase during peak hours
  urgentDeliveryMultiplier: 1.5, // 50% increase for urgent delivery
};

// Vehicle type multipliers
const VEHICLE_MULTIPLIERS = {
  bicycle: 0.8, // 20% discount for bicycle
  motorcycle: 1.0, // Standard price
  car: 1.3, // 30% increase for car
};

/**
 * Check if current time is peak hour (lunch: 11-14, dinner: 18-21)
 */
export function isPeakHour(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return (hour >= 11 && hour < 14) || (hour >= 18 && hour < 21);
}

/**
 * Calculate delivery price based on distance and other factors
 */
export function calculatePrice(
  input: PricingInput,
  config: PricingConfig = DEFAULT_CONFIG
): PricingResult {
  const { distanceKm, isUrgent = false, isPeakHour: isPeak = false, vehicleType = 'motorcycle' } = input;

  // Base price
  const basePrice = config.baseFee;

  // Distance-based price
  const distancePrice = distanceKm * config.perKmRate;

  // Vehicle type multiplier
  const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicleType] || 1.0;
  const vehicleSurcharge = (basePrice + distancePrice) * (vehicleMultiplier - 1);

  // Calculate subtotal before surcharges
  let subtotal = basePrice + distancePrice + vehicleSurcharge;

  // Peak hour surcharge
  const peakHourSurcharge = isPeak ? subtotal * (config.peakHourMultiplier - 1) : 0;

  // Urgent delivery surcharge
  const urgentSurcharge = isUrgent ? subtotal * (config.urgentDeliveryMultiplier - 1) : 0;

  // Total price
  let totalPrice = subtotal + peakHourSurcharge + urgentSurcharge;

  // Apply min/max constraints
  totalPrice = Math.max(config.minPrice, Math.min(config.maxPrice, totalPrice));

  // Round to nearest 10 MKD
  totalPrice = Math.round(totalPrice / 10) * 10;

  // Build breakdown
  const breakdown: string[] = [
    `Base fee: ${basePrice} MKD`,
    `Distance (${distanceKm.toFixed(1)} km): ${Math.round(distancePrice)} MKD`,
  ];

  if (vehicleSurcharge > 0) {
    breakdown.push(`Vehicle (${vehicleType}): +${Math.round(vehicleSurcharge)} MKD`);
  }

  if (peakHourSurcharge > 0) {
    breakdown.push(`Peak hour: +${Math.round(peakHourSurcharge)} MKD`);
  }

  if (urgentSurcharge > 0) {
    breakdown.push(`Urgent delivery: +${Math.round(urgentSurcharge)} MKD`);
  }

  return {
    basePrice: Math.round(basePrice),
    distancePrice: Math.round(distancePrice),
    peakHourSurcharge: Math.round(peakHourSurcharge),
    urgentSurcharge: Math.round(urgentSurcharge),
    vehicleSurcharge: Math.round(vehicleSurcharge),
    totalPrice,
    breakdown,
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate delivery time based on distance
 * Returns estimated time in minutes
 */
export function estimateDeliveryTime(distanceKm: number, vehicleType: 'motorcycle' | 'car' | 'bicycle' = 'motorcycle'): number {
  // Average speeds (km/h)
  const speeds = {
    bicycle: 15,
    motorcycle: 35,
    car: 30,
  };

  const speed = speeds[vehicleType];
  const travelTimeMinutes = (distanceKm / speed) * 60;

  // Add preparation time (5-10 minutes)
  const preparationTime = 7;

  // Add buffer for traffic and stops (20%)
  const totalTime = travelTimeMinutes + preparationTime;
  const withBuffer = totalTime * 1.2;

  return Math.round(withBuffer);
}
