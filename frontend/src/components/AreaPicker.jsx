import { useEffect, useState } from 'react';
import { reverseGeocodeLocality, searchLocality } from '../services/weatherApi';

function toLocationOption(location) {
  return {
    name: location.area || location.name.split('(')[0].trim(),
    displayName: location.name,
    latitude: Number(location.latitude ?? location.lat),
    longitude: Number(location.longitude ?? location.lon)
  };
}

export default function AreaPicker({ label, placeholder, value, onSelect }) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setQuery(value?.name || '');
  }, [value?.name]);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2 || value?.name === search) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const matches = await searchLocality(search);
        if (active) {
          const candidates = matches.map(toLocationOption).filter((place) => place.name && Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
          setResults([...new Map(candidates.map((place) => [place.name.toLowerCase(), place])).values()]);
        }
      } catch {
        if (active) setError('Area search is unavailable. Try again or use your current location.');
      } finally {
        if (active) setSearching(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, value?.name]);

  const handleChoose = (place) => {
    onSelect(place);
    setQuery(place.name);
    setResults([]);
    setError('');
  };

  const handleQueryChange = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setResults([]);
    setError('');
    if (nextQuery !== value?.name) onSelect(null);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Location detection is not supported by this browser. Search for your area instead.');
      return;
    }

    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);
        try {
          const place = await reverseGeocodeLocality(latitude, longitude);
          if (!place) {
            setError('Your coordinates were detected, but the area could not be identified. Search for your area instead.');
            return;
          }
          handleChoose(place);
        } catch {
          setError('Could not identify this location. Search for your area instead.');
        } finally {
          setLocating(false);
        }
      },
      (locationError) => {
        setError(locationError.code === 1
          ? 'Location permission was denied. Allow access in your browser or search for your area.'
          : 'Could not detect your location. Search for your area instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  return (
    <div className="area-picker">
      <label className="auth-field area-picker-label">
        {label}
        <input
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={results.length > 0}
          aria-label={label}
          autoComplete="off"
          value={query}
          onChange={handleQueryChange}
          placeholder={placeholder}
        />
      </label>
      {searching && <p className="area-picker-state">Searching locations...</p>}
      {results.length > 0 && <ul className="area-picker-results" role="listbox">
        {results.map((place) => <li key={`${place.name}-${place.latitude}-${place.longitude}`}>
          <button type="button" role="option" onClick={() => handleChoose(place)}>{place.displayName || place.name}</button>
        </li>)}
      </ul>}
      {query.trim().length >= 2 && !searching && !results.length && !value && <p className="area-picker-state">No matches found. Try a nearby city or locality.</p>}
      <button className="current-location-button" type="button" onClick={handleCurrentLocation} disabled={locating}>
        {locating ? 'Finding current location...' : '📍 Use My Current Location'}
      </button>
      {error && <p className="area-picker-error" role="alert">{error}</p>}
      {value && <p className="area-picker-selected">Selected area: {value.name}{value.displayName && value.displayName !== value.name ? ` · ${value.displayName}` : ''}</p>}
    </div>
  );
}