import React from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { IconFlame, IconAlertTriangle, IconCalendar, IconLayers } from './Icons';

/**
 * Creates custom styled HTML DivIcon for Leaflet with color badges
 */
export function createCustomMarkerIcon(color = '#059669', size = 30, text = '', isHotspot = false) {
  const pulseHtml = isHotspot
    ? `<div class="hotspot-pulse-ring" style="border-color: ${color};"></div>`
    : '';

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px;">
      ${pulseHtml}
      <div style="
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 700;
        font-size: 11px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        border: 2px solid #ffffff;
      ">
        ${text}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker-wrapper',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

/**
 * HotspotMarker component rendering on React-Leaflet
 */
export default function HotspotMarker({ hotspot, onSelect }) {
  if (!hotspot || !hotspot.centerLat || !hotspot.centerLon) return null;

  const color = hotspot.riskColor || (hotspot.riskLevel === 'Very High' ? '#ef4444' : '#f59e0b');
  const icon = createCustomMarkerIcon(color, 36, `H${hotspot.rank || ''}`, true);

  return (
    <>
      {/* Visual buffer circle for hotspot zone */}
      <Circle
        center={[hotspot.centerLat, hotspot.centerLon]}
        radius={400}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 4'
        }}
      />
      <Marker
        position={[hotspot.centerLat, hotspot.centerLon]}
        icon={icon}
        eventHandlers={{
          click: () => onSelect && onSelect(hotspot)
        }}
      >
        <Popup>
          <div style={{ minWidth: '220px', fontFamily: 'var(--font-sans)', padding: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <IconFlame size={16} color={color} />
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                Hotspot #{hotspot.rank}: {hotspot.name}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <span className={`risk-badge ${hotspot.badgeClass || 'high'}`} style={{ fontSize: '0.72rem' }}>
                {hotspot.riskLevel} Risk
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {hotspot.totalReports} Citizen Reports
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
              <strong>High Severity:</strong> {hotspot.highSeverityCount} | <strong>Medium:</strong> {hotspot.mediumSeverityCount}
            </div>

            {hotspot.problemBreakdown && (
              <div style={{ fontSize: '0.74rem', background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                {Object.entries(hotspot.problemBreakdown).map(([prob, count]) => (
                  <span key={prob} style={{ marginRight: '8px', display: 'inline-block' }}>
                    • {prob}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onSelect && onSelect(hotspot)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '5px 10px', fontSize: '0.76rem' }}
            >
              Inspect Risk Assessment
            </button>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
