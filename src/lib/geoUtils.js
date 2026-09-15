/**
 * Geospatial distance calculation & formatting utilities
 */

const STORAGE_KEY = 'civic_last_user_location';

/**
 * Calculates straight-line distance in kilometers between two GPS coordinates using Haversine formula.
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lon1 === null ||
    lon1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lon2 === null ||
    lon2 === undefined
  ) {
    return null;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

/**
 * Formats a distance in kilometers into a friendly civic string e.g. "450 m away" or "2.4 km away".
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return '';
  }

  const dist = parseFloat(distanceKm);
  if (dist < 0.05) {
    return 'Right here (< 50m)';
  }
  if (dist < 1) {
    return `${Math.round(dist * 1000)} m away`;
  }
  return `${dist.toFixed(1)} km away`;
};

/**
 * Retrieve last saved GPS coordinates from localStorage.
 */
export const getStoredLocation = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
      return parsed;
    }
  } catch (err) {
    console.warn('Could not read stored location:', err);
  }
  return null;
};

/**
 * Cache current GPS coordinates in localStorage for instantaneous subsequent loads.
 */
export const setStoredLocation = (coords) => {
  try {
    if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: Date.now(),
      })
    );
  } catch (err) {
    console.warn('Could not store location:', err);
  }
};
