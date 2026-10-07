import React from 'react';

/**
 * DashboardCard Component (Section 19)
 * Used on Home Dashboard to display key metrics:
 * - Current Rainfall
 * - Active Reports
 * - Verified Reports
 * - Waterlogging Hotspots
 * - Current Risk
 */
export default function DashboardCard({
  title,
  value,
  subtext,
  badgeText,
  badgeColor,
  icon,
  iconBg = '#ecfdf5',
  iconColor = '#059669',
  onClick
}) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-icon-wrapper" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-info">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span className="stat-label">{title}</span>
          {badgeText && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: badgeColor ? `${badgeColor}18` : '#e2e8f0',
                color: badgeColor || '#475569',
                border: `1px solid ${badgeColor || '#cbd5e1'}`
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
        <span className="stat-value">{value}</span>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
    </div>
  );
}
