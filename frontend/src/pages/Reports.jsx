import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  MapPin,
  Calendar,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Camera
} from 'lucide-react';
import { fetchReports } from '../services/api';

export default function Reports({ isDemoMode }) {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [problemFilter, setProblemFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      const data = await fetchReports();
      setReports(data || []);
      setFilteredReports(data || []);
      setIsLoading(false);
    }
    loadReports();
  }, [isDemoMode]);

  useEffect(() => {
    let result = [...reports];

    if (statusFilter !== 'All') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (problemFilter !== 'All') {
      result = result.filter((r) => r.problemType === problemFilter);
    }
    if (severityFilter !== 'All') {
      result = result.filter((r) => r.severity === severityFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.location.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }

    setFilteredReports(result);
  }, [searchTerm, statusFilter, problemFilter, severityFilter, reports]);

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.65rem' }}>Citizen Observations & Reports Database</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Public ledger of localized ground reports detailing waterlogging, road flooding, and drainage bottlenecks.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'center' }}>
          {/* Search box */}
          <div className="search-bar-wrapper">
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by area, description, or reporter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.84rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified Only</option>
              <option value="Pending">Pending Verification</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Problem Type Filter */}
          <div>
            <select
              value={problemFilter}
              onChange={(e) => setProblemFilter(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.84rem' }}
            >
              <option value="All">All Problem Types</option>
              <option value="Waterlogging">Waterlogging</option>
              <option value="Blocked Drain">Blocked Drain</option>
              <option value="Drain Overflow">Drain Overflow</option>
              <option value="Road Flooding">Road Flooding</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.84rem' }}
            >
              <option value="All">All Severities</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low Severity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Count Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Showing {filteredReports.length} of {reports.length} Reports
        </span>
      </div>

      {/* Reports Cards Grid */}
      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading citizen reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No reports found matching current filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {filteredReports.map((report) => (
            <div
              key={report._id || report.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span className={`status-badge ${report.status}`}>
                    {report.status === 'Verified' && <CheckCircle size={12} />}
                    {report.status === 'Pending' && <Clock size={12} />}
                    {report.status === 'Rejected' && <XCircle size={12} />}
                    {report.status}
                  </span>
                  <span className={`severity-badge ${report.severity}`}>
                    {report.severity} Severity
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ wordBreak: 'break-word' }}>{report.location}</span>
                </h3>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Coordinates: {Number(report.latitude).toFixed(4)}°, {Number(report.longitude).toFixed(4)}°
                </div>

                <div style={{ display: 'inline-block', background: 'var(--bg-subtle)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '10px' }}>
                  {report.problemType}
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {report.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <div>
                  By <strong>{report.name}</strong> • {new Date(report.date || report.createdAt).toLocaleDateString()}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                >
                  <Eye size={12} /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className={`status-badge ${selectedReport.status}`} style={{ marginBottom: '6px' }}>
                  {selectedReport.status}
                </span>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {selectedReport.location}
                </h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Lat: {selectedReport.latitude} | Lon: {selectedReport.longitude}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px', fontSize: '0.8rem' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Problem Type:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedReport.problemType}</div>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Severity Level:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedReport.severity}</div>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reporter:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedReport.name}</div>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reported On:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {new Date(selectedReport.date || selectedReport.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Description:</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, marginTop: '4px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: '6px' }}>
                {selectedReport.description}
              </p>
            </div>

            {selectedReport.image && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Camera size={14} /> Attached Photo Evidence:
                </span>
                <img
                  src={selectedReport.image}
                  alt="Citizen report evidence"
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                />
              </div>
            )}

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setSelectedReport(null)}
              style={{ width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
