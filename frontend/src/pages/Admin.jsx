import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Trash2,
  Eye,
  Filter,
  Flame,
  BarChart3,
  AlertTriangle,
  Camera,
  Layers,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchReports, verifyReport, deleteReport, fetchHotspots } from '../services/api';

export default function Admin({ isDemoMode }) {
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionNotice, setActionNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [reps, hots] = await Promise.all([fetchReports(), fetchHotspots()]);
    setReports(reps || []);
    setHotspots(hots || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  // Handle Verify Action
  const handleVerify = async (id) => {
    try {
      await verifyReport(id, 'Verified');
      setActionNotice(`Report #${id.slice(-6)} has been verified successfully.`);
      setTimeout(() => setActionNotice(''), 4000);
      loadData();
    } catch (err) {
      alert('Error verifying report: ' + err.message);
    }
  };

  // Handle Reject Action
  const handleReject = async (id) => {
    try {
      await verifyReport(id, 'Rejected');
      setActionNotice(`Report #${id.slice(-6)} was marked as rejected.`);
      setTimeout(() => setActionNotice(''), 4000);
      loadData();
    } catch (err) {
      alert('Error rejecting report: ' + err.message);
    }
  };

  // Handle Delete Action
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      await deleteReport(id);
      setActionNotice(`Report #${id.slice(-6)} has been deleted.`);
      setTimeout(() => setActionNotice(''), 4000);
      loadData();
    } catch (err) {
      alert('Error deleting report: ' + err.message);
    }
  };

  // Filtered reports by active tab
  const filteredReports = reports.filter((r) => {
    if (activeTab === 'All') return true;
    return r.status === activeTab;
  });

  const pendingCount = reports.filter((r) => r.status === 'Pending').length;
  const verifiedCount = reports.filter((r) => r.status === 'Verified').length;
  const rejectedCount = reports.filter((r) => r.status === 'Rejected').length;

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#047857', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px', border: '1px solid #a7f3d0' }}>
            <ShieldCheck size={14} />
            Administrative Moderation Panel
          </div>
          <h1 style={{ fontSize: '1.65rem' }}>Citizen Reports Moderation & Hotspot Administration</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Review pending ground observations, verify authentic waterlogging incidents, and monitor municipal cluster rankings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/hotspots" className="btn btn-outline" style={{ fontSize: '0.82rem' }}>
            <Flame size={14} style={{ color: '#ea580c' }} />
            View Hotspots ({hotspots.length})
          </Link>
          <Link to="/analytics" className="btn btn-outline" style={{ fontSize: '0.82rem' }}>
            <BarChart3 size={14} style={{ color: '#0284c7' }} />
            View Analytics
          </Link>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.84rem', fontWeight: 600, marginBottom: '18px' }}>
          ✓ {actionNotice}
        </div>
      )}

      {/* Summary Stat Cards (Requirement 12) */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f1f5f9', color: '#334155' }}>
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Reports</span>
            <span className="stat-value">{reports.length}</span>
            <span className="stat-subtext">All submitted reports</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending Verification</span>
            <span className="stat-value" style={{ color: '#d97706' }}>{pendingCount}</span>
            <span className="stat-subtext">Requires admin review</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Verified Reports</span>
            <span className="stat-value" style={{ color: '#059669' }}>{verifiedCount}</span>
            <span className="stat-subtext">Active in risk scoring</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <XCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Rejected Reports</span>
            <span className="stat-value" style={{ color: '#ef4444' }}>{rejectedCount}</span>
            <span className="stat-subtext">Excluded from clusters</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '16px' }}>
        {['All', 'Pending', 'Verified', 'Rejected'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === tab ? 'var(--primary)' : 'var(--bg-subtle)',
              color: activeTab === tab ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{tab}</span>
            {tab === 'Pending' && pendingCount > 0 && (
              <span style={{ background: '#d97706', color: 'white', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '10px' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reports Table (Requirement 12) */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Location</th>
              <th>Problem</th>
              <th>Severity</th>
              <th>Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                  Loading reports...
                </td>
              </tr>
            ) : filteredReports.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No reports found in this tab.
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report._id || report.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    #{(report._id || report.id).slice(-6)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{report.location}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Lat: {Number(report.latitude).toFixed(4)}, Lon: {Number(report.longitude).toFixed(4)}
                    </div>
                  </td>
                  <td>
                    <span style={{ background: 'var(--bg-subtle)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.76rem', fontWeight: 500 }}>
                      {report.problemType}
                    </span>
                  </td>
                  <td>
                    <span className={`severity-badge ${report.severity}`}>
                      {report.severity}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {new Date(report.date || report.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`status-badge ${report.status}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>
                    {/* Action buttons: View, Verify, Reject, Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {/* View */}
                      <button
                        type="button"
                        onClick={() => setSelectedReport(report)}
                        title="View Details"
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-light)', background: '#ffffff', cursor: 'pointer', color: '#0284c7' }}
                      >
                        <Eye size={14} />
                      </button>

                      {/* Verify */}
                      {report.status !== 'Verified' && (
                        <button
                          type="button"
                          onClick={() => handleVerify(report._id || report.id)}
                          title="Verify Report"
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #86efac', background: '#ecfdf5', cursor: 'pointer', color: '#059669' }}
                        >
                          <Check size={14} />
                        </button>
                      )}

                      {/* Reject */}
                      {report.status !== 'Rejected' && (
                        <button
                          type="button"
                          onClick={() => handleReject(report._id || report.id)}
                          title="Reject Report"
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #fed7aa', background: '#fff7ed', cursor: 'pointer', color: '#ea580c' }}
                        >
                          <X size={14} />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(report._id || report.id)}
                        title="Delete Report"
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', color: '#dc2626' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Detail Modal with Verification Shortcuts */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span className={`status-badge ${selectedReport.status}`}>
                  {selectedReport.status}
                </span>
                <h2 style={{ fontSize: '1.25rem', marginTop: '6px' }}>{selectedReport.location}</h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Reported by <strong>{selectedReport.name}</strong> • {new Date(selectedReport.date || selectedReport.createdAt).toLocaleString()}
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
                <div style={{ fontWeight: 600 }}>{selectedReport.problemType}</div>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Severity Level:</span>
                <div style={{ fontWeight: 600 }}>{selectedReport.severity}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description:</span>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.5, marginTop: '4px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: '6px' }}>
                {selectedReport.description}
              </p>
            </div>

            {selectedReport.image && (
              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Camera size={14} /> Attached Photo Evidence:
                </span>
                <img
                  src={selectedReport.image}
                  alt="Evidence"
                  style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {selectedReport.status !== 'Verified' && (
                <button
                  type="button"
                  onClick={() => {
                    handleVerify(selectedReport._id || selectedReport.id);
                    setSelectedReport(null);
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Check size={16} /> Verify Report
                </button>
              )}
              {selectedReport.status !== 'Rejected' && (
                <button
                  type="button"
                  onClick={() => {
                    handleReject(selectedReport._id || selectedReport.id);
                    setSelectedReport(null);
                  }}
                  className="btn"
                  style={{ background: '#f59e0b', color: 'white', flex: 1 }}
                >
                  <X size={16} /> Reject Report
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleDelete(selectedReport._id || selectedReport.id);
                  setSelectedReport(null);
                }}
                className="btn btn-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
