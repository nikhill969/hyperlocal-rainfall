import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    }
  });
  return null;
}

export default function LocationPicker({ center, selected, onSelect }) {
  const mapCenter = [center?.latitude ?? 17.6599, center?.longitude ?? 75.9067];

  return (
    <div className="location-picker-map" aria-label="Choose the report location on the map">
      <MapContainer center={mapCenter} zoom={14} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onSelect={onSelect} />
        {selected && <CircleMarker center={[selected.latitude, selected.longitude]} radius={9} pathOptions={{ color: '#c2410c', fillColor: '#f97316', fillOpacity: 0.9 }} />}
      </MapContainer>
    </div>
  );
}