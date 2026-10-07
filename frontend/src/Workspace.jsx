import { useEffect, useState } from 'react';
import './App.css';
import AuthPage from './components/AuthPage';
import LocationPicker from './components/LocationPicker';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import RiskMap from './components/RiskMap';
import {
  clearSession,
  adminLogin,
  deleteReport,
  getAnalytics,
  getAreaOverview,
  getCurrentUser,
  getHotspots,
  getLocations,
  getReports,
  getRisk,
  getUsers,
  getWeather,
  googleAuth,
  login,
  register,
  requestPasswordReset,
  resetPassword,
  saveSession,
  verifyReport
} from './services/api';

const fallbackLocation = { name: 'Solapur', latitude: 17.6599, longitude: 75.9067 };
const STATUS_OPTIONS = ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected'];

export default function Workspace() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [pageHistory, setPageHistory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(fallbackLocation);
  const [reports, setReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [weather, setWeather] = useState(null);
  const [risk, setRisk] = useState(null);
  const [users, setUsers] = useState([]);
  const [areaOverview, setAreaOverview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [adminFilters, setAdminFilters] = useState({ search: '', area: '', status: '', risk: '', from: '', to: '' });

  async function refresh(account, location) {
    if (!account) return;
    setLoading(true);
    try {
      const isAdmin = account.role === 'admin';
      const requests = [
        getReports(),
        getHotspots(),
        getAnalytics(),
        getWeather(location.latitude, location.longitude),
        getRisk(location.latitude, location.longitude),
        isAdmin ? getUsers() : getReports({ mine: true }),
        isAdmin ? getAreaOverview() : Promise.resolve({ areas: [] })
      ];
      const [reportData, hotspotData, analyticsData, weatherData, riskData, roleData, areaData] = await Promise.all(requests);
      setReports(reportData.reports || []);
      setHotspots(hotspotData.hotspots || []);
      setAnalytics(analyticsData.analytics || {});
      setWeather(weatherData.weather || null);
      setRisk(riskData || null);
      if (isAdmin) setUsers(roleData.users || []);
      else setMyReports(roleData.reports || []);
      if (isAdmin) setAreaOverview(areaData.areas || []);
    } catch (error) {
      setStatusMessage(error.message || 'Unable to load workspace data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function initialize() {
      let areaOptions = [];
      try {
        const locationData = await getLocations();
        areaOptions = locationData.locations || [];
        if (active) setLocations(areaOptions);
      } catch {
        areaOptions = [];
      }
      if (!localStorage.getItem('hyperlocal-session-token')) {
        if (active) setAuthLoading(false);
        return;
      }
      try {
        const { user: account } = await getCurrentUser();
        if (!active) return;
        const area = areaOptions.find((entry) => entry.name === account.area);
        const center = area ? {
          ...area,
          latitude: account.areaLatitude ?? area.latitude,
          longitude: account.areaLongitude ?? area.longitude
        } : fallbackLocation;
        setUser(account);
        setSelectedLocation(center);
        await refresh(account, center);
      } catch {
        clearSession();
      } finally {
        if (active) setAuthLoading(false);
      }
    }
    initialize();
    return () => { active = false; };
  }, []);

  const finishAuth = async (response) => {
    saveSession(response.token);
    const account = response.user;
    const locationData = await getLocations();
    const areaOptions = locationData.locations || [];
    setLocations(areaOptions);
    const area = areaOptions.find((entry) => entry.name === account.area);
    const center = area ? {
      ...area,
      latitude: account.areaLatitude ?? area.latitude,
      longitude: account.areaLongitude ?? area.longitude
    } : fallbackLocation;
    setUser(account);
    setSelectedLocation(center);
    setPageHistory([]);
    setPage('dashboard');
    setStatusMessage('');
    await refresh(account, center);
  };

  const handleGoogleLogin = async (credential) => {
    const result = await googleAuth({ credential });
    if (result.token) await finishAuth(result);
    return result;
  };

  const handleGoogleRegister = async (payload) => {
    await finishAuth(await googleAuth(payload));
  };

  const navigateTo = (nextPage) => {
    if (nextPage === page) return;
    setPageHistory((history) => [...history, page]);
    setPage(nextPage);
    setStatusMessage('');
  };

  const handleBack = () => {
    if (!pageHistory.length) {
      setPage('dashboard');
      return;
    }
    const previousHistory = pageHistory.slice(0, -1);
    setPageHistory(previousHistory);
    setPage(pageHistory[pageHistory.length - 1]);
    setStatusMessage('');
  };

  const handleStatus = async (reportId, status, resolution) => {
    try {
      await verifyReport(reportId, status, resolution);
      await refresh(user, selectedLocation);
      setStatusMessage(`Report status changed to ${status}.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleDelete = async (reportId) => {
    try {
      await deleteReport(reportId);
      await refresh(user, selectedLocation);
      setStatusMessage('Report deleted.');
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleAreaChange = async (areaName) => {
    const area = locations.find((entry) => entry.name === areaName);
    if (!area) return;
    setSelectedLocation(area);
    await refresh(user, area);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setPageHistory([]);
    setPage('dashboard');
    setReports([]);
    setMyReports([]);
    setStatusMessage('');
  };

  if (authLoading) return <div className="app-loading">Opening your risk workspace...</div>;
  if (!user) {
    return <AuthPage
      onLogin={async (form) => finishAuth(await login(form))}
      onAdminLogin={async (form) => finishAuth(await adminLogin(form))}
      onRegister={register}
      onGoogleLogin={handleGoogleLogin}
      onGoogleRegister={handleGoogleRegister}
      onForgotPassword={requestPasswordReset}
      onResetPassword={resetPassword}
      message={statusMessage}
    />;
  }

  const isAdmin = user.role === 'admin';
  const navItems = isAdmin
    ? [['dashboard', 'Overview'], ['risk-map', 'Risk map'], ['admin-reports', 'Report management'], ['users', 'Citizens'], ['hotspots', 'Hotspots'], ['rainfall', 'Rainfall']]
    : [['dashboard', 'My area'], ['risk-map', 'Risk map'], ['area-reports', 'Area reports'], ['my-reports', 'My reports'], ['report', 'Submit report'], ['hotspots', 'Hotspots'], ['rainfall', 'Rainfall']];
  const currentRisk = risk?.risk || { score: 0, level: 'LOW' };
  const visibleHotspots = isAdmin ? hotspots : hotspots.filter((hotspot) => hotspot.area === user.area);

  let content;
  if (page === 'dashboard') {
    content = <DashboardView user={user} isAdmin={isAdmin} reports={reports} myReports={myReports} weather={weather} risk={currentRisk} hotspots={visibleHotspots} analytics={analytics} users={users} areaOverview={areaOverview} selectedLocation={selectedLocation} onNavigate={navigateTo} />;
  } else if (page === 'risk-map') {
    content = <section className="page-section">
      <PageHeading kicker="Live locality view" title="Risk map" />
      {isAdmin && <label className="filter-field">Area<select value={selectedLocation.name} onChange={(event) => handleAreaChange(event.target.value)}>{locations.map((area) => <option key={area.id} value={area.name}>{area.name}</option>)}</select></label>}
      <div className="risk-strip"><Metric label="Locality" value={selectedLocation.name} /><Metric label="Rainfall" value={`${weather?.rainfall ?? 0} mm`} /><Metric label="Risk score" value={`${currentRisk.score ?? 0}/100`} /><Metric label="Risk level" value={currentRisk.level || 'LOW'} /></div>
      <RiskMap selectedLocation={selectedLocation} onLocationChange={() => {}} reports={reports} hotspots={visibleHotspots} risk={currentRisk} />
    </section>;
  } else if (page === 'report' && !isAdmin) {
    content = <section className="page-section"><PageHeading kicker="Citizen observation" title="Submit a waterlogging report" /><ReportForm user={user} areaCenter={locations.find((entry) => entry.name === user.area) || fallbackLocation} onReportSubmitted={async () => { await refresh(user, selectedLocation); navigateTo('my-reports'); setStatusMessage('Report received. Track its status in My reports.'); }} /></section>;
  } else if (page === 'area-reports' && !isAdmin) {
    content = <section className="page-section"><PageHeading kicker={user.area} title="Reports from your area" /><ReportList reports={reports} /></section>;
  } else if (page === 'my-reports' && !isAdmin) {
    content = <section className="page-section"><PageHeading kicker={user.area} title="My reports" /><ReportList reports={myReports} onDelete={handleDelete} /></section>;
  } else if (page === 'admin-reports' && isAdmin) {
    content = <AdminReports reports={reports} locations={locations} filters={adminFilters} setFilters={setAdminFilters} onStatus={handleStatus} onDelete={handleDelete} />;
  } else if (page === 'users' && isAdmin) {
    content = <UserManagement users={users} />;
  } else if (page === 'hotspots') {
    content = <HotspotsPage hotspots={visibleHotspots} reports={reports} selectedLocation={selectedLocation} risk={currentRisk} />;
  } else if (page === 'rainfall') {
    content = <RainfallPage area={selectedLocation.name} weather={weather} risk={currentRisk} riskInfo={risk} reports={reports} />;
  } else {
    content = <DashboardView user={user} isAdmin={isAdmin} reports={reports} myReports={myReports} weather={weather} risk={currentRisk} hotspots={visibleHotspots} analytics={analytics} users={users} areaOverview={areaOverview} selectedLocation={selectedLocation} onNavigate={navigateTo} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar workspace-topbar">
        <div className="workspace-brand">
          {page !== 'dashboard' && <button className="back-arrow" type="button" onClick={handleBack} aria-label="Go back to previous page" title="Back">←</button>}
          <div><p className="eyebrow">Localized environmental risk assessment</p><h1>Hyperlocal Rainfall-Induced Waterlogging &amp; Environmental Risk Mapping System</h1></div>
        </div>
        <div className="account-tools"><span className={`role-pill ${isAdmin ? 'admin' : ''}`}>{isAdmin ? 'Administrator' : user.area}</span><span className="account-name">{user.name}</span><button className="logout-button" onClick={handleLogout}>Sign out</button></div>
      </header>
      <nav className="main-nav" aria-label="Workspace navigation">
        {navItems.map(([key, label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => navigateTo(key)}>{label}</button>)}
      </nav>
      {statusMessage && <div className="status-banner" role="status">{statusMessage}</div>}
      {loading && <div className="loading-banner">Updating locality data...</div>}
      <main className="page-body">{content}</main>
      <footer className="site-footer">Localized environmental risk assessment only. Not an official flood warning or guaranteed flood prediction.</footer>
    </div>
  );
}

function PageHeading({ kicker, title }) {
  return <div className="panel-header"><div><p className="eyebrow">{kicker}</p><h2>{title}</h2></div></div>;
}

function Metric({ label, value, tone = '' }) {
  return <div className={`stat-box ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function DashboardView({ user, isAdmin, reports, myReports, weather, risk, hotspots, analytics, users, areaOverview, selectedLocation, onNavigate }) {
  const [activeDetail, setActiveDetail] = useState('');
  const highRiskCount = areaOverview.filter((area) => area.riskLevel === 'High').length;
  const metrics = isAdmin
    ? [
      { key: 'users', label: 'Total Users', value: users.length },
      { key: 'reports', label: 'Total Reports', value: reports.length },
      { key: 'pending', label: 'Pending', value: reports.filter((report) => report.status === 'Pending').length },
      { key: 'verified', label: 'Verified', value: reports.filter((report) => report.status === 'Verified').length },
      { key: 'resolved', label: 'Resolved', value: reports.filter((report) => report.status === 'Resolved').length },
      { key: 'high-risk', label: 'High-Risk Area', value: highRiskCount }
    ]
    : [
      { label: 'Area', value: user.area },
      { label: 'Current rainfall', value: `${weather?.rainfall ?? 0} mm` },
      { label: 'Risk score', value: `${risk.score ?? 0}/100` },
      { label: 'Risk level', value: risk.level || 'LOW' },
      { label: 'Area reports', value: reports.length },
      { label: 'My reports', value: myReports.length }
    ];
  const mapLocation = isAdmin ? selectedLocation : { ...selectedLocation, name: user.area };

  return <div className="page-section">
    <section className="hero-card workspace-hero"><div><p className="eyebrow">{isAdmin ? 'Management overview' : `Citizen dashboard · ${user.area}`}</p><h2>{isAdmin ? 'All-area operations' : `Conditions in ${user.area}`}</h2><p className="lead">{isAdmin ? 'Monitor incoming reports, locality risk, and citizen activity.' : 'Local rainfall, community reports, and current environmental risk in one place.'}</p></div><div className="hero-actions"><button onClick={() => onNavigate(isAdmin ? 'admin-reports' : 'report')}>{isAdmin ? 'Manage reports' : 'Submit report'}</button><button className="secondary" onClick={() => onNavigate('risk-map')}>Open risk map</button></div></section>
    <div className="stats-grid small-grid">{metrics.map((metric, index) => isAdmin
      ? <button key={metric.key} type="button" className={`stat-box clickable-stat ${['green', 'blue', 'orange', 'green', 'blue', 'red'][index]}`} onClick={() => setActiveDetail(metric.key)} aria-label={`View ${metric.label} details, ${metric.value}`}><span>{metric.label}</span><strong>{metric.value}</strong><small>View details</small></button>
      : <Metric key={metric.label} label={metric.label} value={metric.value} tone={['green', 'blue', 'orange', 'green', 'blue', 'red'][index]} />)}</div>
    <div className="dashboard-grid">
      <section className="content-panel dashboard-map-panel"><div className="section-title-row"><h3>Interactive risk map</h3><button className="text-button" onClick={() => onNavigate('risk-map')}>Open map</button></div><RiskMap selectedLocation={mapLocation} onLocationChange={() => {}} reports={reports.slice(0, isAdmin ? 100 : undefined)} hotspots={hotspots} risk={risk} compact /></section>
      <section className="content-panel recent-panel"><div className="section-title-row"><h3>{isAdmin ? 'Recent reports' : 'Recent area reports'}</h3><button className="text-button" onClick={() => onNavigate(isAdmin ? 'admin-reports' : 'area-reports')}>View all</button></div>
        {reports.slice(0, 5).map((report) => <article className="recent-report" key={report.id}><div><strong>{report.location}</strong><span>{report.area} · {report.problemType}</span></div><span className={`status-pill ${report.status}`}>{report.status}</span></article>)}
        {!reports.length && <p className="empty-state">No reports have been submitted for this view yet.</p>}
        <div className="mini-weather"><span>Rainfall in {selectedLocation.name}</span><strong>{weather?.rainfall ?? 0} mm</strong><span>{weather?.condition || 'Weather unavailable'} · Risk {risk.level || 'LOW'}</span></div>
      </section>
    </div>
    <div className="dashboard-footer-grid"><section className="content-panel"><div className="section-title-row"><h3>Recurring hotspots</h3><button className="text-button" onClick={() => onNavigate('hotspots')}>View hotspots</button></div>{hotspots.slice(0, 3).map((spot) => <p className="list-line" key={spot.id}>{spot.name} <span>{spot.reports} reports · {spot.risk} risk</span></p>)}{!hotspots.length && <p className="empty-state">Hotspots appear when multiple reports cluster nearby.</p>}</section><section className="content-panel"><h3>Rainfall summary</h3><p><strong>{analytics.averageRainfall ?? 0} mm</strong> average recorded rainfall across {analytics.totalReports ?? reports.length} reports.</p><p className="muted-copy">Risk scores combine rainfall, elevation, and nearby citizen observations. Prototype only.</p></section></div>
    {isAdmin && <section className="content-panel area-breakdown"><h3>Locality risk and rainfall</h3>{areaOverview.map((area) => <div className="area-bar-row area-risk-row" key={area.id}><span>{area.name}</span><div><i className={`risk-fill ${area.riskLevel.toLowerCase()}`} style={{ width: `${Math.max(4, area.riskScore)}%` }} /></div><strong>{area.rainfall} mm</strong><small>{area.riskLevel} · {area.reports} reports</small></div>)}{!areaOverview.length && <p className="empty-state">Locality summaries are loading.</p>}</section>}
    {isAdmin && activeDetail && <OverviewDetail kind={activeDetail} users={users} reports={reports} areaOverview={areaOverview} onClose={() => setActiveDetail('')} />}
  </div>;
}

function OverviewDetail({ kind, users, reports, areaOverview, onClose }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const timestamp = (report) => new Date(report.date || report.createdAt || 0);
  const recentReports = [...reports].sort((first, second) => timestamp(second) - timestamp(first));
  const statusReports = kind === 'pending' ? reports.filter((report) => report.status === 'Pending')
    : kind === 'verified' ? reports.filter((report) => report.status === 'Verified')
      : kind === 'resolved' ? reports.filter((report) => report.status === 'Resolved') : reports;
  const highRiskAreas = areaOverview.filter((area) => area.riskLevel === 'High');
  const titleByKind = {
    users: 'User overview',
    reports: 'Report overview',
    pending: 'Pending reports',
    verified: 'Verified reports',
    resolved: 'Resolved reports',
    'high-risk': 'High-risk areas'
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (selectedReport) setSelectedReport(null);
        else onClose();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, selectedReport]);

  const detailTitle = selectedReport ? selectedReport.location : titleByKind[kind];
  const closeOnBackdrop = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return <div className="overview-detail-overlay" onMouseDown={closeOnBackdrop}>
    <section className="overview-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="overview-detail-title">
      <header className="overview-detail-header">
        <div>
          <p className="eyebrow">Administrator overview · live JSON data</p>
          <h2 id="overview-detail-title">{detailTitle}</h2>
        </div>
        <button className="overview-detail-close" type="button" onClick={onClose} aria-label="Close details">×</button>
      </header>

      <div className="overview-detail-content">
        {selectedReport
          ? <ReportOverviewDetails report={selectedReport} onBack={() => setSelectedReport(null)} />
          : <OverviewCategory kind={kind} users={users} reports={reports} recentReports={recentReports} statusReports={statusReports} highRiskAreas={highRiskAreas} areaOverview={areaOverview} startOfToday={startOfToday} startOfWeek={startOfWeek} startOfMonth={startOfMonth} now={now} onSelectReport={setSelectedReport} />}
      </div>
    </section>
  </div>;
}

function OverviewCategory({ kind, users, reports, recentReports, statusReports, highRiskAreas, areaOverview, startOfToday, startOfWeek, startOfMonth, now, onSelectReport }) {
  const reportStatuses = ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected'];
  if (kind === 'users') {
    const citizens = users.filter((entry) => entry.role === 'citizen');
    const admins = users.filter((entry) => entry.role === 'admin');
    const recentlyActiveUserIds = new Set(reports.filter((report) => now - new Date(report.date || report.createdAt) <= 30 * 86400000).map((report) => report.userId));
    const reportCounts = reports.reduce((counts, report) => ({ ...counts, [report.userId]: (counts[report.userId] || 0) + 1 }), {});
    const recentUsers = [...users].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)).slice(0, 8);
    return <>
      <div className="overview-detail-metrics"><Metric label="Registered users" value={users.length} /><Metric label="Citizens" value={citizens.length} /><Metric label="Administrators" value={admins.length} /><Metric label="Active reporters · 30 days" value={recentlyActiveUserIds.size} /></div>
      <p className="overview-detail-note">Activity is measured from persisted report submissions in the last 30 days. Average reports per citizen: {citizens.length ? (reports.length / citizens.length).toFixed(1) : '0.0'}.</p>
      <h3>Recently registered users</h3>
      <div className="overview-table-wrap"><table className="overview-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Area</th><th>Joined</th><th>Reports</th></tr></thead><tbody>{recentUsers.map((entry) => <tr key={entry.id}><td>{entry.name}</td><td>{entry.email}</td><td>{entry.role}</td><td>{entry.area}</td><td>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '—'}</td><td>{reportCounts[entry.id] || 0}</td></tr>)}</tbody></table>{!recentUsers.length && <EmptyDetail>No registered users.</EmptyDetail>}</div>
    </>;
  }

  if (kind === 'high-risk') {
    const highRiskReports = reports.filter((report) => highRiskAreas.some((area) => area.name === report.area));
    const mapCenter = highRiskAreas[0] || areaOverview[0] || { name: 'Risk map', latitude: 17.6599, longitude: 75.9067 };
    const mapHotspots = highRiskAreas.map((area) => ({ id: area.id, name: area.name, area: area.name, latitude: area.latitude, longitude: area.longitude, reports: area.reports, risk: area.riskLevel }));
    return <>
      <div className="overview-detail-metrics"><Metric label="High-risk areas" value={highRiskAreas.length} /><Metric label="Reports in high-risk areas" value={highRiskReports.length} /><Metric label="Highest area score" value={Math.max(0, ...highRiskAreas.map((area) => area.riskScore))} /></div>
      {highRiskAreas.length > 0
        ? <RiskMap selectedLocation={mapCenter} onLocationChange={() => {}} reports={highRiskReports} hotspots={mapHotspots} risk={{ score: mapCenter.riskScore, level: 'HIGH' }} compact />
        : <EmptyDetail>No localities are currently classified as high risk by the live area summary.</EmptyDetail>}
      <div className="overview-risk-area-list">{highRiskAreas.map((area) => {
        const localReports = reports.filter((report) => report.area === area.name && report.status !== 'Rejected');
        const highSeverity = localReports.filter((report) => report.severity === 'High').length;
        return <article className="overview-risk-area" key={area.id}><div><strong>{area.name}</strong><span>Risk score {area.riskScore}/100 · {area.riskLevel}</span></div><div><strong>{area.rainfall} mm</strong><span>Recent rainfall · {localReports.length} reports · {highSeverity} high-severity</span></div><p>{area.riskScore >= 80 ? 'Avoid low-lying roads; follow local authority instructions and report changing conditions.' : 'Use caution near reported drainage trouble spots and monitor local updates.'}</p></article>;
      })}</div>
    </>;
  }

  if (kind === 'reports') {
    const byLocation = countBy(reports, (report) => report.location || report.area || 'Unknown location');
    const byType = countBy(reports, (report) => report.problemType || 'Unspecified');
    const byStatus = countBy(reports, (report) => report.status || 'Unknown');
    return <>
      <div className="overview-detail-metrics"><Metric label="Submitted today" value={reports.filter((report) => timestampIsOnOrAfter(report, startOfToday)).length} /><Metric label="This week" value={reports.filter((report) => timestampIsOnOrAfter(report, startOfWeek)).length} /><Metric label="This month" value={reports.filter((report) => timestampIsOnOrAfter(report, startOfMonth)).length} /><Metric label="All reports" value={reports.length} /></div>
      <div className="overview-breakdown-grid"><CountBreakdown title="Reports by location" counts={byLocation} /><CountBreakdown title="Reports by type" counts={byType} /><CountBreakdown title="Status breakdown" counts={byStatus} /></div>
      <h3>Recent reports</h3><ReportOverviewList reports={recentReports.slice(0, 10)} onSelectReport={onSelectReport} />
    </>;
  }

  const statusLabel = { pending: 'Pending', verified: 'Verified', resolved: 'Resolved' }[kind];
  const resolvedOn = (report) => report.statusHistory?.filter((entry) => entry.status === 'Resolved').at(-1)?.at
    || (report.status === 'Resolved' ? report.updatedAt : null);
  const verifiedOn = (report) => report.statusHistory?.filter((entry) => entry.status === 'Verified').at(-1)?.at
    || (report.status === 'Verified' ? report.updatedAt : null);
  return <>
    <div className="overview-detail-metrics"><Metric label={`${statusLabel} reports`} value={statusReports.length} /></div>
    <ReportOverviewList reports={statusReports} onSelectReport={onSelectReport} statusDate={kind === 'verified' ? verifiedOn : kind === 'resolved' ? resolvedOn : null} showResolution={kind === 'resolved'} />
  </>;
}

function timestampIsOnOrAfter(report, date) {
  const value = new Date(report.date || report.createdAt);
  return !Number.isNaN(value.getTime()) && value >= date;
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function CountBreakdown({ title, counts }) {
  return <section className="overview-breakdown"><h3>{title}</h3>{Object.entries(counts).sort((first, second) => second[1] - first[1]).map(([label, count]) => <div key={label}><span>{label}</span><strong>{count}</strong></div>)}{!Object.keys(counts).length && <p>No report data.</p>}</section>;
}

function ReportOverviewList({ reports, onSelectReport, statusDate, showResolution = false }) {
  if (!reports.length) return <EmptyDetail>No reports in this category.</EmptyDetail>;
  return <div className="overview-report-list">{reports.map((report) => {
    const changedAt = statusDate?.(report);
    return <article className="overview-report-row" key={report.id || report._id}>
      <div className="overview-report-main"><strong>{report.location}</strong><span>{report.area} · {report.problemType}</span><span>{report.userName || report.name} · {new Date(report.date || report.createdAt).toLocaleString()}</span></div>
      <div className="overview-report-meta">{changedAt && <span>{statusDate === undefined ? '' : 'Status updated'} {new Date(changedAt).toLocaleString()}</span>}{showResolution && <span>Action: {report.resolution || 'No resolution action recorded.'}</span>}<span className={`status-pill ${report.status}`}>{report.status}</span></div>
      <button className="overview-report-open" type="button" onClick={() => onSelectReport(report)}>View details</button>
    </article>;
  })}</div>;
}

function ReportOverviewDetails({ report, onBack }) {
  return <div className="overview-report-detail">
    <button className="overview-detail-back" type="button" onClick={onBack}>← Back to category</button>
    <div className="overview-detail-metrics"><Metric label="Area" value={report.area} /><Metric label="Status" value={report.status} /><Metric label="Risk" value={`${report.riskLevel || report.severity || '—'} · ${report.riskScore ?? '—'}/100`} /></div>
    <dl className="overview-report-fields"><div><dt>Submitted by</dt><dd>{report.userName || report.name}</dd></div><div><dt>Location</dt><dd>{report.location} ({report.latitude}, {report.longitude})</dd></div><div><dt>Problem type</dt><dd>{report.problemType}</dd></div><div><dt>Date / time</dt><dd>{new Date(report.date || report.createdAt).toLocaleString()}</dd></div><div><dt>Rainfall at submission</dt><dd>{report.rainfall ?? '—'} mm</dd></div><div><dt>Current status</dt><dd>{report.status}</dd></div><div className="wide"><dt>Description</dt><dd>{report.description}</dd></div><div className="wide"><dt>Resolution / action taken</dt><dd>{report.resolution || 'No resolution action recorded.'}</dd></div></dl>
    {report.image && <img className="overview-report-image" src={report.image} alt={`Evidence for ${report.location}`} />}
  </div>;
}

function EmptyDetail({ children }) {
  return <p className="overview-empty-detail">{children}</p>;
}

function AdminReports({ reports, locations, filters, setFilters, onStatus, onDelete }) {
  const [resolutionNotes, setResolutionNotes] = useState({});
  const visibleReports = reports.filter((report) => {
    const search = filters.search.toLowerCase();
    return (!filters.area || report.area === filters.area)
      && (!filters.status || report.status === filters.status)
      && (!filters.risk || report.riskLevel === filters.risk)
      && (!filters.from || new Date(report.date) >= new Date(filters.from))
      && (!filters.to || new Date(report.date) <= new Date(`${filters.to}T23:59:59`))
      && (!search || `${report.location} ${report.area} ${report.userName} ${report.problemType}`.toLowerCase().includes(search));
  });
  return <section className="page-section"><PageHeading kicker="Administrator access · all localities" title="Report management" />
    <div className="filter-toolbar">
      <input aria-label="Search reports" placeholder="Search report, user, or location" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
      <select aria-label="Filter by area" value={filters.area} onChange={(event) => setFilters({ ...filters, area: event.target.value })}><option value="">All areas</option>{locations.map((area) => <option key={area.id}>{area.name}</option>)}</select>
      <select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select>
      <select aria-label="Filter by risk" value={filters.risk} onChange={(event) => setFilters({ ...filters, risk: event.target.value })}><option value="">All risk levels</option>{['Low', 'Medium', 'High'].map((level) => <option key={level}>{level}</option>)}</select>
      <input aria-label="From date" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
      <input aria-label="To date" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
    </div>
    <div className="admin-report-list">{visibleReports.map((report) => <details className="admin-report" key={report.id}><summary><span className="report-area-tag">{report.area}</span><strong>{report.location}</strong><span>{report.problemType}</span><span className={`status-pill ${report.status}`}>{report.status}</span></summary>
      <div className="admin-report-details"><div className="report-detail-copy"><p><b>Submitted by:</b> {report.userName}</p><p><b>Date / time:</b> {new Date(report.date).toLocaleString()}</p><p><b>Rainfall:</b> {report.rainfall} mm · <b>Risk:</b> {report.riskLevel} ({report.riskScore}/100)</p><p><b>Description:</b> {report.description}</p></div>{report.image && <img src={report.image} alt={`Report from ${report.location}`} />}</div>
      <div className="admin-report-actions"><label>Status<select value={report.status} onChange={(event) => onStatus(report.id, event.target.value, resolutionNotes[report.id] ?? report.resolution)}>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></label>{report.status === 'Resolved' && <><label className="resolution-note-field">Resolution / action<input value={resolutionNotes[report.id] ?? report.resolution ?? ''} maxLength="1000" placeholder="Describe the action taken" onChange={(event) => setResolutionNotes({ ...resolutionNotes, [report.id]: event.target.value })} /></label><button className="tiny" onClick={() => onStatus(report.id, 'Resolved', resolutionNotes[report.id] ?? report.resolution ?? '')}>Save action</button></>}<button className="tiny danger" onClick={() => onDelete(report.id)}>Delete report</button></div>
    </details>)}{!visibleReports.length && <p className="empty-state">No reports match these filters.</p>}</div>
  </section>;
}

function UserManagement({ users }) {
  const citizens = users.filter((user) => user.role === 'citizen');
  return <section className="page-section"><PageHeading kicker="Administrator access" title="Registered citizens" /><div className="table-panel"><table><thead><tr><th>Name</th><th>Email</th><th>Area</th><th>Joined</th></tr></thead><tbody>{citizens.map((citizen) => <tr key={citizen.id}><td>{citizen.name}</td><td>{citizen.email}</td><td>{citizen.area}</td><td>{new Date(citizen.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>{!citizens.length && <p className="empty-state">No citizen accounts registered yet.</p>}</div></section>;
}

function HotspotsPage({ hotspots, reports, selectedLocation, risk }) {
  return <section className="page-section"><PageHeading kicker="Repeated nearby observations" title="Waterlogging hotspots" /><div className="hotspot-grid">{hotspots.map((hotspot) => <article className="hotspot-card" key={hotspot.id}><span className={`risk-chip ${String(hotspot.risk).toLowerCase()}`}>{hotspot.risk} risk</span><h3>{hotspot.name}</h3><p>{hotspot.area}</p><strong>{hotspot.reports} reports</strong></article>)}{!hotspots.length && <p className="empty-state">A hotspot is identified after at least two non-rejected reports occur nearby.</p>}</div><RiskMap selectedLocation={selectedLocation} onLocationChange={() => {}} reports={reports} hotspots={hotspots} risk={risk} /></section>;
}

function RainfallPage({ area, weather, risk, riskInfo, reports }) {
  return <section className="page-section"><PageHeading kicker={`Weather and environment · ${area}`} title="Rainfall details" /><div className="stats-grid small-grid"><Metric label="Recent rainfall" value={`${weather?.rainfall ?? 0} mm`} tone="blue" /><Metric label="Temperature" value={`${weather?.temperature ?? '--'} °C`} tone="orange" /><Metric label="Risk score" value={`${risk.score ?? 0}/100`} tone="red" /><Metric label="Risk level" value={risk.level || 'LOW'} tone="green" /></div><div className="dashboard-grid"><section className="content-panel"><h3>Local conditions</h3><p><b>Area:</b> {area}</p><p><b>Condition:</b> {weather?.condition || 'No current condition available'}</p><p><b>Elevation:</b> {riskInfo?.location?.elevation ?? '--'} m</p><p><b>Terrain:</b> {riskInfo?.location?.terrain ?? 'Not available'}</p><p><b>Reports considered:</b> {riskInfo?.citizenReports ?? 0} nearby observations</p><p className="muted-copy">Source: {weather?.source || 'Weather service fallback'}. Rainfall readings are not a flood warning.</p></section><section className="content-panel"><h3>Reports in this assessment</h3><p>{reports.length} saved observations contribute to local context.</p><p className="muted-copy">Score formula is a prototype using rainfall, elevation, terrain, and citizen reports. It is not calibrated for emergency decisions.</p></section></div></section>;
}