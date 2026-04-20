import React, { useEffect, useMemo, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import OperationsSidebar from '../components/OperationsSidebar';
import TopbarUserMenu from '../components/TopbarUserMenu';
import { notificationAPI, resourceAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import { adminWorkspaceBaseStyles } from './adminWorkspaceStyles';

const issuesStyles = String.raw`
.aw-issue-text {
  margin: 0;
  color: #5b667a;
  line-height: 1.6;
}
`;

const severityRank = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const IssuesOverview = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIssues = async () => {
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

    loadIssues();
  }, []);

  const issues = useMemo(() => {
    const derivedIssues = [];

    resources.forEach((resource) => {
      const resourceId = resource.id || resource._id || resource.name;

      if (resource.status === 'MAINTENANCE') {
        derivedIssues.push({
          id: `${resourceId}-maintenance`,
          resourceName: resource.name,
          severity: 'High',
          summary: 'Resource is under maintenance',
          action: 'Review repair progress and keep booking access disabled until resolved.',
        });
      }

      if (resource.status === 'UNAVAILABLE') {
        derivedIssues.push({
          id: `${resourceId}-unavailable`,
          resourceName: resource.name,
          severity: 'High',
          summary: 'Resource is unavailable for booking',
          action: 'Confirm cause of downtime or reactivate the resource when it is ready.',
        });
      }

      if (resource.status === 'AVAILABLE' && (!resource.availableFrom || !resource.availableTo)) {
        derivedIssues.push({
          id: `${resourceId}-time-window`,
          resourceName: resource.name,
          severity: 'Medium',
          summary: 'Booking time window is missing',
          action: 'Set available start and end times so booking rules are enforceable.',
        });
      }

      if (resource.status === 'AVAILABLE' && !resource.availableDays?.length) {
        derivedIssues.push({
          id: `${resourceId}-days`,
          resourceName: resource.name,
          severity: 'Low',
          summary: 'Available days are not configured',
          action: 'Choose the weekdays this resource should accept bookings.',
        });
      }
    });

    return derivedIssues.sort((left, right) => severityRank[left.severity] - severityRank[right.severity]);
  }, [resources]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications]
  );

  return (
    <div className="aw-page">
      <style>{`${adminWorkspaceBaseStyles}\n${issuesStyles}`}</style>
      <OperationsSidebar activeKey="issues" />

      <section className="aw-main">
        <header className="aw-topbar">
          <h1>Issues and Alerts</h1>
          <TopbarUserMenu
            containerClassName="aw-user-menu"
            logoutButtonClassName="aw-logout-btn"
          />
        </header>

        <div className="aw-content">
          <section className="aw-hero">
            <div>
              <h2>Operational issues visible to admins</h2>
              <p className="aw-issue-text">
                The system now gives admins a dedicated view for resource blockers and recent alerts, so booking
                problems are easier to spot before they affect staff or students.
              </p>
            </div>

            <div className="aw-hero-actions">
              <Button onClick={() => navigate('/bookings')}>Open Bookings</Button>
              <Button variant="outline-dark" onClick={() => navigate('/resources')}>
                View Resources
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
                  <div className="aw-stat-label">Open Issues</div>
                  <div className="aw-stat-value">{issues.length}</div>
                  <div className="aw-stat-note">Derived from resource status and booking setup</div>
                </div>

                <div className="aw-stat-card">
                  <div className="aw-stat-label">High Severity</div>
                  <div className="aw-stat-value">{issues.filter((issue) => issue.severity === 'High').length}</div>
                  <div className="aw-stat-note">Maintenance or unavailable resources</div>
                </div>

                <div className="aw-stat-card">
                  <div className="aw-stat-label">Unread Alerts</div>
                  <div className="aw-stat-value">{unreadNotifications.length}</div>
                  <div className="aw-stat-note">Notifications still awaiting admin attention</div>
                </div>

                <div className="aw-stat-card">
                  <div className="aw-stat-label">Affected Resources</div>
                  <div className="aw-stat-value">{new Set(issues.map((issue) => issue.resourceName)).size}</div>
                  <div className="aw-stat-note">Resources currently represented in the issue list</div>
                </div>
              </section>

              <section className="aw-grid">
                <div className="aw-card">
                  <div className="aw-card-header">
                    <h3>Issue queue</h3>
                    <small>{issues.length} items to review</small>
                  </div>
                  <div className="aw-table-wrap">
                    <table className="aw-table">
                      <thead>
                        <tr>
                          <th>Resource</th>
                          <th>Issue</th>
                          <th>Severity</th>
                          <th>Suggested Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issues.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="aw-empty">
                              No operational issues are currently visible.
                            </td>
                          </tr>
                        ) : (
                          issues.map((issue) => (
                            <tr key={issue.id}>
                              <td>{issue.resourceName}</td>
                              <td>{issue.summary}</td>
                              <td>
                                <span
                                  className={`aw-chip ${
                                    issue.severity === 'High'
                                      ? 'aw-chip-bad'
                                      : issue.severity === 'Medium'
                                        ? 'aw-chip-warn'
                                        : 'aw-chip-neutral'
                                  }`}
                                >
                                  {issue.severity}
                                </span>
                              </td>
                              <td>{issue.action}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="aw-card">
                  <div className="aw-card-header">
                    <h3>Recent notifications</h3>
                    <small>{notifications.length} total</small>
                  </div>
                  <div className="aw-card-body">
                    {notifications.length === 0 ? (
                      <div className="aw-empty">No notifications available.</div>
                    ) : (
                      <div className="aw-list">
                        {notifications.slice(0, 6).map((notification) => (
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
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default IssuesOverview;
