import React from 'react';

export default function StatCard({ label, value, subtext, icon, iconBg = 'var(--primary-bg)', iconColor = 'var(--primary)' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrapper" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
    </div>
  );
}
