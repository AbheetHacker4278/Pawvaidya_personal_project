import { useState, useEffect, useCallback } from 'react';
import { getCurrentLocation, isLocationValid } from '../utils/geolocation';

/**
 * Custom hook for managing geolocation
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Automatically fetch location on mount
 * @param {number} options.maxAge - Maximum age of cached location in milliseconds
 * @returns {Object} Geolocation state and functions
 */
export const useGeolocation = ({ autoFetch = false, maxAge = 30 * 60 * 1000 } = {}) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'

  // Check geolocation permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermission(result.state);
      });
    }
  }, []);

  // Fetch current location
  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentLocation = await getCurrentLocation();
      const locationWithTimestamp = {
        ...currentLocation,
        timestamp: Date.now()
      };
      
      setLocation(locationWithTimestamp);
      setPermission('granted');
      
      // Save to localStorage for persistence
      localStorage.setItem('userLocation', JSON.stringify(locationWithTimestamp));
      
      console.log('Location updated successfully');
      return locationWithTimestamp;
    } catch (err) {
      setError(err.message);
      
      if (err.message.includes('denied')) {
        setPermission('denied');
        console.error('Location access denied. Please enable location permissions.');
      } else {
        console.error('Failed to get location. Please try again.');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh location (force update)
  const refreshLocation = useCallback(async () => {
    // Clear cached location to force fresh fetch
    localStorage.removeItem('userLocation');
    return await fetchLocation();
  }, [fetchLocation]);

  // Load cached location on mount
  useEffect(() => {
    const cachedLocation = localStorage.getItem('userLocation');
    if (cachedLocation) {
      try {
        const parsedLocation = JSON.parse(cachedLocation);
        if (isLocationValid(parsedLocation, maxAge)) {
          setLocation(parsedLocation);
        } else {
          // Clear expired location
          localStorage.removeItem('userLocation');
        }
      } catch (error) {
        localStorage.removeItem('userLocation');
      }
    }

    // Auto-fetch if enabled and no valid cached location
    if (autoFetch && !cachedLocation) {
      fetchLocation();
    }
  }, [autoFetch, fetchLocation, maxAge]);

  return {
    location,
    loading,
    error,
    permission,
    fetchLocation,
    refreshLocation,
    hasLocation: !!location,
    isLocationValid: location ? isLocationValid(location, maxAge) : false
  };
};

/**
 * Hook for managing doctor geolocation
 * @param {string} doctorId - Doctor ID
 * @returns {Object} Doctor geolocation state and functions
 */
export const useDoctorGeolocation = (doctorId) => {
  const [doctorLocation, setDoctorLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch doctor location from backend
  const fetchDoctorLocation = useCallback(async () => {
    if (!doctorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/location/${doctorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch doctor location');
      }
      
      const data = await response.json();
      setDoctorLocation(data.location);
      return data.location;
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch doctor location');
      return null;
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  // Update doctor location
  const updateDoctorLocation = useCallback(async (location) => {
    if (!doctorId || !location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctor/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('docToken')}`,
        },
        body: JSON.stringify({
          doctorId,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp || Date.now()
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update doctor location');
      }
      
      const data = await response.json();
      setDoctorLocation(data.location);
      console.log('Location updated successfully');
      return data.location;
    } catch (err) {
      setError(err.message);
      console.error('Failed to update location');
      return null;
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  return {
    doctorLocation,
    loading,
    error,
    fetchDoctorLocation,
    updateDoctorLocation
  };
};