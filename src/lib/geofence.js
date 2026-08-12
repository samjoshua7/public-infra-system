/**
 * Calculate Great-Circle Distance between two coordinates using Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;

  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check whether a coordinate falls within a configured geofence radius.
 * If centerLat, centerLng, or radiusKm are null/undefined, geofencing is disabled.
 */
export function validateGeofence(lat, lng, centerLat, centerLng, radiusKm) {
  if (centerLat == null || centerLng == null || radiusKm == null || radiusKm <= 0) {
    return { isWithin: true, distanceKm: 0, geofenceActive: false };
  }

  const distanceKm = calculateDistanceKm(
    parseFloat(lat),
    parseFloat(lng),
    parseFloat(centerLat),
    parseFloat(centerLng)
  );

  return {
    isWithin: distanceKm <= parseFloat(radiusKm),
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    radiusKm: parseFloat(radiusKm),
    geofenceActive: true,
  };
}
