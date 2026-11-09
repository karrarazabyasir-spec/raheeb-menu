/**
 * Distance and Delivery Cost Calculation Utilities
 */

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula (in kilometers).
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth's mean radius in kilometers
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place (e.g. 3.4 km)
  return Math.round(distance * 10) / 10;
}

/**
 * Calculates the final delivery fee based on distance and settings.
 */
export function calculateDeliveryFee({
  distanceKm,
  costPerKm,
  minFee = 0,
  baseFee = 0,
  freeDeliveryThreshold,
  subtotal = 0,
}: {
  distanceKm: number;
  costPerKm: number;
  minFee?: number;
  baseFee?: number;
  freeDeliveryThreshold?: number;
  subtotal?: number;
}): { fee: number; isFree: boolean; rawFee: number } {
  // Check if free delivery applies
  if (
    freeDeliveryThreshold &&
    freeDeliveryThreshold > 0 &&
    subtotal >= freeDeliveryThreshold
  ) {
    return { fee: 0, isFree: true, rawFee: 0 };
  }

  const calculated = (baseFee || 0) + (distanceKm || 0) * (costPerKm || 0);
  const withMin = Math.max(minFee || 0, calculated);

  // Round to nearest 250 IQD or whole number
  const fee = Math.round(withMin / 250) * 250 || Math.round(withMin);

  return { fee, isFree: false, rawFee: calculated };
}
