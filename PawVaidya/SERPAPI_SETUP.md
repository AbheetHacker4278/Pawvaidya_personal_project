# SerpAPI Setup Guide for Emergency Locator

## Overview
The Emergency Pet Care Locator now uses **SerpAPI** instead of Google Maps API. SerpAPI provides:
- ✅ Easier setup (no billing required)
- ✅ Free tier with 100 searches/month
- ✅ Real-time Google Local search results
- ✅ No complex API restrictions
- ✅ Works with OpenStreetMap (Leaflet) for map display

## How to Get SerpAPI Key

### Step 1: Sign Up for SerpAPI
1. Visit: https://serpapi.com/
2. Click "Sign Up" or "Get Started Free"
3. Create account with email or Google

### Step 2: Get Your API Key
1. After signing in, go to: https://serpapi.com/manage-api-key
2. Your API key will be displayed on the dashboard
3. Copy the API key (looks like: `abc123def456...`)

### Step 3: No Additional Setup Required!
- ✅ No billing information needed for free tier
- ✅ No API restrictions to configure
- ✅ No complex permissions
- ✅ Start using immediately

## Where to Replace the API Key

### File 1: Admin Emergency Locator
**Path:** `admin/src/pages/Admin/EmergencyLocator.jsx`
**Line:** 17

Replace:
```javascript
const SERPAPI_KEY = 'YOUR_SERPAPI_KEY';
```

With:
```javascript
const SERPAPI_KEY = 'your_actual_serpapi_key_here';
```

### File 2: Frontend Emergency Locator
**Path:** `frontend/src/pages/EmergencyLocator.jsx`
**Line:** 15

Replace:
```javascript
const SERPAPI_KEY = 'YOUR_SERPAPI_KEY';
```

With:
```javascript
const SERPAPI_KEY = 'your_actual_serpapi_key_here';
```

## Alternative: Use Environment Variables (Recommended)

### Step 1: Create .env file in admin folder
**Path:** `admin/.env`
```
VITE_SERPAPI_KEY=your_actual_serpapi_key_here
```

### Step 2: Create .env file in frontend folder
**Path:** `frontend/.env`
```
VITE_SERPAPI_KEY=your_actual_serpapi_key_here
```

### Step 3: Update the code to use environment variable
Replace the hardcoded key with:
```javascript
const SERPAPI_KEY = import.meta.env.VITE_SERPAPI_KEY;
```

### Step 4: Add .env to .gitignore
Make sure `.env` is in your `.gitignore` file to keep your API key secure:
```
.env
.env.local
```

## Pricing Information

### Free Tier
- SerpAPI provides **100 free searches per month**
- Perfect for testing and small applications
- No credit card required for free tier

### Paid Plans (if needed)
- **Starter:** $50/month - 5,000 searches
- **Developer:** $130/month - 15,000 searches
- **Production:** $250/month - 30,000 searches
- Much more affordable than Google Maps API

## Testing the Setup

After adding your API key:

1. **Clear browser cache** (Ctrl + Shift + Delete)
2. **Restart development server**
3. Navigate to Emergency Locator page
4. Click "Find Nearby Vets"
5. Allow location access when prompted
6. OpenStreetMap should load
7. Nearby veterinary clinics will appear on map and in list

## Troubleshooting

### Error: "Failed to search for veterinary clinics"
- Check if SerpAPI key is correct
- Verify you haven't exceeded free tier limit (100/month)
- Check browser console for detailed error

### Map loads but no results
- Ensure location permissions are granted
- Check if SerpAPI returned results (console.log)
- Try a different location

### Map doesn't display
- Check if Leaflet CSS and JS are loading
- Open browser console for errors
- Ensure mapRef is properly initialized

### API Key Issues
- Double-check the API key is copied correctly
- No extra spaces or characters
- Key is active on SerpAPI dashboard
- Check usage limits on dashboard

## Security Best Practices

1. ✅ Use environment variables, never commit API keys to Git
2. ✅ Monitor usage on SerpAPI dashboard
3. ✅ Set up usage alerts (available in dashboard)
4. ✅ Regenerate key if accidentally exposed
5. ✅ Use server-side proxy for production (recommended)

## Technology Stack

### SerpAPI
- **Purpose:** Search for nearby veterinary clinics
- **Docs:** https://serpapi.com/google-local-results
- **Dashboard:** https://serpapi.com/dashboard

### Leaflet (OpenStreetMap)
- **Purpose:** Display interactive map
- **Docs:** https://leafletjs.com/
- **Free:** No API key required
- **CDN:** Loaded automatically

### Nominatim (OpenStreetMap)
- **Purpose:** Reverse geocoding (coordinates to location name)
- **Free:** No API key required
- **Docs:** https://nominatim.org/

## Support Links

- SerpAPI Documentation: https://serpapi.com/google-local-results
- SerpAPI Playground: https://serpapi.com/playground
- Leaflet Documentation: https://leafletjs.com/reference.html
- OpenStreetMap: https://www.openstreetmap.org/

---

**Note:** Keep your API key secure and never share it publicly or commit it to version control!
