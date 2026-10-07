import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Layers,
  Info,
  Calendar,
  CloudRain
} from 'lucide-react';
import { fetchAnalytics } from '../services/api';

const COLORS = ['#059669', '#0284c7', '#f59e0b', '#ef4444', '#8b5cf6'];
const SEVERITY_COLORS = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444'
};

export default function Analytics({ isDemoMode }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      const res = await fetchAnalytics();
      if (res && res.charts) {
        setData(res);
      } else {
        // Fallback demo charts if offline
        setData({
          summary: {
            totalReports: 16,
            verifiedReports: 12,
            pendingReports: 3,
            rejectedReports: 1,
            hotspotCount: 5
          },
          charts: {
            reportsByProblemType: [
              { name: 'Waterlogging', count: 6 },
              { name: 'Road Flooding', count: 4 },
              { name: 'Blocked Drain', count: 3 },
              { name: 'Drain Overflow', count: 2 },
              { name: 'Other', count: 1 }
            ],
            reportsBySeverity: [
              { severity: 'Low', count: 3, fill: '#10b981' },
              { severity: 'Medium', count: 6, fill: '#f59e0b' },
              { severity: 'High', count: 7, fill: '#ef4444' }
            ],
            reportsOverTime: [
              { date: 'Oct 1', reports: 2 },
              { date: 'Oct 2', reports: 3 },
              { date: 'Oct 3', reports: 1 },
              { date: 'Oct 4', reports: 4 },
              { date: 'Oct 5', reports: 6 }
            ],
            rainfallVsRisk: [
              { station: 'Hindmata', rainfallMm: 45, riskScore: 82, elevationM: 5 },
              { station: 'Gandhi Mkt', rainfallMm: 42, riskScore: 78, elevationM: 6 },
              { station: 'Milan Subway', rainfallMm: 36, riskScore: 74, elevationM: 7 },
              { station: 'Kurla W', rainfallMm: 48, riskScore: 86, elevationM: 5 },
              { station: 'Andheri Sub', rainfallMm: 34, riskScore: 70, elevationM: 9 },
              { station: 'Bandra BKC', rainfallMm: 22, riskScore: 42, elevationM: 12 },
              { station: 'Dadar TT', rainfallMm: 28, riskScore: 52, elevationM: 10 },
              { station: 'Marine Dr', rainfallMm: 12, riskScore: 18, elevationM: 16 }
            ],
            riskDistribution: [
              { level: 'Low (0-25)', count: 4, fill: '#10b981', percentage: 22 },
              { level: 'Moderate (26-50)', count: 6, fill: '#f59e0b', percentage: 33 },
              { level: 'High (51-75)', count: 5, fill: '#f97316', percentage: 28 },
              { level: 'Very High (76-100)', count: 3, fill: '#ef4444', percentage: 17 }
            ]
          }
        });
      }
      setIsLoading(false);
    }

    loadAnalytics();
  }, [isDemoMode]);

  if (isLoading || !data) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        Loading environmental analytics...
      </div>
    );
  }

  const { charts, summary } = data;

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '1.65rem' }}>Environmental Analytics & Statistical Correlation</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Exploratory analysis showing how precipitation intensity, terrain elevation, and citizen reports correlate with localized risk scores.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: '26px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Observations</span>
            <span className="stat-value">{summary?.totalReports || 16}</span>
            <span className="stat-subtext">Across monitored sectors</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f0f9ff', color: '#0284c7' }}>
            <CloudRain size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Verified Reports</span>
            <span className="stat-value">{summary?.verifiedReports || 12}</span>
            <span className="stat-subtext">Ground checked by admins</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending Verification</span>
            <span className="stat-value">{summary?.pendingReports || 3}</span>
            <span className="stat-subtext">Awaiting ground validation</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Recurring Clusters</span>
            <span className="stat-value">{summary?.hotspotCount || 5}</span>
            <span className="stat-subtext">Identified waterlogging hotspots</span>
          </div>
        </div>
      </div>

      {/* Chart 1: Rainfall vs Risk (Scatter / Correlation) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Chart 1: Rainfall Intensity vs Calculated Risk Score</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Illustrates how precipitation combines with local elevation (lower elevation points cluster at higher risk).
            </span>
          </div>
        </div>
        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.rainfallVsRisk} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="station" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.8rem' }}>
                        <strong>{d.station}</strong>
                        <div>Rainfall: <strong>{d.rainfallMm} mm</strong></div>
                        <div>Elevation: <strong>{d.elevationM} m</strong></div>
                        <div>Calculated Risk: <strong style={{ color: '#ef4444' }}>{d.riskScore}/100</strong></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="rainfallMm" fill="#0284c7" name="Rainfall (mm)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="riskScore" fill="#ef4444" name="Risk Score (0-100)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Chart 2 (Problem Type) & Chart 3 (Severity) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px', marginBottom: '24px' }}>
        {/* Chart 2: Reports by Problem Type (Pie / Donut) */}
        <div className="card">
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Chart 2: Citizen Reports by Problem Type</h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Breakdown of waterlogging, blocked drains, road flooding, and drain overflows
            </span>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.reportsByProblemType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {charts.reportsByProblemType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Reports by Severity (Bar) */}
        <div className="card">
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Chart 3: Reports by Severity Level</h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Distribution of Low, Medium, and High waterlogging impacts
            </span>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.reportsBySeverity} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="severity" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Number of Reports" radius={[6, 6, 0, 0]}>
                  {charts.reportsBySeverity.map((entry, idx) => (
                    <Cell key={`sev-${idx}`} fill={entry.fill || SEVERITY_COLORS[entry.severity] || '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Chart 4 (Reports Over Time) & Chart 5 (Risk Distribution) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px' }}>
        {/* Chart 4: Reports Over Time (Area Chart) */}
        <div className="card">
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Chart 4: Waterlogging Reports Over Time</h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Timeline of observation submissions during precipitation events
            </span>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.reportsOverTime} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="reports" stroke="#059669" fill="#a7f3d0" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Risk Distribution */}
        <div className="card">
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Chart 5: Risk Level Distribution</h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Proportion of localities classified across Low, Moderate, High, and Very High risk
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
            {charts.riskDistribution.map((item) => (
              <div key={item.level}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{item.level}</span>
                  <span style={{ fontWeight: 700 }}>
                    {item.count} areas ({item.percentage}%)
                  </span>
                </div>
                <div style={{ height: '14px', background: '#e2e8f0', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${item.percentage}%`,
                      background: item.fill,
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.6s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '18px', background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Info size={16} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
            <span>Distribution reflects simulated and recorded urban survey locations.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
