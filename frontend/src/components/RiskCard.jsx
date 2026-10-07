import React, { useState } from 'react';
import {
  IconShieldAlert,
  IconCloudRain,
  IconMapPin,
  IconUsers,
  IconCompass,
  IconInfo
} from './Icons';

/**
 * RiskCard Component (Section 7 & 19)
 * Displays Localized Environmental Risk Assessment:
 * Location, Coordinates, Rainfall, Elevation, Terrain, Citizen Reports,
 * Risk Score (0-100), Risk Level (LOW, MODERATE, HIGH, VERY HIGH),
 * explanation and mandatory disclaimer.
 */
export default function RiskCard({
  riskData,
  onRecalculate,
  isLoading = false
}) {
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [showSimControls, setShowSimControls] = useState(false);

  // Simulation controls state
  const [simRainfall, setSimRainfall] = useState(riskData?.rainfall || 25);
  const [simTerrain, setSimTerrain] = useState(riskData?.terrain || 'Flat');
  const [simDrainage, setSimDrainage] = useState(riskData?.drainageCondition || 'Moderate');

  if (!riskData) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <IconCompass size={40} color="var(--primary)" className="mx-auto" />
        <h3 style={{ fontSize: '1.1rem', marginTop: '12px', marginBottom: '6px', color: 'var(--text-primary)' }}>
          Select a Location
        </h3>
        <p style={{ fontSize: '0.85rem' }}>
          Click anywhere on the map or search an area to calculate localized environmental risk.
        </p>
      </div>
    );
  }

  const {
    locationName,
    latitude,
    longitude,
    rainfall,
    elevation,
    terrain,
    drainageCondition,
    nearbyCitizenReportsCount = 0,
    totalScore,
    riskLevel,
    riskColor,
    badgeClass,
    scores,
    explanation,
    disclaimer
  } = riskData;

  const handleApplySimulation = () => {
    if (onRecalculate) {
      onRecalculate({
        rainfall: Number(simRainfall),
        terrainType: simTerrain,
        drainageCondition: simDrainage
      });
    }
  };

  return (
    <div className="card" style={{ borderTop: `4px solid ${riskColor || 'var(--primary)'}` }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            LOCALIZED ENVIRONMENTAL RISK
          </span>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconMapPin size={18} color="var(--primary)" />
            <span style={{ wordBreak: 'break-word' }}>{locationName || 'Inspected Coordinates'}</span>
          </h3>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Latitude: <strong>{Number(latitude).toFixed(4)}°</strong> | Longitude: <strong>{Number(longitude).toFixed(4)}°</strong>
          </div>
        </div>

        <div className={`risk-badge ${badgeClass || 'moderate'}`} style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconShieldAlert size={14} />
          <span>{riskLevel || 'Moderate'}</span>
        </div>
      </div>

      {/* Main Score & Progress Bar */}
      <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Environmental Risk Score</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: riskColor, fontFamily: 'var(--font-heading)' }}>
            {totalScore} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 100</span>
          </span>
        </div>

        <div className="risk-meter-bar">
          <div
            className="risk-meter-fill"
            style={{
              width: `${Math.min(100, Math.max(5, totalScore))}%`,
              backgroundColor: riskColor
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span>Low (0-25)</span>
          <span>Moderate (26-50)</span>
          <span>High (51-75)</span>
          <span>Very High (76-100)</span>
        </div>
      </div>

      {/* Factor Grid matching Section 7 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <IconCloudRain size={14} color="var(--secondary)" />
            <span>Rainfall</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>
            {rainfall !== undefined ? rainfall : 0} <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>mm</span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <IconCompass size={14} color="#8b5cf6" />
            <span>Elevation</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>
            {elevation !== undefined ? elevation : 10} <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>m</span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <IconCompass size={14} color="#f59e0b" />
            <span>Terrain</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>
            {terrain || 'Moderate'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-main)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <IconUsers size={14} color="var(--primary)" />
            <span>Citizen Reports</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>
            {nearbyCitizenReportsCount} <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>reports</span>
          </div>
        </div>
      </div>

      {/* Transparent Sub-Score Breakdown Toggle */}
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--text-secondary)'
          }}
        >
          <span>Transparent Rule-Based Scoring Breakdown (Section 8)</span>
          <span style={{ fontSize: '0.9rem' }}>{showBreakdown ? '▲' : '▼'}</span>
        </button>

        {showBreakdown && scores && (
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted #e2e8f0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Rainfall Score (0–40):</span>
              <span style={{ fontWeight: 700 }}>{scores.rainfallScore?.score ?? scores.rainfall?.score ?? 0} pts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted #e2e8f0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Elevation Score (0–20):</span>
              <span style={{ fontWeight: 700 }}>{scores.elevationScore?.score ?? scores.elevation?.score ?? 0} pts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted #e2e8f0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Terrain Score (0–15):</span>
              <span style={{ fontWeight: 700 }}>{scores.terrainScore?.score ?? scores.terrain?.score ?? 0} pts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted #e2e8f0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Drainage Score (0–15):</span>
              <span style={{ fontWeight: 700 }}>{scores.drainageScore?.score ?? scores.drainage?.score ?? 0} pts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Citizen Reports Score (0–10):</span>
              <span style={{ fontWeight: 700 }}>{scores.citizenReportScore?.score ?? scores.citizen?.score ?? 0} pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Sensitivity / Simulation Controls */}
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => setShowSimControls(!showSimControls)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--secondary)'
          }}
        >
          <span>⚙️ {showSimControls ? 'Hide Parameter Simulator' : 'Simulate Weather / Terrain Changes'}</span>
        </button>

        {showSimControls && (
          <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px', marginTop: '10px' }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                <span>Simulated Rainfall:</span>
                <span style={{ color: 'var(--secondary)' }}>{simRainfall} mm</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="2"
                value={simRainfall}
                onChange={(e) => setSimRainfall(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--secondary)', marginTop: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Terrain Type</label>
                <select
                  value={simTerrain}
                  onChange={(e) => setSimTerrain(e.target.value)}
                  className="form-control"
                  style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                >
                  <option value="Flat">Flat Basin</option>
                  <option value="Depression">Road Depression</option>
                  <option value="Moderate">Moderate Slope</option>
                  <option value="Steep">Steep Terrain</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Drainage Condition</label>
                <select
                  value={simDrainage}
                  onChange={(e) => setSimDrainage(e.target.value)}
                  className="form-control"
                  style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                >
                  <option value="Good">Good</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Poor">Poor / Choked</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplySimulation}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '6px', fontSize: '0.8rem' }}
              disabled={isLoading}
            >
              {isLoading ? 'Recalculating...' : 'Apply Simulation'}
            </button>
          </div>
        )}
      </div>

      {/* Explanation */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '12px' }}>
        <strong>Explanation:</strong> “{explanation || 'The current risk level is influenced by rainfall conditions, geographic factors and available citizen observations.'}”
      </p>

      {/* Mandatory Disclaimer */}
      <div className="disclaimer-banner">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <IconInfo size={16} color="var(--secondary)" className="flex-shrink-0" />
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            <strong>Disclaimer:</strong> {disclaimer ||
              'This system provides localized environmental risk assessment and is not an official flood-warning or guaranteed flood-prediction system.'}
          </span>
        </div>
      </div>
    </div>
  );
}
