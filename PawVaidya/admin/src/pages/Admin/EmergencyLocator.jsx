import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader, AlertCircle, Search, Phone, Clock } from 'lucide-react';

const EmergencyLocator = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [nearbyVets, setNearbyVets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  const SERPAPI_KEY = '00f37c3441854d431de3e46b1152bdc256622d8f1ea3c9f06a49591e2336ef2b';

  useEffect(() => {
    initializeLeafletMap();
  }, []);

  const initializeLeafletMap = () => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => createMap();
      document.head.appendChild(script);
    } else {
      createMap();
    }
  };

  const createMap = () => {
    if (mapRef.current && window.L && !leafletMapRef.current) {
      leafletMapRef.current = window.L.map(mapRef.current).setView([20.5937, 78.9629], 5);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(leafletMapRef.current);
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        
        const locationString = await getLocationName(location.lat, location.lng);
        setLocationName(locationString);
        
        if (leafletMapRef.current && window.L) {
          leafletMapRef.current.setView([location.lat, location.lng], 13);
          
          const userMarker = window.L.marker([location.lat, location.lng], {
            icon: window.L.divIcon({
              className: 'custom-user-marker',
              html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
              iconSize: [20, 20]
            })
          }).addTo(leafletMapRef.current);
          
          userMarker.bindPopup('Your Location').openPopup();
        }
        
        searchNearbyVets(location);
      },
      (error) => {
        setError('Unable to retrieve your location: ' + error.message);
        setLoading(false);
      }
    );
  };

  const getLocationName = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const city = data.address.city || data.address.town || data.address.village || data.address.state;
      const country = data.address.country;
      return `${city}, ${country}`;
    } catch (error) {
      console.error('Error getting location name:', error);
      return `${lat}, ${lng}`;
    }
  };

  const searchNearbyVets = async (location) => {
    try {
      setLoading(true);
      
      // Using Google Maps API via SerpAPI
      const query = 'veterinary clinic';
      const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&ll=@${location.lat},${location.lng},13z&type=search&api_key=${SERPAPI_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.local_results && data.local_results.length > 0) {
        // Format results to match our expected structure
        const formattedResults = data.local_results.map((place, index) => ({
          position: index,
          title: place.title,
          address: place.address,
          phone: place.phone,
          rating: place.rating,
          reviews: place.reviews,
          hours: place.hours,
          type: place.type,
          price: place.price,
          service_options: place.service_options,
          gps_coordinates: place.gps_coordinates || {
            latitude: location.lat + (Math.random() - 0.5) * 0.05,
            longitude: location.lng + (Math.random() - 0.5) * 0.05
          },
          place_id: place.place_id
        }));

        setNearbyVets(formattedResults);
        displayMarkers(formattedResults);
        setLoading(false);
      } else {
        setError('No veterinary clinics found nearby');
        setNearbyVets([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error searching vets:', error);
      setError('Failed to search for veterinary clinics: ' + error.message);
      setLoading(false);
    }
  };

  const displayMarkers = (places) => {
    if (!leafletMapRef.current || !window.L) return;
    
    markersRef.current.forEach(marker => leafletMapRef.current.removeLayer(marker));
    markersRef.current = [];

    places.forEach((place, index) => {
      if (place.gps_coordinates) {
        const marker = window.L.marker([place.gps_coordinates.latitude, place.gps_coordinates.longitude], {
          icon: window.L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${index + 1}</div>`,
            iconSize: [30, 30]
          })
        }).addTo(leafletMapRef.current);

        marker.bindPopup(`
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #10b981; font-size: 16px;">${place.title}</h3>
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;">${place.address || ''}</p>
            ${place.phone ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> ${place.phone}</p>` : ''}
            ${place.rating ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Rating:</strong> ⭐ ${place.rating} (${place.reviews || 0} reviews)</p>` : ''}
            ${place.type ? `<p style="margin: 5px 0; font-size: 12px; color: #10b981;">${place.type}</p>` : ''}
          </div>
        `);

        marker.on('click', () => {
          selectPlace(place);
        });

        markersRef.current.push(marker);
      }
    });

    // Adjust map to show all markers
    if (markersRef.current.length > 0) {
      const group = window.L.featureGroup(markersRef.current);
      leafletMapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  const selectPlace = (place) => {
    setSelectedPlace(place);
    
    if (leafletMapRef.current && place.gps_coordinates) {
      leafletMapRef.current.setView([place.gps_coordinates.latitude, place.gps_coordinates.longitude], 15);
    }
  };

  const getDirections = (place) => {
    if (userLocation && place.gps_coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${place.gps_coordinates.latitude},${place.gps_coordinates.longitude}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  const callPlace = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const calculateDistance = (place) => {
    if (!userLocation || !place.gps_coordinates) return 'N/A';
    
    const R = 6371;
    const dLat = (place.gps_coordinates.latitude - userLocation.lat) * Math.PI / 180;
    const dLon = (place.gps_coordinates.longitude - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(place.gps_coordinates.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">🚨 Emergency Pet Care Locator</h1>
        <p className="text-slate-600">Find nearby veterinary clinics and emergency pet care centers using Google Maps API</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={getUserLocation}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
            {loading ? 'Searching...' : 'Find Nearby Vets'}
          </button>

          {locationName && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200">
              <MapPin size={16} />
              <span className="font-medium">{locationName}</span>
            </div>
          )}
          
          {userLocation && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200">
              <span className="text-sm font-medium">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Map and Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
          <div
            ref={mapRef}
            className="w-full h-96 md:h-[600px] bg-slate-200"
          />
        </div>

        {/* Results List */}
        <div className="bg-white rounded-xl shadow-lg p-6 max-h-[600px] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">
            Nearby Veterinary Clinics ({nearbyVets.length})
          </h2>

          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader className="animate-spin text-emerald-500" size={40} />
              <p className="text-slate-600 text-sm">Searching for veterinary clinics...</p>
            </div>
          )}

          {!loading && nearbyVets.length === 0 && (
            <p className="text-center text-slate-500 py-8">
              Click "Find Nearby Vets" to search for emergency pet care centers
            </p>
          )}

          <div className="space-y-3">
            {nearbyVets.map((place, index) => (
              <div
                key={place.position || index}
                onClick={() => selectPlace(place)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlace?.position === place.position
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex gap-3">
                  <div className="bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 mb-1">{place.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">{place.address}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {place.rating && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-200">
                          ⭐ {place.rating}{place.reviews ? ` (${place.reviews})` : ''}
                        </span>
                      )}
                      {place.type && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded border border-purple-200">
                          {place.type}
                        </span>
                      )}
                      {place.price && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">
                          {place.price}
                        </span>
                      )}
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200 flex items-center gap-1">
                        <MapPin size={12} />
                        {calculateDistance(place)}
                      </span>
                    </div>

                    {place.hours && (
                      <div className="flex items-start gap-2 mb-3 text-sm text-slate-700">
                        <Clock size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{place.hours}</span>
                      </div>
                    )}

                    {place.service_options && place.service_options.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {place.service_options.map((option, idx) => (
                            <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {place.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            callPlace(place.phone);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                        >
                          <Phone size={16} />
                          Call Now
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          getDirections(place);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Navigation size={16} />
                        Directions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Info */}
      <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-red-700 mb-3">⚠️ Emergency Tips</h2>
        <ul className="space-y-2 text-red-800">
          <li>• Call ahead to inform the clinic about your emergency</li>
          <li>• Keep your pet calm and comfortable during transport</li>