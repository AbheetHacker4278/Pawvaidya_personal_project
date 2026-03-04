import React from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { RefreshCw, MapPin, Loader } from 'lucide-react';

/**
 * Location refresh button component
 * @param {Object} props - Component props
 * @param {Function} props.onLocationUpdate - Callback when location is updated
 * @param {string} props.variant - Button variant ('button', 'icon', 'text')
 * @param {string} props.size - Button size ('sm', 'md', 'lg')
 * @param {boolean} props.showStatus - Show location status
 * @param {Object} props.location - Current location object
 */
const LocationRefreshButton = ({ 
  onLocationUpdate, 
  variant = 'button', 
  size = 'md',
  showStatus = true,
  location = null 
}) => {
  const { refreshLocation, loading, error, hasLocation, isLocationValid } = useGeolocation();

  const handleRefresh = async () => {
    const newLocation = await refreshLocation();
    if (newLocation && onLocationUpdate) {
      onLocationUpdate(newLocation);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-lg';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  const getStatusColor = () => {
    if (loading) return 'text-blue-500';
    if (error) return 'text-red-500';
    if (hasLocation && isLocationValid) return 'text-green-500';
    return 'text-gray-400';
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const sizeClasses = getSizeClasses();
    
    if (loading) {
      return `${baseClasses} ${sizeClasses} bg-blue-50 text-blue-700 border border-blue-200`;
    }
    
    if (error) {
      return `${baseClasses} ${sizeClasses} bg-red-50 text-red-700 border border-red-200 hover:bg-red-100`;
    }
    
    if (hasLocation && isLocationValid) {
      return `${baseClasses} ${sizeClasses} bg-green-50 text-green-700 border border-green-200 hover:bg-green-100`;
    }
    
    return `${baseClasses} ${sizeClasses} bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100`;
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleRefresh}
        disabled={loading}
        className={`p-2 rounded-full transition-colors ${getButtonClasses()}`}
        title="Refresh location"
      >
        {loading ? (
          <Loader className={`animate-spin ${getIconSize()}`} />
        ) : (
          <RefreshCw className={getIconSize()} />
        )}
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleRefresh}
        disabled={loading}
        className={`inline-flex items-center gap-1 text-sm transition-colors ${
          loading ? 'text-blue-500' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {loading ? (
          <Loader className={`animate-spin ${getIconSize()}`} />
        ) : (
          <RefreshCw className={getIconSize()} />
        )}
        Refresh Location
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className={getButtonClasses()}
      >
        {loading ? (
          <Loader className={`animate-spin mr-1 ${getIconSize()}`} />
        ) : (
          <RefreshCw className={`mr-1 ${getIconSize()}`} />
        )}
        {loading ? 'Updating...' : 'Refresh Location'}
      </button>
      
      {showStatus && (
        <div className={`flex items-center gap-1 text-xs ${getStatusColor()}`}>
          <MapPin className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />
          {hasLocation && isLocationValid ? 'Location active' : 'No location'}
        </div>
      )}
    </div>
  );
};

export default LocationRefreshButton;