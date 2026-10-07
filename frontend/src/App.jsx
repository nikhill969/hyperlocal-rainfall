import { useEffect, useState } from 'react';
import './App.css';
import RiskMap from './components/RiskMap';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import { getAnalytics, getHotspots, getReports, getRisk, getWeather, verifyReport, deleteReport } from './services/api';
import { calculateRisk } from './utils/riskCalculator';

const defaultLocation = { name: 'Solapur', latitude: 17.6599, longitude: 75.9067 };

function App() {
  const [page, setPage] = useState('reports');
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation);
  const [weatherInfo, setWeatherInfo] = useState({
    weather: { rainfall: 42, temperature: 28, condition: 'Rainy' },
    message: 'Demo data is currently being displayed.',
    demoMode: true
  });
  const [riskInfo, setRiskInfo] = useState({
    risk: { score: 68, level: 'HIGH', note: 'Prototype rule-based calculation.' },
    rainfall: 42,
    citizenReports: 7,
    location: { elevation: 480, terrain: 'Moderate' }
  });
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchText, setSearchText] = useState('');

  const loadData = async (location = selectedLocation) => {
    setLoading(true);
    try {
      const [reportsResponse, hotspotsResponse, analyticsResponse, weatherResponse, riskResponse] = await Promise.all([
        getReports(),
        getHotspots(),
        getAnalytics(),
        getWeather(location.latitude, location.longitude),
        getRisk(location.latitude, location.longitude)
      ]);

      setReports(reportsResponse.reports || []);
      setHotspots(hotspotsResponse.hotspots || []);
      setAnalytics(analyticsResponse.analytics || null);
      setWeatherInfo(weatherResponse || { weather: { rainfall: 42, temperature: 28, condition: 'Rainy' } });
      setRiskInfo(riskResponse || { risk: { score: 68, level: 'HIGH' } });
    } catch (error) {
      setStatusMessage(error.message || 'Unable to load application data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateLocation = async (location) => {
    setSelectedLocation(location);
    setLoading(true);
    try {
      const [weatherResponse, riskResponse] = await Promise.all([
        getWeather(location.latitude, location.longitude),
        getRisk(location.latitude, location.longitude)
      ]);

      setWeatherInfo(weatherResponse || { weather: { rainfall: 42, temperature: 28, condition: 'Rainy' } });
      setRiskInfo(riskResponse || { risk: { score: 68, level: 'HIGH' } });
    } catch (error) {
      setStatusMessage('Location data could not be loaded. Demo data is shown instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const query = searchText.trim();
    if (!query) {
      setStatusMessage('Please enter a locality or area name.');
      return;
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const results = await response.json();

      if (!results || results.length === 0) {
        const fallback = {
          name: query,
          latitude: defaultLocation.latitude,
          longitude: defaultLocation.longitude
        };
        setSelectedLocation(fallback);
        await updateLocation(fallback);
        setStatusMessage('Location not found. Demo data is being displayed.');
        return;
      }

      const place = results[0];
      const nextLocation = {
        name: place.display_name.split(',')[0] || query,
        latitude: Number(place.lat),
        longitude: Number(place.lon)
      };

      setSelectedLocation(nextLocation);
      await updateLocation(nextLocation);
      setStatusMessage(`Showing results for ${nextLocation.name}.`);
    } catch (error) {
      const fallback = { name: query, latitude: 18.5204, longitude: 73.8567 };
      setSelectedLocation(fallback);
      await updateLocation(fallback);
      setStatusMessage('Search service is unavailable. Demo location is being displayed.');
    }
  };

  const handleReportSubmitted = async () => {
    await loadData();
    setPage('reports');
    setStatusMessage('Report submitted successfully.');
  };

  const handleVerify = async (id, status) => {
    try {
      await verifyReport(id, status);
      await loadData();
      setStatusMessage(`Report marked as ${status}.`);
    } catch (error) {
      setStatusMessage(error.message || 'Unable to update report.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReport(id);
      await loadData();
      setStatusMessage('Report deleted successfully.');
    } catch (error) {
      setStatusMessage(error.message || 'Unable to delete report.');
    }
  };

  const riskScore = typeof riskInfo?.risk?.score === 'number'
    ? riskInfo.risk
    : calculateRisk({
        rainfall: weatherInfo?.weather?.rainfall || 42,
        elevation: riskInfo?.location?.elevation || 480,
        terrain: riskInfo?.location?.terrain || 'Moderate',
        citizenReports: riskInfo?.citizenReports || 7
      });

  const currentRisk = {
    score: riskScore?.score ?? 0,
    level: riskScore?.level ?? 'HIGH',
    note: riskScore?.note ?? 'Prototype rule-based calculation.',
    rainfall: weatherInfo?.weather?.rainfall || 42,
    citizenReports: riskInfo?.citizenReports || 7,
    location: riskInfo?.location || { elevation: 480, terrain: 'Moderate' }
  };

  const renderPage = () => {
    switch (page) {
      case 'risk-map':
        return (
          <RiskMapPage
            selectedLocation={selectedLocation}
            onLocationChange={updateLocation}
            reports={reports}
            hotspots={hotspots}
            risk={currentRisk}
            searchText={searchText}
            setSearchText={setSearchText}
            handleSearch={handleSearch}
          />
        );
      case 'report':
        return <ReportPage onReportSubmitted={handleReportSubmitted} selectedLocation={selectedLocation} />;
      case 'reports':
        return <ReportsPage reports={reports} onVerify={handleVerify} onDelete={handleDelete} />;
      case 'hotspots':
        return <HotspotsPage hotspots={hotspots} reports={reports} selectedLocation={selectedLocation} onLocationChange={updateLocation} />;
      case 'analytics':
        return <AnalyticsPage analytics={analytics} reports={reports} hotspots={hotspots} />;
      case 'admin':
        return <AdminPage reports={reports} onVerify={handleVerify} onDelete={handleDelete} />;
      case 'about':
        return <AboutPage />;
      default:
        return (
          <DashboardPage
            onNavigate={setPage}
            selectedLocation={selectedLocation}
            weather={weatherInfo}
            risk={currentRisk}
            reports={reports}
            hotspots={hotspots}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Localized Environmental Risk Assessment</p>
          <h1>Hyperlocal Rainfall-Induced Waterlogging & Environmental Risk Mapping System</h1>
        </div>
        <div className="topbar-actions">
          <span className={`mode-pill ${weatherInfo?.demoMode ? 'demo' : 'live'}`}>
            {weatherInfo?.demoMode ? 'Demo Mode' : 'Live Mode'}
          </span>
        </div>
      </header>

      <nav className="main-nav">
        <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}>Home</button>
        <button className={page === 'risk-map' ? 'active' : ''} onClick={() => setPage('risk-map')}>Risk Map</button>
        <button className={page === 'report' ? 'active' : ''} onClick={() => setPage('report')}>Check Risk</button>
        <button className={page === 'report' ? 'active' : ''} onClick={() => setPage('report')}>Report Waterlogging</button>
        <button className={page === 'reports' ? 'active' : ''} onClick={() => setPage('reports')}>Citizen Reports</button>
        <button className={page === 'hotspots' ? 'active' : ''} onClick={() => setPage('hotspots')}>Hotspots</button>
        <button className={page === 'analytics' ? 'active' : ''} onClick={() => setPage('analytics')}>Analytics</button>
        <button className={page === 'admin' ? 'active' : ''} onClick={() => setPage('admin')}>Admin</button>
      </nav>

      {statusMessage && <div className="status-banner">{statusMessage}</div>}
      {loading && <div className="loading-banner">Loading data...</div>}

      <main className="page-body">{renderPage()}</main>

      <footer className="site-footer">
        <p>Prototype rule-based environmental risk assessment. Not an official flood-warning system.</p>
      </footer>
    </div>
  );
}

function DashboardPage({ onNavigate, selectedLocation, weather, risk, reports, hotspots }) {
  const stats = [
    { label: 'Current Rainfall', value: `${weather?.weather?.rainfall ?? risk.rainfall ?? 42} mm`, tone: 'blue' },
    { label: 'Active Reports', value: reports.length, tone: 'green' },
    { label: 'Verified Reports', value: reports.filter((r) => r.status === 'Verified').length, tone: 'orange' },
    { label: 'Waterlogging Hotspots', value: hotspots.length, tone: 'red' },
    { label: 'Current Risk', value: `${risk.score}/100`, tone: 'purple' }
  ];

  return (
    <div className="page-section">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Environmental dashboard</p>
          <h2>Localized Environmental Risk Assessment</h2>
          <p className="lead">
            A web-based system for assessing localized environmental risk using rainfall, geographic information and citizen observations.
          </p>
        </div>
        <div className="hero-actions">
          <button onClick={() => onNavigate('risk-map')}>Check Risk</button>
          <button className="secondary" onClick={() => onNavigate('report')}>Report Waterlogging</button>
        </div>
      </section>

      <div className="stats-grid">
        {stats.map((card) => (
          <div key={card.label} className={`stat-box ${card.tone}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="content-panel">
          <h3>Quick actions</h3>
          <div className="button-row">
            <button onClick={() => onNavigate('risk-map')}>View Risk Map</button>
            <button className="secondary" onClick={() => onNavigate('hotspots')}>View Hotspots</button>
          </div>
          <div className="mini-report-box">
            <h4>Location summary</h4>
            <p><strong>Location:</strong> {selectedLocation.name}</p>
            <p><strong>Latitude:</strong> {selectedLocation.latitude}</p>
            <p><strong>Longitude:</strong> {selectedLocation.longitude}</p>
            <p><strong>Rainfall:</strong> {weather?.weather?.rainfall ?? 42} mm</p>
            <p><strong>Risk Level:</strong> {risk.level}</p>
          </div>
        </div>

        <div className="content-panel map-preview-box">
          <h3>Map preview</h3>
          <RiskMap
            selectedLocation={selectedLocation}
            onLocationChange={() => {}}
            reports={reports.slice(0, 5)}
            hotspots={hotspots.slice(0, 4)}
            risk={{ score: risk.score, level: risk.level }}
            compact
          />
        </div>
      </div>
    </div>
  );
}

function RiskMapPage({ selectedLocation, onLocationChange, reports, hotspots, risk, searchText, setSearchText, handleSearch }) {
  return (
    <div className="page-section">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Interactive map</p>
          <h2>Environmental Risk Map</h2>
        </div>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search locality or area..."
        />
        <button type="submit">Search</button>
      </form>

      <div className="map-meta-grid">
        <div className="meta-box">
          <span>Location</span>
          <strong>{selectedLocation.name}</strong>
        </div>
        <div className="meta-box">
          <span>Latitude</span>
          <strong>{selectedLocation.latitude}</strong>
        </div>
        <div className="meta-box">
          <span>Longitude</span>
          <strong>{selectedLocation.longitude}</strong>
        </div>
        <div className="meta-box">
          <span>Risk Level</span>
          <strong>{risk.level}</strong>
        </div>
      </div>

      <RiskMap
        selectedLocation={selectedLocation}
        onLocationChange={onLocationChange}
        reports={reports}
        hotspots={hotspots}
        risk={risk}
      />
    </div>
  );
}

function ReportPage({ onReportSubmitted, selectedLocation }) {
  return (
    <div className="page-section">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Assessment</p>
          <h2>Check Environmental Risk</h2>
        </div>
      </div>

      <div className="risk-summary-box">
        <h3>ENVIRONMENTAL RISK</h3>
        <p><strong>Location:</strong> {selectedLocation.name}</p>
        <p><strong>Latitude:</strong> {selectedLocation.latitude}</p>
        <p><strong>Longitude:</strong> {selectedLocation.longitude}</p>
        <p><strong>Rainfall:</strong> 42 mm</p>
        <p><strong>Elevation:</strong> 480 m</p>
        <p><strong>Terrain:</strong> Moderate</p>
        <p><strong>Citizen Reports:</strong> 7</p>
        <p><strong>Risk Score:</strong> 68/100</p>
        <p><strong>Risk Level:</strong> HIGH</p>
        <p className="explanation">The current risk level is influenced by rainfall conditions, geographic factors and available citizen observations.</p>
        <p className="disclaimer">This system provides localized environmental risk assessment and is not an official flood-warning or guaranteed flood-prediction system.</p>
      </div>

      <ReportForm onReportSubmitted={onReportSubmitted} defaultLocation={selectedLocation} />
    </div>
  );
}

function ReportsPage({ reports, onVerify, onDelete }) {
  return (
    <div className="page-section">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Citizen observations</p>
          <h2>Citizen Reports</h2>
        </div>
      </div>
      <ReportList reports={reports} onVerify={onVerify} onDelete={onDelete} />
    </div>
  );
}

function HotspotsPage({ hotspots, reports, selectedLocation, onLocationChange }) {
  return (
    <div className="page-section">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Recurring issues</p>
          <h2>Waterlogging Hotspots</h2>
        </div>
      </div>
      <div className="hotspot-grid">
        {hotspots.map((hotspot) => (
          <div key={hotspot.id || hotspot.name} className="hotspot-card">
            <h4>{hotspot.name}</h4>
            <p>Reports: {hotspot.reports}</p>
            <p>Risk: {hotspot.risk}</p>
          </div>
        ))}
      </div>
      <RiskMap
        selectedLocation={selectedLocation}
        onLocationChange={onLocationChange}
        reports={reports}
        hotspots={hotspots}
        risk={{ score: 68, level: 'HIGH' }}
      />
    </div>
  );
}

function AnalyticsPage({ analytics, reports, hotspots }) {
  const total = reports.length || 1;
  const stats = [
    { label: 'Total Reports', value: analytics?.totalReports ?? reports.length },
    { label: 'Verified Reports', value: analytics?.verifiedReports ?? reports.filter((r) => r.status === 'Verified').length },
    { label: 'Pending Reports', value: analytics?.pendingReports ?? reports.filter((r) => r.status === 'Pending').length },
    { label: 'Rejected Reports', value: analytics?.rejectedReports ?? reports.filter((r) => r.status === 'Rejected').length },
    { label: 'High Severity Reports', value: analytics?.highSeverityReports ?? reports.filter((r) => r.severity === 'High').length },
    { label: 'Number of Hotspots', value: hotspots.length }
  ];

  return (
    <div className="page-section">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Data overview</p>
          <h2>Analytics</h2>
        </div>
      </div>

      <div className="stats-grid small-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-box green">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <div className="chart-panel">
          <h3>Reports by Severity</h3>
          {['Low', 'Medium', 'High'].map((level) => (
            <div key={level} className="bar-row">
              <span>{level}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(reports.filter((r) => r.severity === level).length / total) * 100}%` }} /></div>
            </div>
          ))}
        </div>

        <div className="chart-panel">
          <h3>Risk Distribution</h3>
          {['LOW', 'MODERATE', 'HIGH', 'VERY HIGH'].map((level) => (
            <div key={level} className="bar-row">
              <span>{level}</span>
              <div className="bar-track"><div className="bar-fill risk" style={{ width: `${Math.max(10, (Math.random() * 80) + 10)}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminPage({ reports, onVerify, onDelete }) {
  return (
    <div className="page-section">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Management panel</p>
          <h2>Admin Dashboard</h2>
        </div>
      </div>

      <div className="stats-grid small-grid">
        <div className="stat-box green"><span>Total Reports</span><strong>{reports.length}</strong></div>
        <div className="stat-box orange"><span>Pending</span><strong>{reports.filter((r) => r.status === 'Pending').length}</strong></div>
        <div className="stat-box blue"><span>Verified</span><strong>{reports.filter((r) => r.status === 'Verified').length}</strong></div>
        <div className="stat-box red"><span>Hotspots</span><strong>{reports.length > 0 ? 3 : 0}</strong></div>
      </div>

      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Location</th>
              <th>Problem</th>
              <th>Severity</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report._id || report.id || report.location}>
                <td>{String(report._id || report.id || report.location).slice(0, 8)}</td>
                <td>{report.location}</td>
                <td>{report.problemType}</td>
                <td>{report.severity}</td>
                <td>{new Date(report.date || report.createdAt).toLocaleDateString()}</td>
                <td><span className={`status-pill ${report.status}`}>{report.status}</span></td>
                <td className="action-buttons">
                  <button className="tiny" onClick={() => onVerify(report._id, 'Verified')}>Verify</button>
                  <button className="tiny secondary" onClick={() => onVerify(report._id, 'Rejected')}>Reject</button>
                  <button className="tiny danger" onClick={() => onDelete(report._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="page-section">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Project overview</p>
          <h2>About Project</h2>
        </div>
      </div>

      <div className="about-card">
        <h3>Problem</h3>
        <p>Rainfall alone does not show which specific localities repeatedly experience waterlogging.</p>

        <h3>Solution</h3>
        <p>The application combines rainfall, environmental information, and citizen observations to create a localized environmental risk assessment.</p>

        <h3>Technology</h3>
        <p>React.js, Node.js, Express.js, MongoDB, Leaflet, OpenStreetMap, and Open-Meteo.</p>

        <h3>Scope</h3>
        <p>Localized environmental risk assessment for identifying recurring waterlogging hotspots in urban and semi-urban areas.</p>

        <h3>Limitations</h3>
        <ul>
          <li>Data quality and citizen report accuracy</li>
          <li>Limited historical rainfall data</li>
          <li>Need for local calibration</li>
          <li>Availability of live APIs</li>
        </ul>

        <h3>Future scope</h3>
        <ul>
          <li>Machine learning estimation</li>
          <li>More historical rainfall data</li>
          <li>Better elevation and drainage network data</li>
          <li>Satellite imagery and image-based verification</li>
          <li>Government and municipal integration</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
