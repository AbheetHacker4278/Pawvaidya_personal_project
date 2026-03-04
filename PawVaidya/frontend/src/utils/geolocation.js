// Geolocation utility functions

/**
 * Get current geolocation with error handling
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
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
 * Filter doctors by distance from user location
 * @param {Array} doctors - Array of doctor objects
 * @param {number} userLat - User latitude
 * @param {number} userLon - User longitude
 * @param {number} maxDistance - Maximum distance in kilometers (default: 50)
 * @returns {Array} Filtered doctors sorted by distance
 */
export const filterDoctorsByDistance = (doctors, userLat, userLon, maxDistance = 50) => {
  if (!doctors || !userLat || !userLon) return [];
  
  return doctors
    .map(doctor => {
      if (doctor.location && doctor.location.latitude && doctor.location.longitude) {
        const distance = calculateDistance(
          userLat,
          userLon,
          doctor.location.latitude,
          doctor.location.longitude
        );
        return { ...doctor, distance };
      }
      return { ...doctor, distance: Infinity };
    })
    .filter(doctor => doctor.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance === Infinity) return 'Distance unknown';
  if (distance < 1) return `${Math.round(distance * 1000)}m away`;
  if (distance < 10) return `${distance.toFixed(1)}km away`;
  return `${Math.round(distance)}km away`;
};

/**
 * Check if location is still valid (not older than maxAge)
 * @param {Object} location - Location object with timestamp
 * @param {number} maxAge - Maximum age in milliseconds (default: 30 minutes)
 * @returns {boolean} True if location is still valid
 */
export const isLocationValid = (location, maxAge = 30 * 60 * 1000) => {
  if (!location || !location.timestamp) return false;
  return Date.now() - location.timestamp < maxAge;
};