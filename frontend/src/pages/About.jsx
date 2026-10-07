import React from 'react';
import {
  BookOpen,
  Target,
  Cpu,
  Layers,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  GraduationCap,
  ShieldAlert,
  Compass,
  Code
} from 'lucide-react';

export default function About() {
  return (
    <div className="page-content" style={{ maxWidth: '1000px' }}>
      {/* Title */}
      <div style={{ marginBottom: '26px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#047857', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '8px', border: '1px solid #a7f3d0' }}>
          <GraduationCap size={15} />
          Academic EVS & Engineering Project Documentation
        </div>
        <h1 style={{ fontSize: '1.9rem', marginBottom: '8px' }}>
          About the Hyperlocal Environmental Risk Mapping System
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          An integrated platform bridging meteorological precipitation data, micro-topography,
          and crowd-sourced citizen science to identify recurring urban waterlogging hotspots.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* 1. Problem Statement */}
        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <h2 style={{ fontSize: '1.25rem' }}>1. The Problem</h2>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Traditional meteorological forecasts provide macro-level regional rainfall totals (e.g., “Mumbai: 65mm expected”),
            yet <strong>rainfall information alone does not identify which specific roads, railway subways, or local neighborhoods
            repeatedly experience severe waterlogging</strong>. Surface water accumulation depends on critical localized factors—such as
            road depression basins, coastal elevation, micro-terrain slope, and blocked stormwater drain inlets—which regional weather
            forecasts fail to capture.
          </p>
        </div>

        {/* 2. The Solution */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Target size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.25rem' }}>2. The Solution: Hyperlocal Assessment</h2>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Our application integrates real-time environmental data with <strong>citizen ground observations and historical spatial
            clustering</strong>. By fusing five key indicators—precipitation intensity, elevation vulnerability, terrain retention,
            drainage blockage reports, and crowd-sourced incident density—the system calculates a transparent localized risk score
            (0–100) and pinpoints persistent municipal hotspots.
          </p>
        </div>

        {/* 3. Technology Stack */}
        <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Cpu size={20} style={{ color: '#0284c7' }} />
            <h2 style={{ fontSize: '1.25rem' }}>3. Technology Stack</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.84rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px' }}>
              <strong>Frontend:</strong> React.js, React-Leaflet, OpenStreetMap, Recharts, Lucide Icons, Vanilla CSS
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px' }}>
              <strong>Backend:</strong> Node.js, Express.js REST API, Spatial Clustering Engine
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px' }}>
              <strong>Database:</strong> MongoDB & Mongoose with resilient local file-based fallback storage
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px' }}>
              <strong>APIs:</strong> Open-Meteo Weather API, Open-Elevation API, Nominatim Geocoding
            </div>
          </div>
        </div>

        {/* 4. Methodology & Scope */}
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Compass size={20} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.25rem' }}>4. Scope & Prototype Methodology</h2>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
            The system is explicitly positioned as a <strong>localized environmental risk assessment prototype</strong>,
            NOT a guaranteed flood-prediction technology. The prototype utilizes a transparent, rule-based scoring formula:
          </p>
          <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.82rem', fontFamily: 'monospace', lineHeight: 1.6 }}>
            • Rainfall Score: 0–40 pts (precipitation intensity)<br />
            • Elevation Score: 0–20 pts (low-lying vulnerability)<br />
            • Terrain Score: 0–15 pts (depression vs steep runoff)<br />
            • Drainage Score: 0–15 pts (catch-basin & drain status)<br />
            • Citizen Report Score: 0–10 pts (density of ground reports)<br />
            <strong>Total Risk Score: 0–100 pts</strong> (Low: 0-25 | Moderate: 26-50 | High: 51-75 | Very High: 76-100)
          </div>
        </div>

        {/* 5. Key Limitations */}
        <div className="card" style={{ borderLeft: '4px solid #64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Layers size={20} style={{ color: '#64748b' }} />
            <h2 style={{ fontSize: '1.25rem' }}>5. Identified Project Limitations</h2>
          </div>
          <ul style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Data Quality & Verification:</strong> Citizen observations require ground verification to filter spam or duplicates.</li>
            <li><strong>Local Calibration:</strong> Thresholds reflect prototype assumptions and must be calibrated with multi-season municipal hydraulic gauges.</li>
            <li><strong>Real-time Sensor Gaps:</strong> Automated ultrasonic water-level sensors in drains are not yet integrated into the academic prototype.</li>
            <li><strong>Tidal Synchronization:</strong> High tide synchrony (critical for coastal estuaries like Mumbai or Chennai) is approximated rather than hydraulically simulated.</li>
          </ul>
        </div>

        {/* 6. Future Scope */}
        <div className="card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Lightbulb size={20} style={{ color: 'var(--info)' }} />
            <h2 style={{ fontSize: '1.25rem' }}>6. Future Scope & Advancements</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', fontSize: '0.84rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '6px' }}>
              • <strong>Machine Learning Integration:</strong> Random Forest / Gradient Boosting once multi-year localized historical ground truth data is accumulated.
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '6px' }}>
              • <strong>GIS Drainage Networks:</strong> Underground stormwater pipe diameter and pump capacity layers.
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '6px' }}>
              • <strong>Automated Image Verification:</strong> Computer vision to estimate water depth from uploaded photos.
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '6px' }}>
              • <strong>Mobile PWA / Native App:</strong> Offline geolocation reporting for pedestrians and first responders.
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '6px' }}>
              • <strong>Municipal Alert Integration:</strong> Direct webhook dispatch to disaster management authorities.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
