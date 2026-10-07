import React, { useState, useEffect } from 'react';
import RiskMap from '../components/RiskMap';
import RiskCard from '../components/RiskCard';
import { fetchReports, fetchHotspots, fetchRisk, fetchWeather } from '../services/api';
import { calculateRisk } from '../utils/riskCalculator';

export default function RiskMapPage({ isDemoMode }) {
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState({
    lat: 19.0125,
    lon: 72.8436,
    name: 'Hindmata Flyover Underpass, Dadar East'
  });
  const [currentRisk, setCurrentRisk] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [reps, hots] = await Promise.all([fetchReports(), fetchHotspots()]);
      setReports(reps || []);
      setHotspots(hots || []);
    }
    loadData();
  }, [isDemoMode]);

  useEffect(() => {
    async function evaluate() {
      setIsLoading(true);
      const weather = await fetchWeather(selectedLoc.lat, selectedLoc.lon, isDemoMode);

      const serverRes = await fetchRisk({
        lat: selectedLoc.lat,
        lon: selectedLoc.lon,
        rainfall: weather?.rainfall,
        elevation: weather?.elevation,
        isDemo: isDemoMode,
        locationName: selectedLoc.name
      });

      if (serverRes && serverRes.risk) {
        setCurrentRisk(serverRes.risk);
      } else {
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
          nearbyCitizenReportsCount: 3
        });
      }
      setIsLoading(false);
    }

    evaluate();
  }, [selectedLoc, isDemoMode, reports.length]);

  const handleSelectLocation = (lat, lon, name) => {
    setSelectedLoc({
      lat,
      lon,
      name: name || `Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})`
    });
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '1.6rem' }}>Interactive Environmental Risk Map</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Click anywhere on the map or search a locality to evaluate localized environmental risk based on rainfall, elevation, terrain, and citizen observations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(330px, 1fr)', gap: '22px', alignItems: 'start' }}>
        <div className="card" style={{ padding: '16px' }}>
          <RiskMap
            selectedLocation={selectedLoc}
            onLocationSelect={handleSelectLocation}
            citizenReports={reports}
            hotspots={hotspots}
            currentRisk={currentRisk}
            height="580px"
          />
        </div>

        <div>
          <RiskCard
            riskData={currentRisk}
            isLoading={isLoading}
            onRecalculate={(sim) => {
              const res = calculateRisk({
                rainfall: sim.rainfall,
                elevation: currentRisk?.elevation || 6,
                terrain: sim.terrainType,
                drainageCondition: sim.drainageCondition,
                nearbyReportsCount: reports.length,
                highSeverityCount: reports.filter((r) => r.severity === 'High').length
              });
              setCurrentRisk({
                ...currentRisk,
                ...res,
                rainfall: sim.rainfall,
                terrain: sim.terrainType,
                drainageCondition: sim.drainageCondition
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
