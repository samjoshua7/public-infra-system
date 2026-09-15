import { useState, useEffect, useCallback } from 'react';
import { getStoredLocation, setStoredLocation } from '../lib/geoUtils';

export const useUserLocation = () => {
  // Start with cached location if available so feed loads instantly
  const [coords, setCoords] = useState(() => getStoredLocation());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setPermissionStatus('unsupported');
      return Promise.reject(new Error('Geolocation not supported'));
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCoords(newCoords);
          setStoredLocation(newCoords);
          setPermissionStatus('granted');
          setLoading(false);
          resolve(newCoords);
        },
        (err) => {
          let msg = 'Could not access device location.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Showing all community reports.';
            setPermissionStatus('denied');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'Location information is currently unavailable.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'Location request timed out.';
          }
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  // Check initial permission state and auto-request location on every visit
  useEffect(() => {
    let mounted = true;

    const initLocation = async () => {
      if (typeof window !== 'undefined' && 'permissions' in navigator) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (!mounted) return;
          setPermissionStatus(status.state); // 'granted' | 'prompt' | 'denied'

          status.onchange = () => {
            if (mounted) {
              setPermissionStatus(status.state);
              if (status.state === 'granted') {
                requestLocation();
              }
            }
          };

          // If granted or prompt, query device GPS
          if (status.state !== 'denied') {
            requestLocation().catch(() => {});
          }
        } catch {
          // Fallback if query throws
          requestLocation().catch(() => {});
        }
      } else {
        requestLocation().catch(() => {});
      }
    };

    initLocation();

    return () => {
      mounted = false;
    };
  }, [requestLocation]);

  return {
    coords,
    loading,
    error,
    permissionStatus,
    requestLocation,
    hasCoords: Boolean(coords?.latitude && coords?.longitude),
  };
};
