import React, { useEffect, useMemo, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import OperationsSidebar from '../components/OperationsSidebar';
import TopbarUserMenu from '../components/TopbarUserMenu';
import { notificationAPI, resourceAPI } from '../services/api';
import { formatDate, getEnumDisplay } from '../utils/helpers';
import { adminWorkspaceBaseStyles } from './adminWorkspaceStyles';

const dashboardStyles = String.raw`
.aw-status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.aw-status-box {
  border: 1px solid #e1e7f1;
  border-radius: 10px;
  padding: 14px;
  background: #f8f9fc;
}

.aw-status-box strong {
  display: block;
  font-size: 24px;
  line-height: 1;
  color: #1d2433;
  margin-bottom: 6px;
}

.aw-status-box span {
  color: #5b667a;
}

@media (max-width: 768px) {
  .aw-status-grid {
    grid-template-columns: 1fr;
  }
}
`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [resourceResponse, notificationResponse] = await Promise.all([
          resourceAPI.getAllResources(0, 200, 'updatedAt,desc'),
          notificationAPI.getAll(),
        ]);

        const resourcePayload = resourceResponse.data;
        setResources(resourcePayload.content || resourcePayload || []);
        setNotifications(notificationResponse.data || []);
      } catch (error) {
        setResources([]);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const available = resources.filter((resource) => resource.status === 'AVAILABLE');
    const maintenance = resources.filter((resource) => resource.status === 'MAINTENANCE');
    const blocked = resources.filter((resource) => resource.status === 'UNAVAILABLE');
    const bookingReady = available.filter(
      (resource) => resource.availableFrom && resource.availableTo && resource.availableDays?.length
    );
    const unreadNotifications = notifications.filter((item) => !item.read);

    return {
      totalResources: resources.length,
      availableCount: available.length,
      maintenanceCount: maintenance.length,
      blockedCount: blocked.length,
      bookingReadyCount: bookingReady.length,
      unreadNotifications: unreadNotifications.length,
    };
  }, [notifications, resources]);

  const recentResources = useMemo(
    () =>
      [...resources]
        .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0))
        .slice(0, 5),
    [resources]
  );

  const recentNotifications = useMemo(
    () =>
      [...notifications]
        .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
        .slice(0, 5),
    [notifications]
  );

  return (
    <div className="aw-page">
      <style>{`${adminWorkspaceBaseStyles}\n${dashboardStyles}`}</style>
      <OperationsSidebar activeKey="dashboard" />

      <section className="aw-main">
        <header className="aw-topbar">
          <h1>Operations Dashboard</h1>
          <TopbarUserMenu
            containerClassName="aw-user-menu"
            logoutButtonClassName="aw-logout-btn"
          />
        </header>

        <div className="aw-content">
          <section className="aw-hero">
            <div>
              <h2>Admin visibility across facilities, bookings, and issues</h2>
              <p>
                This workspace gives admins a single place to monitor resource readiness, follow booking-related
                constraints, and respond to operational issues without jumping between disconnected screens.
              </p>
            </div>

            <div className="aw-hero-actions">
              <Button onClick={() => navigate('/resources/add')}>Add Resource</Button>
              <Button variant="outline-primary" onClick={() => navigate('/bookings')}>
                Review Bookings
              </Button>
              <Button variant="outline-dark" onClick={() => navigate('/issues')}>
                Open Issues
              </Button>
            </div>
          </section>

          {loading ? (
            <div className="aw-card">
              <div className="aw-loading">
                <Spinner animation="border" role="status" />
              </div>
            </div>
          ) : (
            <>
              <section className="aw-stat-grid">
                <div className="aw-stat-card">
                  <div className="aw-stat-label">Resources</div>
                  <div className="aw-stat-value">{metrics.totalResources}</div>
                  <div className="aw-stat-note">Tracked across the campus inventory</div>
                </div>

                <div className="aw-stat-card">
                  <div className="aw-stat-label">Booking Ready</div>
                  <div className="aw-stat-value">{metrics.bookingReadyCount}</div>
                  <div className="aw-stat-note">Available with schedule details configured</div>
                </div>

                <div className="aw-stat-card">
                  <div className="aw-stat-label">Maintenance Issues</div>
                  <div className="aw-stat-value">{metrics.maintenanceCount + metrics.blockedCount}</div>
                  <div className="aw-stat-note">Resources that may interrupt reservations</div>
                </div>

                <div className="aw-stat-card">
                  <div className="aw-stat-label">Unread Alerts</div>
                  <div className="aw-stat-value">{metrics.unreadNotifications}</div>
                  <div className="aw-stat-note">Notifications still waiting for admin review</div>
                </div>
              </section>

              <section className="aw-grid">
                <div className="aw-card">
                  <div className="aw-card-header">
                    <h3>Resource status overview</h3>
                    <small>Current operational mix</small>
                  </div>
                  <div className="aw-card-body">
                    <div className="aw-status-grid">
                      <div className="aw-status-box">
                        <strong>{metrics.availableCount}</strong>
                        <span>Available for active use</span>
                      </div>
                      <div className="aw-status-box">
                        <strong>{metrics.maintenanceCount}</strong>
                        <span>Under maintenance</span>
                      </div>
                      <div className="aw-status-box">
                        <strong>{metrics.blockedCount}</strong>
                        <span>Unavailable or blocked</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="aw-card">
                  <div className="aw-card-header">
                    <h3>Recent alerts</h3>
                    <small>{recentNotifications.length} latest notifications</small>
                  </div>
                  <div className="aw-card-body">
                    {recentNotifications.length === 0 ? (
                      <div className="aw-empty">No notifications have been raised for this admin yet.</div>
                    ) : (
                      <div className="aw-list">
                        {recentNotifications.map((notification) => (
                          <div key={notification.id} className="aw-list-item">
                            <div className="aw-list-title">
                              <span>{notification.message}</span>
                              <span className={`aw-chip ${notification.read ? 'aw-chip-neutral' : 'aw-chip-warn'}`}>
                                {notification.read ? 'Read' : 'Unread'}
                              </span>
                            </div>
                            <div className="aw-list-meta">{formatDate(notification.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="aw-card" style={{ marginTop: 18 }}>
                <div className="aw-card-header">
                  <h3>Recently updated resources</h3>
                  <small>Most recent changes visible to admin</small>
                </div>
                <div className="aw-table-wrap">
                  <table className="aw-table">
                    <thead>
                      <tr>
                        <th>Resource</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentResources.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="aw-empty">
                            No resources available yet.
                          </td>
                        </tr>
                      ) : (
                        recentResources.map((resource) => (
                          <tr key={resource.id || resource._id || resource.name}>
                            <td>{resource.name}</td>
                            <td>{getEnumDisplay('ResourceType', resource.type)}</td>
                            <td>
                              <span
                                className={`aw-chip ${
                                  resource.status === 'AVAILABLE'
                                    ? 'aw-chip-good'
                                    : resource.status === 'MAINTENANCE'
                                      ? 'aw-chip-warn'
                                      : 'aw-chip-bad'
                                }`}
                              >
                                {getEnumDisplay('ResourceStatus', resource.status)}
                              </span>
                            </td>
                            <td>{resource.location || '-'}</td>
                            <td>{formatDate(resource.updatedAt || resource.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
