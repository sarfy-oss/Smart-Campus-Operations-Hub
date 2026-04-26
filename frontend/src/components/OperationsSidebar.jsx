import React, { useEffect, useMemo, useState } from 'react';
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

.ops-nav-short {
  width: 26px;
  text-align: center;
  opacity: 0.95;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.ops-nav-label {
  flex: 1;
}

.ops-nav-caret {
  font-size: 12px;
  opacity: 0.9;
  transition: transform 0.2s ease;
}

.ops-nav-caret-expanded {
  transform: rotate(180deg);
}

.ops-nav-item-active {
  background: linear-gradient(90deg, #2f5bb3, #315fae);
  color: #fff;
}

.ops-nav-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ops-subnav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 16px;
}

.ops-subnav-item {
  width: 100%;
  border: none;
  background: transparent;
  color: #d7e2ff;
  font-size: 14px;
  text-align: left;
  padding: 9px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.ops-subnav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  transform: translateX(2px);
}

.ops-subnav-item-active {
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
  { key: 'dashboard', type: 'link', label: 'Dashboard', shortLabel: 'DB', path: '/dashboard', adminOnly: true },
  { key: 'resources', type: 'link', label: 'Resources', shortLabel: 'RS', path: '/resources' },
  { key: 'profile', type: 'link', label: 'Profile', shortLabel: 'PR', path: '/profile' },
  { key: 'bookings', type: 'link', label: 'Bookings (Admin)', shortLabel: 'BK', path: '/bookings', adminOnly: true },
  { key: 'my-bookings', type: 'link', label: 'My Bookings', shortLabel: 'MB', path: '/my-bookings', adminOnly: false },
  { key: 'issues', type: 'link', label: 'Issues', shortLabel: 'IS', path: '/issues', adminOnly: true },
  {
    key: 'tickets-menu',
    type: 'group',
    label: 'Maintenance Tickets',
    shortLabel: 'TK',
    adminOnly: false,
    children: [
      { key: 'my-tickets', label: 'My Tickets', shortLabel: 'MT', path: '/tickets' },
      { key: 'create-ticket', label: 'Create Ticket', shortLabel: 'CT', path: '/tickets/create' },
      { key: 'admin-tickets', label: 'All Tickets (Admin)', shortLabel: 'AT', path: '/admin/tickets', adminOnly: true },
    ],
  },
  {
    key: 'users-menu',
    type: 'group',
    label: 'Users',
    shortLabel: 'US',
    adminOnly: true,
    children: [
      { key: 'user-management', label: 'User Management', shortLabel: 'UM', path: '/users' },
      { key: 'user-role-management', label: 'User Role Management', shortLabel: 'UR', path: '/users/roles' },
    ],
  },
];

const OperationsSidebar = ({ activeKey }) => {
  const navigate = useNavigate();
  const isAdmin = authAPI.isAdmin();
  const normalizedActiveKey = activeKey === 'users' ? 'user-management' : activeKey;
  const [usersExpanded, setUsersExpanded] = useState(
    normalizedActiveKey === 'user-management' || normalizedActiveKey === 'user-role-management'
  );
  const [ticketsExpanded, setTicketsExpanded] = useState(
    normalizedActiveKey === 'my-tickets' || 
    normalizedActiveKey === 'create-ticket' || 
    normalizedActiveKey === 'admin-tickets'
  );

  useEffect(() => {
    if (normalizedActiveKey === 'user-management' || normalizedActiveKey === 'user-role-management') {
      setUsersExpanded(true);
    }
    if (normalizedActiveKey === 'my-tickets' || normalizedActiveKey === 'create-ticket' || normalizedActiveKey === 'admin-tickets') {
      setTicketsExpanded(true);
    }
  }, [normalizedActiveKey]);

  const visibleItems = useMemo(
    () =>
      NAV_ITEMS
        .filter((item) => !item.adminOnly || isAdmin)
        .map((item) => {
          if (item.type !== 'group') return item;

          const children = item.children.filter((child) => !child.adminOnly || isAdmin);
          return { ...item, children };
        })
        .filter((item) => item.type !== 'group' || item.children.length > 0),
    [isAdmin]
  );

  const toggleUsersMenu = () => {
    setUsersExpanded((current) => !current);
  };

  const toggleTicketsMenu = () => {
    setTicketsExpanded((current) => !current);
  };

  return (
    <aside className="ops-sidebar">
      <style>{sidebarStyles}</style>

      <div className="ops-brand">
        <BrandLogo />
      </div>

      <nav className="ops-nav">
        {visibleItems.map((item) => {
          if (item.type === 'group') {
            const isGroupActive = item.children.some((child) => child.key === normalizedActiveKey);
            const isExpanded = item.key === 'tickets-menu' ? ticketsExpanded : usersExpanded;
            const toggleFn = item.key === 'tickets-menu' ? toggleTicketsMenu : toggleUsersMenu;

            return (
              <div key={item.key} className="ops-nav-group">
                <button
                  type="button"
                  className={`ops-nav-item ${isGroupActive ? 'ops-nav-item-active' : ''}`}
                  onClick={toggleFn}
                  aria-expanded={isExpanded}
                >
                  <span className="ops-nav-short">{item.shortLabel}</span>
                  <span className="ops-nav-label">{item.label}</span>
                  <span className={`ops-nav-caret ${isExpanded ? 'ops-nav-caret-expanded' : ''}`}>▾</span>
                </button>

                {isExpanded && (
                  <div className="ops-subnav">
                    {item.children.map((child) => (
                      <button
                        key={child.key}
                        type="button"
                        className={`ops-subnav-item ${normalizedActiveKey === child.key ? 'ops-subnav-item-active' : ''}`}
                        onClick={() => navigate(child.path)}
                      >
                        <span className="ops-nav-short">{child.shortLabel}</span>
                        <span className="ops-nav-label">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              className={`ops-nav-item ${normalizedActiveKey === item.key ? 'ops-nav-item-active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="ops-nav-short">{item.shortLabel}</span>
              <span className="ops-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default OperationsSidebar;
