import React, { useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { toast } from 'react-toastify';

/**
 * LocationHandler component
 * Requests and maintains user location permission
 */
const LocationHandler = () => {
    const { fetchLocation, permission, hasLocation } = useGeolocation();

    useEffect(() => {
        // Automatically request location if not already granted or denied
        if (permission === 'prompt' && !hasLocation) {
            const requestLocation = async () => {
                try {
                    await fetchLocation();
                } catch (error) {
                    console.error('Location request failed:', error);
                }
            };
            requestLocation();
        }
    }, [permission, hasLocation, fetchLocation]);

    // This component doesn't render anything visible
    return null;
};

export default LocationHandler;
