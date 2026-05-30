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
  location = null,
  theme = 'light'
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
        return 'px-2.5 py-1.5 text-xs';
      case 'lg':
        return 'px-5 py-2.5 text-lg';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3.5 h-3.5';
      case 'lg':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  const getStatusColor = () => {
    if (loading) return 'text-blue-400';
    if (error) return 'text-red-400';
    if (hasLocation && isLocationValid) return 'text-emerald-400';
    return theme === 'dark' ? 'text-white/40' : 'text-gray-400';
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center rounded-full font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm';
    const sizeClasses = getSizeClasses();
    
    if (loading) {
      return `${baseClasses} ${sizeClasses} bg-blue-500/10 text-blue-400 border border-blue-500/20`;
    }
    
    if (error) {
      return `${baseClasses} ${sizeClasses} bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20`;
    }
    
    if (hasLocation && isLocationValid) {
      if (theme === 'dark') {
        return `${baseClasses} ${sizeClasses} bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25`;
      }
      return `${baseClasses} ${sizeClasses} bg-green-50 text-green-700 border border-green-200 hover:bg-green-100`;
    }
    
    if (theme === 'dark') {
      return `${baseClasses} ${sizeClasses} bg-white/10 text-white border border-white/10 hover:bg-white/20`;
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