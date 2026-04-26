import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import TicketForm from '../components/TicketForm';
import { ticketAPI, resourceAPI, authAPI } from '../services/api';
import './CreateTicketPage.css';

/**
 * CreateTicketPage - User creates a new incident/maintenance ticket
 * Features:
 * - Multi-image upload (up to 3)
 * - Category AI suggestion
 * - SLA tracking
 * - Real-time form validation
 */
const CreateTicketPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  // Fetch user info and available resources on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingResources(true);

        // Get current user info
        const userProfile = authAPI.getProfile();
        setUserInfo(userProfile);

        // Fetch available resources for location selection
        const resourcesResponse = await resourceAPI.getAvailableResources();
        setResources(resourcesResponse.data || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.warning('Could not load all resources, but you can still create tickets');
      } finally {
        setLoadingResources(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);

      // Create ticket with images
      const response = await ticketAPI.createTicket(formData);

      toast.success('✓ Ticket created successfully!');

      // Redirect to ticket details
      setTimeout(() => {
        navigate(`/tickets/${response.data.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating ticket:', error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to create ticket. Please try again.';

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-ticket-page">
      <Container className="py-5">
        <Row className="mb-5">
          <Col>
            <div className="page-header">
              <h1>🔧 Create Maintenance Ticket</h1>
              <p className="text-muted">
                Report an incident or maintenance issue on campus. Our team will prioritize
                and address it promptly.
              </p>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            {loadingResources ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" className="mb-3">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p>Loading resources...</p>
              </div>
            ) : (
              <TicketForm
                onSubmit={handleSubmit}
                loading={loading}
                resources={resources}
              />
            )}
          </Col>

          {/* Right Sidebar - Info & Tips */}
          <Col lg={4}>
            <div className="ticket-tips-sidebar">
              <div className="tips-card">
                <h6 className="tips-title">💡 Tips for Better Support</h6>
                <ul className="tips-list">
                  <li>
                    <strong>Be Specific:</strong> Describe exactly what you're reporting
                  </li>
                  <li>
                    <strong>Add Photos:</strong> Upload images of the issue to help
                    technicians
                  </li>
                  <li>
                    <strong>Priority Matters:</strong> Set priority to match urgency
                  </li>
                  <li>
                    <strong>Contact Info:</strong> Ensure we can reach you for updates
                  </li>
                </ul>
              </div>

              <div className="tips-card sla-card">
                <h6 className="tips-title">⏱️ Response Times (SLA)</h6>
                <div className="sla-item">
                  <span className="sla-priority">🔴 High</span>
                  <span className="sla-time">Within 24 hours</span>
                </div>
                <div className="sla-item">
                  <span className="sla-priority">🟡 Medium</span>
                  <span className="sla-time">2-3 days</span>
                </div>
                <div className="sla-item">
                  <span className="sla-priority">🟢 Low</span>
                  <span className="sla-time">5-7 days</span>
                </div>
              </div>

              <div className="tips-card categories-card">
                <h6 className="tips-title">📂 Common Categories</h6>
                <div className="category-chips">
                  <span className="chip">⚡ Electrical</span>
                  <span className="chip">💧 Plumbing</span>
                  <span className="chip">🌡️ HVAC</span>
                  <span className="chip">💻 IT</span>
                  <span className="chip">🏗️ Structural</span>
                  <span className="chip">🧹 Cleaning</span>
                </div>
              </div>

              {userInfo && (
                <div className="tips-card user-card">
                  <h6 className="tips-title">👤 Your Information</h6>
                  <p className="mb-1">
                    <small className="text-muted">Logged in as:</small>
                  </p>
                  <p className="mb-3">
                    <strong>{userInfo.username}</strong>
                  </p>
                  <p className="text-muted small">
                    Your tickets will be associated with this account and you'll receive
                    updates via your registered email.
                  </p>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CreateTicketPage;
