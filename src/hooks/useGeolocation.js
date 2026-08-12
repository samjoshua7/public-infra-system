import { useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCoordinates = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errMessage = 'Geolocation is not supported by your browser.';
        setError(errMessage);
        return reject(new Error(errMessage));
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCoords(location);
          setLoading(false);
          resolve(location);
        },
        (err) => {
          let errMessage = 'Failed to get location.';
          if (err.code === err.PERMISSION_DENIED) {
            errMessage =
              'Location permission was denied. Geolocation is required to submit a public infrastructure report.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errMessage = 'Location information is unavailable.';
          } else if (err.code === err.TIMEOUT) {
            errMessage = 'Location request timed out.';
          }
          setError(errMessage);
          setLoading(false);
          reject(new Error(errMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return {
    coords,
    loading,
    error,
    getCoordinates,
  };
};
