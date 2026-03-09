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
            localStorage.setItem('adminLocation', JSON.stringify(locationWithTimestamp));

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
        localStorage.removeItem('adminLocation');
        return await fetchLocation();
    }, [fetchLocation]);

    // Load cached location on mount
    useEffect(() => {
        const cachedLocation = localStorage.getItem('adminLocation');
        if (cachedLocation) {
            try {
                const parsedLocation = JSON.parse(cachedLocation);
                if (isLocationValid(parsedLocation, maxAge)) {
                    setLocation(parsedLocation);
                } else {
                    // Clear expired location
                    localStorage.removeItem('adminLocation');
                }
            } catch (error) {
                localStorage.removeItem('adminLocation');
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
