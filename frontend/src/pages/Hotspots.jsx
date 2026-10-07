import React, { useState, useEffect } from 'react';
import {
  Flame,
  ShieldAlert,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import { fetchHotspots, fetchReports } from '../services/api';
import { createCustomMarkerIcon } from '../components/HotspotMarker';

export default function Hotspots({ isDemoMode }) {
  const [hotspots, setHotspots] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [clusterRadius, setClusterRadius] = useState(0.8);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHotspots() {
      setIsLoading(true);
      const [hots, reps] = await Promise.all([
        fetchHotspots(clusterRadius),
        fetchReports()
      ]);
      setHotspots(hots || []);
      setReports(reps || []);
      if (hots && hots.length > 0) {
        setSelectedHotspot(hots[0]);
      }
      setIsLoading(false);
    }
    loadHotspots();
  }, [clusterRadius, isDemoMode]);

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff7ed', color: '#c2410c', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px', border: '1px solid #fed7aa' }}>
            <Flame size={13} />
            Spatial Aggregation & Recurrence Engine
          </div>
          <h1 style={{ fontSize: '1.65rem' }}>Top Waterlogging Hotspots</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Recurring inundation clusters detected by spatially grouping historical and citizen-submitted observations within a localized radius.
          </p>
        </div>

        {/* Radius Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cluster Radius:</span>
          <select
            value={clusterRadius}
            onChange={(e) => setClusterRadius(Number(e.target.value))}
            className="form-control"
            style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
          >
            <option value="0.5">500 meters (Micro-streets)</option>
            <option value="0.8">800 meters (Neighborhood)</option>
            <option value="1.2">1.2 km (Locality Sector)</option>
          </select>
        </div>
      </div>

      {/* Grid: Hotspots Ranking List & Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.1fr) minmax(0, 1.4fr)', gap: '22px', alignItems: 'start' }}>
        {/* Left Column: Top Hotspots Ranking Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Identified Clusters ({hotspots.length})
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Sorted by frequency & severity
            </span>
          </div>

          {isLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Detecting spatial hotspots...
            </div>
          ) : hotspots.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No clusters detected with current radius.
            </div>
          ) : (
            hotspots.map((h) => {
              const isSelected = selectedHotspot?.id === h.id;
              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHotspot(h)}
                  className="card"
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    background: isSelected ? '#f0fdf4' : 'var(--bg-surface)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: h.rank === 1 ? '#ef4444' : h.rank === 2 ? '#f97316' : '#f59e0b',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        #{h.rank}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.96rem', color: 'var(--text-primary)' }}>{h.name}</h4>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Lat: {h.centerLat}° | Lon: {h.centerLon}°
                        </span>
                      </div>
                    </div>

                    <span className={`risk-badge ${h.badgeClass || 'high'}`} style={{ fontSize: '0.72rem' }}>
                      {h.riskLevel} Risk
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', marginBottom: '8px', fontSize: '0.74rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Total Reports</div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{h.totalReports}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>High Severity</div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ef4444' }}>{h.highSeverityCount}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Recurrence Score</div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-dark)' }}>{h.hotspotScore}/100</div>
                    </div>
                  </div>

                  {/* Problem Breakdown Tags */}
                  {h.problemBreakdown && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {Object.entries(h.problemBreakdown).map(([prob, count]) => (
                        <span
                          key={prob}
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-light)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {prob}: <strong>{count}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Hotspot Map & Focused Cluster Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '1rem' }}>Hotspot Spatial Clusters Map</h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Buffer zones show ~{clusterRadius * 1000}m influence
              </span>
            </div>

            <div style={{ height: '420px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
              <MapContainer
                center={selectedHotspot ? [selectedHotspot.centerLat, selectedHotspot.centerLon] : [19.04, 72.85]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {hotspots.map((h) => {
                  const color = h.riskColor || (h.riskLevel === 'Very High' ? '#ef4444' : '#f59e0b');
                  const isSelected = selectedHotspot?.id === h.id;
                  const icon = createCustomMarkerIcon(color, isSelected ? 40 : 32, `#${h.rank}`, true);

                  return (
                    <React.Fragment key={h.id}>
                      <Circle
                        center={[h.centerLat, h.centerLon]}
                        radius={clusterRadius * 600}
                        pathOptions={{
                          color: color,
                          fillColor: color,
                          fillOpacity: isSelected ? 0.28 : 0.15,
                          weight: isSelected ? 2.5 : 1.5,
                          dashArray: '3, 4'
                        }}
                      />
                      <Marker
                        position={[h.centerLat, h.centerLon]}
                        icon={icon}
                        eventHandlers={{ click: () => setSelectedHotspot(h) }}
                      >
                        <Popup>
                          <div style={{ minWidth: '180px', fontSize: '0.8rem' }}>
                            <strong>Hotspot #{h.rank}: {h.name}</strong>
                            <div style={{ marginTop: '4px' }}>Reports: {h.totalReports}</div>
                            <div>Risk Level: <strong>{h.riskLevel}</strong></div>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Focused Cluster Summary Card */}
          {selectedHotspot && (
            <div className="card" style={{ borderLeft: `5px solid ${selectedHotspot.riskColor || '#ef4444'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Selected Hotspot Detail: {selectedHotspot.name}
                </h4>
                <span className={`risk-badge ${selectedHotspot.badgeClass}`}>
                  {selectedHotspot.riskLevel} Risk
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '12px' }}>
                This locality shows recurring waterlogging vulnerability evidenced by {selectedHotspot.totalReports} citizen
                reports ({selectedHotspot.highSeverityCount} classified as high severity), indicating acute surface drainage
                chokepoints or depression bowl geometry.
              </p>

              {/* Underlying Reports Table preview */}
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Underlying Citizen Observations in this Cluster:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedHotspot.reportsSummary?.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-subtle)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.74rem'
                    }}
                  >
                    <span><strong>{r.problemType}</strong> by {r.name}</span>
                    <span className={`severity-badge ${r.severity}`}>{r.severity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
