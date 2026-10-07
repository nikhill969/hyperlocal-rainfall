/**
 * Geocoding & Location Search Services using OpenStreetMap Nominatim
 * Includes popular urban flood-prone presets for instant demonstration.
 */

export const POPULAR_LOCALITIES = [
  { name: 'Solapur (Navi Peth / Saat Rasta)', lat: 17.6599, lon: 75.9064, defaultRain: 42.0, elevation: 480, terrain: 'Moderate' },
  { name: 'Akkalkot (Bus Stand Road)', lat: 17.5256, lon: 76.2045, defaultRain: 35.0, elevation: 465, terrain: 'Moderate' },
  { name: 'Pandharpur (Station Road)', lat: 17.6778, lon: 75.3283, defaultRain: 38.0, elevation: 460, terrain: 'Flat' },
  { name: 'Pune (Shivajinagar Underpass)', lat: 18.5204, lon: 73.8567, defaultRain: 28.5, elevation: 560, terrain: 'Moderate' },
  { name: 'Mumbai (Hindmata Dadar East)', lat: 19.0125, lon: 72.8436, defaultRain: 45.0, elevation: 6, terrain: 'Depression / Flat' },
  { name: 'Mumbai (Gandhi Market, Sion)', lat: 19.0345, lon: 72.8592, defaultRain: 42.0, elevation: 5, terrain: 'Depression / Flat' },
  { name: 'Mumbai (Milan Subway, Santacruz)', lat: 19.0837, lon: 72.8398, defaultRain: 36.0, elevation: 8, terrain: 'Depression' },
  { name: 'Mumbai (Kurla West Station)', lat: 19.0685, lon: 72.8795, defaultRain: 48.0, elevation: 7, terrain: 'Flat' }
];

/**
 * Search locations via OpenStreetMap Nominatim API
 */
export async function searchLocality(query) {
  if (!query || query.trim().length < 2) return [];

  // Check local presets first for instant response
  const lower = query.toLowerCase();
  const matchedPresets = POPULAR_LOCALITIES.filter((p) => p.name.toLowerCase().includes(lower));

  try {
    const encoded = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'HyperlocalEnvironmentalRiskApp/1.0'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const results = data.map((item) => ({
        name: item.display_name,
        area: item.address?.suburb
          || item.address?.city_district
          || item.address?.city
          || item.address?.town
          || item.address?.village
          || item.address?.municipality
          || item.address?.county
          || item.display_name.split(',')[0],
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || 'locality'
      }));

      // Merge presets on top
      const combined = [...matchedPresets, ...results];
      return combined.slice(0, 7);
    }
  } catch (err) {
    console.warn('Nominatim search failed, returning preset matches:', err);
  }

  return matchedPresets;
}

async function fetchReverseLocation(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'HyperlocalEnvironmentalRiskApp/1.0'
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Reverse geocoding failed:', err);
  }
  return null;
}

/**
 * Reverse geocode coordinates to a human-readable address
 */
export async function reverseGeocode(lat, lon) {
  const data = await fetchReverseLocation(lat, lon);
  return data?.display_name || `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
}

export async function reverseGeocodeLocality(lat, lon) {
  const data = await fetchReverseLocation(lat, lon);
  const address = data?.address || {};
  const name = address.suburb || address.city_district || address.city || address.town
    || address.village || address.municipality || address.county || data?.display_name?.split(',')[0];
  return name ? { name, latitude: Number(lat), longitude: Number(lon), displayName: data?.display_name || name } : null;
}
