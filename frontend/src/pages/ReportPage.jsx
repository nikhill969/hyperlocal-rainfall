import React, { useState } from 'react';
import ReportForm from '../components/ReportForm';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import { createCustomMarkerIcon } from '../components/HotspotMarker';
import { reverseGeocode } from '../services/weatherApi';
import { MapPin, Info, CheckCircle } from 'lucide-react';

function LocationPickerEvents({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function ReportPage() {
  const [pickedLat, setPickedLat] = useState(19.0125);
  const [pickedLon, setPickedLon] = useState(72.8436);
  const [pickedLocName, setPickedLocName] = useState('Hindmata Flyover, Dadar');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMapPick = async (lat, lon) => {
    setPickedLat(lat);
    setPickedLon(lon);
    const addr = await reverseGeocode(lat, lon);
    setPickedLocName(addr);
  };

  const pickerIcon = createCustomMarkerIcon('#ef4444', 32, '📍', true);

  return (
    <div className="page-content">
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '1.6rem' }}>Report Waterlogging or Drainage Blockage</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Submit real-time ground observations to assist municipal environmental risk assessments and identify recurring local hotspots.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 1fr)', gap: '24px', alignItems: 'start' }}>
        {/* Left: Reporting Form */}
        <div>
          <ReportForm
            initialLat={pickedLat}
            initialLon={pickedLon}
            initialLoc={pickedLocName}
            onReportSubmitted={() => setRefreshTrigger((prev) => prev + 1)}
          />
        </div>

        {/* Right: Interactive Coordinate Picker Map & Guidelines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1rem' }}>Click Map to Pick Location</h3>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Lat: {pickedLat.toFixed(4)}, Lon: {pickedLon.toFixed(4)}
              </span>
            </div>

            <div style={{ height: '320px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
              <MapContainer
                center={[pickedLat, pickedLon]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPickerEvents onPick={handleMapPick} />
                <Marker position={[pickedLat, pickedLon]} icon={pickerIcon} />
              </MapContainer>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
              💡 Click anywhere on the map to automatically fill coordinates in the form.
            </div>
          </div>

          {/* Academic / Reporting Notice */}
          <div className="card" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-primary)' }}>
              <Info size={16} style={{ color: 'var(--secondary)' }} />
              Reporting Guidelines & Verification Process
            </h4>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Submitted reports are initially tagged as <strong>Pending Verification</strong>.</li>
              <li>Verification is reviewed in the Admin panel to maintain high data quality.</li>
              <li>Multiple reports within 800m automatically generate recurring <strong>Hotspots</strong>.</li>
              <li>Clear descriptions and photos assist in calibrating localized elevation and drainage scores.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
