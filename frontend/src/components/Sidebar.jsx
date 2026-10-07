import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Flame,
  BarChart3,
  FileText,
  ShieldCheck,
  Info,
  GraduationCap
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Home Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/map', label: 'Risk Map', icon: <MapPin size={18} /> },
    { to: '/report', label: 'Report Waterlogging', icon: <AlertTriangle size={18} /> },
    { to: '/hotspots', label: 'Waterlogging Hotspots', icon: <Flame size={18} /> },
    { to: '/analytics', label: 'Environmental Analytics', icon: <BarChart3 size={18} /> },
    { to: '/reports', label: 'Citizen Reports', icon: <FileText size={18} /> },
    { to: '/admin', label: 'Admin Dashboard', icon: <ShieldCheck size={18} /> },
    { to: '/about', label: 'About Project', icon: <Info size={18} /> }
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div style={{ padding: '4px 14px 10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--primary-dark)', fontWeight: 600, marginBottom: '4px' }}>
          <GraduationCap size={15} />
          <span>Academic EVS Project</span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          Engineering Environmental Risk Mapping Prototype
        </div>
      </div>
    </aside>
  );
}
