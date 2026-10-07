import React, { useState, useEffect } from 'react';
import {
  IconCloudRain,
  IconSparkles,
  IconPlusCircle,
  IconMapPin,
  IconShieldAlert,
  IconFlame,
  IconBarChart,
  IconUsers,
  IconSettings,
  IconInfo
} from './Icons';

/**
 * Navbar Component
 * Displays system header, navigation tabs, and Demo Mode indicator.
 * Uses simple React state navigation (no React Router needed).
 */
export default function Navbar({ currentPage, onNavigate, isDemoMode, setIsDemoMode }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: IconCloudRain },
    { id: 'risk-map', label: 'Risk Map', icon: IconMapPin },
    { id: 'check-risk', label: 'Check Risk', icon: IconShieldAlert },
    { id: 'report', label: 'Report Waterlogging', icon: IconPlusCircle },
    { id: 'reports', label: 'Citizen Reports', icon: IconUsers },
    { id: 'hotspots', label: 'Hotspots', icon: IconFlame },
    { id: 'analytics', label: 'Analytics', icon: IconBarChart },
    { id: 'admin', label: 'Admin', icon: IconSettings },
    { id: 'about', label: 'About', icon: IconInfo }
  ];

  return (
    <header className="navbar">
      <div className="navbar-top-row">
        <div className="navbar-left" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
          <div className="brand-badge">
            <div className="brand-icon-wrapper">
              <IconCloudRain size={24} color="#ffffff" />
            </div>
            <div>
              <div className="brand-title">Hyperlocal Risk Mapping System</div>
              <div className="brand-subtitle">
                Rainfall-Induced Waterlogging &amp; Localized Environmental Risk Assessment
              </div>
            </div>
          </div>
        </div>

        <div className="navbar-right">
          {/* Demo Mode Switcher */}
          <button
            type="button"
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`demo-toggle-btn ${isDemoMode ? 'active-demo' : ''}`}
            title="Toggle between Live Weather API and Realistic Demo Mode"
          >
            <span className={`status-dot ${isDemoMode ? 'demo' : ''}`}></span>
            <span>{isDemoMode ? 'Demo Mode Active' : 'Live Data Mode'}</span>
            <IconSparkles size={14} color={isDemoMode ? '#d97706' : '#059669'} />
          </button>

          {/* Current clock */}
          <div className="navbar-clock">
            <span>{timeStr}</span>
          </div>

          {/* Quick Action Button */}
          {currentPage !== 'report' && (
            <button
              type="button"
              onClick={() => onNavigate('report')}
              className="btn btn-primary"
              style={{ padding: '7px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <IconPlusCircle size={15} color="#ffffff" />
              <span>Report Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="navbar-nav-tabs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={16} color={isActive ? 'var(--primary)' : 'currentColor'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
