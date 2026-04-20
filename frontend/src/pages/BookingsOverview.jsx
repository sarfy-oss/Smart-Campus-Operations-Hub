import React, { useEffect, useMemo, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import OperationsSidebar from '../components/OperationsSidebar';
import TopbarUserMenu from '../components/TopbarUserMenu';
import { resourceAPI } from '../services/api';
import { getEnumDisplay } from '../utils/helpers';
import { adminWorkspaceBaseStyles } from './adminWorkspaceStyles';

const bookingsStyles = String.raw`
.aw-inline-note {
  color: #5b667a;
  line-height: 1.6;
  margin-bottom: 0;
}
`;

const BookingsOverview = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      setLoading(true);
      try {
        const response = await resourceAPI.getAllResources(0, 200, 'name,asc');
        const payload = response.data;
        setResources(payload.content || payload || []);
      } catch (error) {
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  const bookingSummary = useMemo(() => {
    const ready = [];
    const missingSchedule = [];
    const blocked = [];

    resources.forEach((resource) => {
      const hasSchedule = resource.availableFrom && resource.availableTo && resource.availableDays?.length;

      if (resource.status !== 'AVAILABLE') {
        blocked.push(resource);
        return;
      }

      if (hasSchedule) {
        ready.push(resource);
      } else {
        missingSchedule.push(resource);
      }
    });

    const totalCapacity = ready.reduce((sum, resource) => sum + Number(resource.capacity || 0), 0);

    return {
      ready,
      missingSchedule,
      blocked,
      totalCapacity,
    };
  }, [resources]);

  const bookingRows = useMemo(
    () =>
      resources.map((resource) => {
        const hasSchedule = resource.availableFrom && resource.availableTo && resource.availableDays?.length;
        let readinessLabel = 'Blocked';
        let readinessClass = 'aw-chip-bad';
        let note = 'Resource is not currently available for bookings.';

        if (resource.status === 'AVAILABLE' && hasSchedule) {
          readinessLabel = 'Ready';
          readinessClass = 'aw-chip-good';
          note = `${resource.availableFrom} - ${resource.availableTo}, ${resource.availableDays.join(', ')}`;
        } else if (resource.status === 'AVAILABLE') {
          readinessLabel = 'Setup Needed';
          readinessClass = 'aw-chip-warn';
          note = 'Available, but booking times or available days are missing.';
        }

        return {
          ...resource,
          readinessLabel,
          readinessClass,
          note,
        };
      }),
    [resources]
  );

  return (
    <div className="aw-page">
      <style>{`${adminWorkspaceBaseStyles}\n${bookingsStyles}`}</style>
      <OperationsSidebar activeKey="bookings" />

      <section className="aw-main">
        <header className="aw-topbar">
          <h1>Booking Operations</h1>
          <TopbarUserMenu
            containerClassName="aw-user-menu"
            logoutButtonClassName="aw-logout-btn"
          />
        </header>

        <div className="aw-content">
          <section className="aw-hero">
            <div>
              <h2>Booking readiness for admin review</h2>
              <p className="aw-inline-note">
                This page summarizes which resources are immediately ready for reservations, which ones still need
                schedule setup, and which operational blocks are likely to affect booking requests.
              </p>
            </div>

            <div className="aw-hero-actions">
              <Button onClick={() => navigate('/resources')}>Open Resources</Button>
              <Button variant="outline-dark" onClick={() => navigate('/issues')}>
                Review Issues
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
                  <div className="aw-stat-label">Ready Resources</div>
                  <div className="aw-stat-value">{bookingSummary.ready.length}</div>
                  <div className="aw-stat-note">Can support bookings immediately</div>
                </div>

                <div className="aw-stat-card">
                  <div className="aw-stat-label">Setup Needed</div>
                  <div className="aw-stat-value">{bookingSummary.missingSchedule.length}</div>
                  <div className="aw-stat-note">Available but missing booking windows or days</div>
                </div>

                <div className="aw-stat-card">
                  <div className="aw-stat-label">Blocked</div>
                  <div className="aw-stat-value">{bookingSummary.blocked.length}</div>
                  <div className="aw-stat-note">Unavailable or under maintenance</div>
                </div>

                <div className="aw-stat-card">
                  <div className="aw-stat-label">Ready Capacity</div>
                  <div className="aw-stat-value">{bookingSummary.totalCapacity}</div>
                  <div className="aw-stat-note">Seats across booking-ready resources</div>
                </div>
              </section>

              <section className="aw-card">
                <div className="aw-card-header">
                  <h3>Booking visibility by resource</h3>
                  <small>{resources.length} resources evaluated</small>
                </div>
                <div className="aw-table-wrap">
                  <table className="aw-table">
                    <thead>
                      <tr>
                        <th>Resource</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Readiness</th>
                        <th>Capacity</th>
                        <th>Booking Window</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="aw-empty">
                            No resources available to evaluate for bookings.
                          </td>
                        </tr>
                      ) : (
                        bookingRows.map((resource) => (
                          <tr key={resource.id || resource._id || resource.name}>
                            <td>
                              <strong>{resource.name}</strong>
                              <div className="aw-list-meta">{resource.location || 'No location set'}</div>
                            </td>
                            <td>{getEnumDisplay('ResourceType', resource.type)}</td>
                            <td>{getEnumDisplay('ResourceStatus', resource.status)}</td>
                            <td>
                              <span className={`aw-chip ${resource.readinessClass}`}>{resource.readinessLabel}</span>
                            </td>
                            <td>{resource.capacity || 0}</td>
                            <td>{resource.note}</td>
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

export default BookingsOverview;
