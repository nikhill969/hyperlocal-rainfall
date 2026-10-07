import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CloudRain,
  ShieldAlert,
  Flame,
  FileText,
  MapPin,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  Compass
} from 'lucide-react';
import StatCard from '../components/StatCard';
import RiskCard from '../components/RiskCard';
import RiskMap from '../components/RiskMap';
import { fetchReports, fetchHotspots, fetchRisk, fetchWeather } from '../services/api';
import { calculateRisk } from '../utils/riskCalculator';

export default function Dashboard({ isDemoMode }) {
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState({
    lat: 19.0125,
    lon: 72.8436,
    name: 'Hindmata Flyover Underpass, Dadar'
  });
  const [currentRisk, setCurrentRisk] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);

  // Load summary metrics & reports on mount
  useEffect(() => {
    async function loadInitialData() {
      const [allReports, allHotspots] = await Promise.all([
        fetchReports(),
        fetchHotspots()
      ]);
      setReports(allReports || []);
      setHotspots(allHotspots || []);
    }
    loadInitialData();
  }, [isDemoMode]);

  // Load risk for default or selected location
  useEffect(() => {
    async function evaluateRisk() {
      setIsLoadingRisk(true);
      const weather = await fetchWeather(selectedLoc.lat, selectedLoc.lon, isDemoMode);
      setWeatherData(weather);

      // Try server risk endpoint
      const serverResult = await fetchRisk({
        lat: selectedLoc.lat,
        lon: selectedLoc.lon,
        rainfall: weather?.rainfall,
        elevation: weather?.elevation,
        isDemo: isDemoMode,
        locationName: selectedLoc.name
      });

      if (serverResult && serverResult.risk) {
        setCurrentRisk(serverResult.risk);
      } else {
        // Client-side fallback
        const local = calculateRisk({
          rainfall: weather?.rainfall || 35,
          elevation: weather?.elevation || 6,
          terrain: 'Flat',
          nearbyReportsCount: reports.length,
          highSeverityCount: reports.filter((r) => r.severity === 'High').length
        });
        setCurrentRisk({
          ...local,
          locationName: selectedLoc.name,
          latitude: selectedLoc.lat,
          longitude: selectedLoc.lon,
          rainfall: weather?.rainfall || 35,
          elevation: weather?.elevation || 6,
          terrain: 'Flat Basin',
          drainageCondition: 'Moderate',
          nearbyCitizenReportsCount: 4
        });
      }
      setIsLoadingRisk(false);
    }

    evaluateRisk();
  }, [selectedLoc, isDemoMode, reports.length]);

  const handleLocationSelect = (lat, lon, name) => {
    setSelectedLoc({ lat, lon, name: name || `Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})` });
  };

  const activeReportsCount = reports.filter((r) => r.status !== 'Rejected').length;
  const highRiskHotspots = hotspots.filter((h) => h.riskLevel === 'Very High' || h.riskLevel === 'High').length;

  return (
    <div className="page-content">
      {/* Hero Environmental Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)',
          color: 'white',
          padding: '30px 32px',
          marginBottom: '26px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '780px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '12px' }}>
            <Sparkles size={13} />
            Academic EVS Engineering Project
          </div>

          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px', lineHeight: 1.2 }}>
            Hyperlocal Rainfall-Induced Waterlogging & Environmental Risk Mapping
          </h1>

          <p style={{ fontSize: '0.92rem', color: '#d1fae5', lineHeight: 1.5, marginBottom: '22px' }}>
            An environmental risk-mapping system that synthesizes precipitation data, terrain elevation,
            and citizen ground observations to pinpoint recurring waterlogging hotspots and localized vulnerability.
          </p>

          {/* Quick Action Navigation Buttons (Requirement 3) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link to="/map" className="btn btn-secondary">
              <Compass size={16} />
              Check Risk Map
            </Link>
            <Link to="/report" className="btn" style={{ background: '#ffffff', color: '#065f46' }}>
              <AlertTriangle size={16} style={{ color: '#d97706' }} />
              Report Waterlogging
            </Link>
            <Link to="/hotspots" className="btn btn-outline" style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}>
              <Flame size={16} style={{ color: '#f87171' }} />
              View Hotspots
            </Link>
            <Link to="/analytics" className="btn btn-outline" style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}>
              <FileText size={16} />
              Analytics Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time Status / Demo Notice if triggered */}
      {isDemoMode && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: '20px', fontSize: '0.82rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} />
          <strong>Demo Data Active:</strong> Simulated rainfall and environmental factors are displayed for exhibition demonstration.
        </div>
      )}

      {/* Metric Stat Cards (Requirement 3) */}
      <div className="stat-grid">
        <StatCard
          label="Current Rainfall"
          value={`${weatherData?.rainfall ?? 35} mm`}
          subtext={weatherData?.weatherCondition || 'Precipitation monitored'}
          icon={<CloudRain size={24} />}
          iconBg="#f0f9ff"
          iconColor="#0284c7"
        />

        <StatCard
          label="Current Risk Summary"
          value={currentRisk?.riskLevel || 'High'}
          subtext={`Score: ${currentRisk?.totalScore || 72}/100 at inspected node`}
          icon={<ShieldAlert size={24} />}
          iconBg={currentRisk?.riskColor ? `${currentRisk.riskColor}22` : '#fee2e2'}
          iconColor={currentRisk?.riskColor || '#ef4444'}
        />

        <StatCard
          label="Active Citizen Reports"
          value={activeReportsCount}
          subtext={`${reports.filter((r) => r.status === 'Verified').length} Verified observations`}
          icon={<FileText size={24} />}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />

        <StatCard
          label="Recurring Hotspots"
          value={hotspots.length}
          subtext={`${highRiskHotspots} High-severity clusters`}
          icon={<Flame size={24} />}
          iconBg="#fff7ed"
          iconColor="#ea580c"
        />
      </div>

      {/* Main Interactive Map Preview & Risk Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)', gap: '22px', alignItems: 'start' }}>
        {/* Interactive Map Preview */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>Interactive Risk Map Preview</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Search or click on the map below to assess localized risk and view citizen reports.
              </span>
            </div>
            <Link to="/map" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              Full Map View <ArrowRight size={14} />
            </Link>
          </div>

          <RiskMap
            selectedLocation={selectedLoc}
            onLocationSelect={handleLocationSelect}
            citizenReports={reports}
            hotspots={hotspots}
            currentRisk={currentRisk}
            height="460px"
          />
        </div>

        {/* Selected Location Risk Result Card */}
        <div>
          <RiskCard
            riskData={currentRisk}
            isLoading={isLoadingRisk}
            onRecalculate={(simParams) => {
              const res = calculateRisk({
                rainfall: simParams.rainfall,
                elevation: currentRisk?.elevation || 6,
                terrain: simParams.terrainType,
                drainageCondition: simParams.drainageCondition,
                nearbyReportsCount: reports.length,
                highSeverityCount: reports.filter((r) => r.severity === 'High').length
              });
              setCurrentRisk({
                ...currentRisk,
                ...res,
                rainfall: simParams.rainfall,
                terrain: simParams.terrainType,
                drainageCondition: simParams.drainageCondition
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
