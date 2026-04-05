import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import BrandLogo from './BrandLogo';

const sidebarStyles = String.raw`
.ops-sidebar {
  background: radial-gradient(circle at 10% 0%, #1e376f 0%, #152d5d 30%, #0f2349 60%, #0b1b3b 100%);
  color: #e9efff;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 14px 12px;
}

.ops-brand {
  height: 66px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  padding: 0 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  margin-bottom: 16px;
}

.ops-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ops-nav-item {
  width: 100%;
  border: none;
  background: transparent;
  color: #d7e2ff;
  font-size: 16px;
  text-align: left;
  padding: 11px 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.ops-nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  transform: translateX(2px);
}

.ops-nav-item span {
  width: 26px;
  text-align: center;
  opacity: 0.95;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.ops-nav-item-active {
  background: linear-gradient(90deg, #2f5bb3, #315fae);
  color: #fff;
}

@media (max-width: 1100px) {
  .ops-sidebar {
    display: none;
  }
}
`;

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', shortLabel: 'DB', path: '/dashboard', adminOnly: true },
  { key: 'resources', label: 'Resources', shortLabel: 'RS', path: '/resources' },
  { key: 'bookings', label: 'Bookings', shortLabel: 'BK', path: '/bookings', adminOnly: true },
  { key: 'issues', label: 'Issues', shortLabel: 'IS', path: '/issues', adminOnly: true },
  { key: 'users', label: 'Users', shortLabel: 'US', path: '/users', adminOnly: true },
];

const OperationsSidebar = ({ activeKey }) => {
  const navigate = useNavigate();
  const isAdmin = authAPI.isAdmin();

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="ops-sidebar">
      <style>{sidebarStyles}</style>

      <div className="ops-brand">
        <BrandLogo />
      </div>

      <nav className="ops-nav">
        {visibleItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`ops-nav-item ${activeKey === item.key ? 'ops-nav-item-active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span>{item.shortLabel}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default OperationsSidebar;
