import fetch from 'node-fetch';

/**
 * Calculates the distance between two points on Earth using the Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Gets location data from an IP address
 * @param {string} ip 
 * @returns {Promise<{latitude: number, longitude: number, city: string, country: string}>}
 */
export const getLocationFromIP = async (ip) => {
    try {
        // Skip for localhost/private IPs or use defaults for development
        if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.')) {
            return { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', country: 'India' };
        }

        const response = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await response.json();

        if (data.status === 'success') {
            return {
                latitude: data.lat,
                longitude: data.lon,
                city: data.city,
                country: data.country
            };
        }
    } catch (error) {
        console.error("Geolocation error:", error);
    }
    return null;
};

/**
 * Checks for impossible travel between two events
 * @param {Object} lastLocation {lat, lon, timestamp}
 * @param {Object} currentLocation {lat, lon, timestamp}
 * @param {number} velocityThreshold km/h
 * @returns {Object} { isFraud: boolean, velocity: number, distance: number }
 */
export const checkImpossibleTravel = (lastLocation, currentLocation, velocityThreshold = 500) => {
    if (!lastLocation || !currentLocation || !lastLocation.latitude || !currentLocation.latitude) {
        return { isFraud: false, velocity: 0, distance: 0 };
    }

    const distance = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude
    );

    const timeDiffHours = (new Date(currentLocation.timestamp) - new Date(lastLocation.timestamp)) / (1000 * 60 * 60);

    if (timeDiffHours <= 0) return { isFraud: false, velocity: 0, distance };

    const velocity = distance / timeDiffHours;

    return {
        isFraud: velocity > velocityThreshold,
        velocity: Math.round(velocity),
        distance: Math.round(distance)
    };
};
