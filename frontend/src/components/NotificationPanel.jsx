import React, { useState } from 'react';
import { Badge, DropdownButton } from 'react-bootstrap';
import { useNotifications } from '../context/NotificationContext';

const notificationPanelStyles = `
.notification-panel {
  display: flex;
  align-items: center;
}

.notification-button {
  position: relative;
}

.notification-button .btn {
  background-color: transparent;
  border: none;
  color: #333;
  font-size: 1.5rem;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notification-button .btn:hover {
  color: #0d6efd;
}

.notification-badge {
  font-size: 0.7rem;
  margin-left: 0.3rem;
}

.notification-menu {
  min-width: 380px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

.notification-title {
  font-weight: 600;
  color: #333;
  margin: 0;
}

.clear-btn {
  background: none;
  border: none;
  color: #0d6efd;
  cursor: pointer;
  font-size: 0.85rem;
  text-decoration: underline;
  padding: 0;
}

.clear-btn:hover {
  color: #0a58ca;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.notification-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #6c757d;
  text-align: center;
}

.notification-empty p {
  margin: 0;
  font-size: 0.95rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #eef4ff;
}

.notification-item.unread:hover {
  background-color: #dde8ff;
}

.notification-item.notification-BOOKING_APPROVED,
.notification-item.notification-success {
  border-left: 3px solid #198754;
}

.notification-item.notification-BOOKING_REJECTED,
.notification-item.notification-error {
  border-left: 3px solid #dc3545;
}

.notification-item.notification-REMINDER,
.notification-item.notification-warning {
  border-left: 3px solid #ffc107;
}

.notification-item.notification-SYSTEM,
.notification-item.notification-info {
  border-left: 3px solid #0d6efd;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.notification-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.75rem;
  color: white;
}

.notification-icon.icon-BOOKING_APPROVED,
.notification-icon.icon-success {
  background-color: #198754;
}

.notification-icon.icon-BOOKING_REJECTED,
.notification-icon.icon-error {
  background-color: #dc3545;
}

.notification-icon.icon-REMINDER,
.notification-icon.icon-warning {
  background-color: #ffc107;
  color: #333;
}

.notification-icon.icon-SYSTEM,
.notification-icon.icon-info {
  background-color: #0d6efd;
}

.notification-time {
  font-size: 0.8rem;
  color: #6c757d;
}

.notification-message {
  margin: 0;
  font-size: 0.9rem;
  color: #333;
  word-break: break-word;
}

.notification-close {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  line-height: 1;
  margin-top: 2px;
}

.notification-close:hover {
  color: #333;
}

.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.notification-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}
`;

const getIcon = (type) => {
  switch (type) {
    case 'BOOKING_APPROVED':
    case 'success': return '✓';
    case 'BOOKING_REJECTED':
    case 'error': return '✕';
    case 'REMINDER':
    case 'warning': return '⚠';
    default: return 'ℹ';
  }
};

const formatTime = (timestamp) => {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NotificationPanel = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } =
    useNotifications();
  const [show, setShow] = useState(false);

  const handleItemClick = (notif) => {
    if (!notif.read) markAsRead(notif.id);
  };

  return (
    <div className="notification-panel">
      <style>{notificationPanelStyles}</style>
      <DropdownButton
        id="notification-dropdown"
        title={
          <>
            <span>🔔</span>
            {unreadCount > 0 && (
              <Badge bg="danger" className="notification-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </>
        }
        className="notification-button"
        show={show}
        onToggle={() => setShow(!show)}
      >
        <div className="notification-menu">
          <div className="notification-header">
            <span className="notification-title">
              Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
            </span>
            {unreadCount > 0 && (
              <button onClick={() => markAllAsRead()} className="clear-btn">
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item notification-${notif.type} ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleItemClick(notif)}
                >
                  <div className="notification-content">
                    <div className="notification-header-item">
                      <span className={`notification-icon icon-${notif.type}`}>
                        {getIcon(notif.type)}
                      </span>
                      <span className="notification-time">
                        {formatTime(notif.createdAt)}
                      </span>
                      {!notif.read && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0d6efd', display: 'inline-block' }} />
                      )}
                    </div>
                    <p className="notification-message">{notif.message}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                    className="notification-close"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </DropdownButton>
    </div>
  );
};

export default NotificationPanel;
