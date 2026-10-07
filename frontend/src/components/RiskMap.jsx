import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapCenter({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 12, { animate: true });
  }, [center, map]);

  return null;
}

export default function RiskMap({ selectedLocation, onLocationChange, reports = [], hotspots = [], risk = {}, compact = false }) {
  const center = [selectedLocation?.latitude ?? 17.6599, selectedLocation?.longitude ?? 75.9067];
  const riskColors = {
    LOW: '#16a34a',
    MODERATE: '#fbbf24',
    HIGH: '#f97316',
    'VERY HIGH': '#ef4444'
  };

  return (
    <div className={`map-wrapper ${compact ? 'compact' : ''}`}>
      <MapContainer center={center} zoom={compact ? 9 : 12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenter center={center} />

        {hotspots.map((hotspot, index) => (
          <CircleMarker
            key={hotspot.id || `${hotspot.latitude}-${hotspot.longitude}-${index}`}
            center={[hotspot.latitude, hotspot.longitude]}
            radius={12}
            pathOptions={{ color: '#1d4ed8', fillColor: '#60a5fa', fillOpacity: 0.8 }}
          >
            <Popup>
              <strong>{hotspot.name}</strong><br />
              Reports: {hotspot.reports}<br />
              Risk: {hotspot.risk}
            </Popup>
          </CircleMarker>
        ))}

        {reports.map((report, index) => {
          const tone = report.severity === 'High' ? '#ef4444' : report.severity === 'Medium' ? '#f59e0b' : '#10b981';
          return (
            <CircleMarker
              key={report._id || `${report.location}-${index}`}
              center={[report.latitude, report.longitude]}
              radius={8}
              pathOptions={{ color: tone, fillColor: tone, fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{report.location}</strong><br />
                {report.problemType}<br />
                Severity: {report.severity}
              </Popup>
            </CircleMarker>
          );
        })}

        <CircleMarker
          center={center}
          radius={14}
          pathOptions={{ color: riskColors[risk.level] || '#4f46e5', fillColor: riskColors[risk.level] || '#4f46e5', fillOpacity: 0.8 }}
        >
          <Popup>
            <strong>{selectedLocation?.name || 'Selected location'}</strong><br />
            Latitude: {selectedLocation?.latitude}<br />
            Longitude: {selectedLocation?.longitude}<br />
            Risk Level: {risk.level || 'HIGH'}
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
