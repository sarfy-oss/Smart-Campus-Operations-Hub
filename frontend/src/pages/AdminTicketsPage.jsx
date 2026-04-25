import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Spinner, Alert, Table, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import TicketCard from '../components/TicketCard';
import TicketStatusBadge from '../components/TicketStatusBadge';
import TicketPriorityBadge from '../components/TicketPriorityBadge';
import { ticketAPI } from '../services/api';
import './AdminTicketsPage.css';

/**
 * AdminTicketsPage - Comprehensive admin dashboard for ticket management
 * Features:
 * - View all tickets with multiple layouts
 * - Filter by status, priority, category
 * - Real-time assignment to technicians
 * - Status updates with rejection reason
 * - Quick actions and bulk operations
 * - Analytics and insights
 */
const AdminTicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState('grid');
  
  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    rejected: 0,
  });

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTickets(), fetchTechnicians()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await ticketAPI.getAllTickets(0, 100);
      const allTickets = response.data || [];
      setTickets(allTickets);

      const newStats = {
        total: allTickets.length,
        open: allTickets.filter((t) => t.status === 'OPEN').length,
        inProgress: allTickets.filter((t) => t.status === 'IN_PROGRESS').length,
        resolved: allTickets.filter((t) => t.status === 'RESOLVED').length,
        closed: allTickets.filter((t) => t.status === 'CLOSED').length,
        rejected: allTickets.filter((t) => t.status === 'REJECTED').length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await ticketAPI.getTechnicians();
      setTechnicians(response.data || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const handleAssignClick = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedTechnician(ticket.assignedTo?.id || '');
    setShowAssignModal(true);
  };

  const handleStatusClick = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setRejectionReason(ticket.rejectionReason || '');
    setShowStatusModal(true);
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) {
      toast.warning('Please select a technician');
      return;
    }

    try {
      setSubmitting(true);
      await ticketAPI.assignTechnician(selectedTicket.id, { technicianId: selectedTechnician });
      toast.success('Technician assigned successfully');
      setShowAssignModal(false);
      fetchTickets();
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast.error('Failed to assign technician');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.warning('Please select a status');
      return;
    }

    if (newStatus === 'REJECTED' && !rejectionReason.trim()) {
      toast.warning('Please provide a rejection reason');
      return;
    }

    try {
      setSubmitting(true);
      const data = {
        status: newStatus,
        ...(newStatus === 'REJECTED' && { rejectionReason }),
      };
      await ticketAPI.updateTicketStatus(selectedTicket.id, data);
      toast.success('Ticket status updated successfully');
      setShowStatusModal(false);
      fetchTickets();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredTickets = () => {
    let filtered = [...tickets];

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    if (filterPriority !== 'ALL') {
      filtered = filtered.filter((t) => t.priority === filterPriority);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id.includes(searchQuery) ||
          t.contactName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const displayedTickets = getFilteredTickets();

  const priorityStats = {
    HIGH: tickets.filter((t) => t.priority === 'HIGH').length,
    MEDIUM: tickets.filter((t) => t.priority === 'MEDIUM').length,
    LOW: tickets.filter((t) => t.priority === 'LOW').length,
  };

  return (
    <div className="admin-tickets-page">
      <Container fluid className="py-5">
        {/* Page Header */}
        <Row className="mb-5">
          <Col>
            <div className="page-header">
              <h1 className="page-title">🎛️ Ticket Management Dashboard</h1>
              <p className="page-subtitle">Manage, assign, and track all maintenance tickets</p>
            </div>
          </Col>
        </Row>

        {/* Stats Row */}
        <Row className="mb-5">
          <Col md={3} sm={6} className="mb-3">
            <div className="stat-card stat-total">
              <div className="stat-icon">📊</div>
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Tickets</div>
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <div className="stat-card stat-open">
              <div className="stat-icon">🔴</div>
              <div className="stat-number">{stats.open}</div>
              <div className="stat-label">Open</div>
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <div className="stat-card stat-progress">
              <div className="stat-icon">🟡</div>
              <div className="stat-number">{stats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <div className="stat-card stat-resolved">
              <div className="stat-icon">🟢</div>
              <div className="stat-number">{stats.resolved + stats.closed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </Col>
        </Row>

        {/* Filters and Controls */}
        <Row className="mb-4">
          <Col lg={8}>
            <div className="filters-card">
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">Search</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="ID, title, reporter..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">Status</Form.Label>
                    <Form.Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="filter-select"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">🔴 Open</option>
                      <option value="IN_PROGRESS">🟡 In Progress</option>
                      <option value="RESOLVED">🔵 Resolved</option>
                      <option value="CLOSED">🟢 Closed</option>
                      <option value="REJECTED">⚫ Rejected</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">Priority</Form.Label>
                    <Form.Select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="filter-select"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="HIGH">↑ High (24h)</option>
                      <option value="MEDIUM">→ Medium (2-3d)</option>
                      <option value="LOW">↓ Low (5-7d)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </Col>

          <Col lg={4}>
            <div className="priority-distribution">
              <h6 className="mb-3">Priority Breakdown</h6>
              <div className="priority-bar">
                <div
                  className="bar-segment high"
                  style={{ width: `${(priorityStats.HIGH / (stats.total || 1)) * 100 || 0}%` }}
                  title={`${priorityStats.HIGH} High`}
                />
                <div
                  className="bar-segment medium"
                  style={{ width: `${(priorityStats.MEDIUM / (stats.total || 1)) * 100 || 0}%` }}
                  title={`${priorityStats.MEDIUM} Medium`}
                />
                <div
                  className="bar-segment low"
                  style={{ width: `${(priorityStats.LOW / (stats.total || 1)) * 100 || 0}%` }}
                  title={`${priorityStats.LOW} Low`}
                />
              </div>
              <div className="priority-legend">
                <span className="legend-item">
                  <span className="legend-color high" /> High: {priorityStats.HIGH}
                </span>
                <span className="legend-item">
                  <span className="legend-color medium" /> Mid: {priorityStats.MEDIUM}
                </span>
                <span className="legend-item">
                  <span className="legend-color low" /> Low: {priorityStats.LOW}
                </span>
              </div>
            </div>
          </Col>
        </Row>

        {/* View Toggle */}
        <Row className="mb-3">
          <Col>
            <div className="view-toggle">
              <Button
                variant={viewType === 'grid' ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => setViewType('grid')}
                className="me-2"
              >
                📊 Grid View
              </Button>
              <Button
                variant={viewType === 'table' ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => setViewType('table')}
              >
                📋 Table View
              </Button>
            </div>
          </Col>
          <Col md="auto">
            <small className="text-muted fw-bold">
              {displayedTickets.length} of {stats.total} tickets
            </small>
          </Col>
        </Row>

        {/* Tickets Content */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" className="mb-3"></Spinner>
            <p>Loading tickets...</p>
          </div>
        ) : displayedTickets.length === 0 ? (
          <Alert variant="info" className="text-center">
            <h5>No Tickets Found</h5>
            <p>No tickets match your filter criteria.</p>
          </Alert>
        ) : viewType === 'grid' ? (
          <Row>
            {displayedTickets.map((ticket) => (
              <Col md={6} lg={4} key={ticket.id} className="mb-4">
                <div className="ticket-grid-wrapper">
                  <TicketCard ticket={ticket} showAssignedTo={true} />
                  <div className="ticket-actions-overlay">
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => handleAssignClick(ticket)}
                      className="me-2"
                    >
                      👤 Assign
                    </Button>
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => handleStatusClick(ticket)}
                      className="me-2"
                    >
                      ⚙️ Status
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      📖 Details
                    </Button>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="table-responsive">
            <Table striped hover className="admin-table">
              <thead className="table-header">
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Reporter</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedTickets.map((ticket) => (
                  <tr key={ticket.id} className="table-row">
                    <td>
                      <code className="ticket-id">{ticket.id?.substring(0, 8)}</code>
                    </td>
                    <td className="fw-bold">{ticket.title}</td>
                    <td>{ticket.contactName}</td>
                    <td>
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td>
                      <TicketPriorityBadge priority={ticket.priority} />
                    </td>
                    <td>
                      {ticket.assignedTo ? (
                        <Badge bg="info">{ticket.assignedTo.username}</Badge>
                      ) : (
                        <Badge bg="light" text="dark">Unassigned</Badge>
                      )}
                    </td>
                    <td className="text-muted small">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="action-buttons">
                      <Button
                        variant="sm"
                        size="sm"
                        onClick={() => handleAssignClick(ticket)}
                        className="action-btn assign-btn"
                        title="Assign technician"
                      >
                        👤
                      </Button>
                      <Button
                        variant="sm"
                        size="sm"
                        onClick={() => handleStatusClick(ticket)}
                        className="action-btn status-btn"
                        title="Update status"
                      >
                        ⚙️
                      </Button>
                      <Button
                        variant="sm"
                        size="sm"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="action-btn detail-btn"
                        title="View details"
                      >
                        📖
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Container>

      {/* Assign Technician Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title>👤 Assign Technician</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTicket && (
            <>
              <div className="mb-3">
                <small className="text-muted">Ticket</small>
                <p className="mb-0">
                  <strong>{selectedTicket.title}</strong>
                </p>
              </div>
              <Form.Group>
                <Form.Label className="fw-bold">Select Technician</Form.Label>
                <Form.Select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Choose a technician...</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.username} ({tech.email})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowAssignModal(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAssignTechnician} disabled={submitting}>
            {submitting ? <Spinner size="sm" className="me-2" /> : '✓'} Assign
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Update Status Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title>⚙️ Update Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTicket && (
            <>
              <div className="mb-3">
                <small className="text-muted">Ticket</small>
                <p className="mb-0">
                  <strong>{selectedTicket.title}</strong>
                </p>
              </div>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">New Status</Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={submitting}
                >
                  <option value="OPEN">🔴 Open</option>
                  <option value="IN_PROGRESS">🟡 In Progress</option>
                  <option value="RESOLVED">🔵 Resolved</option>
                  <option value="CLOSED">🟢 Closed</option>
                  <option value="REJECTED">⚫ Rejected</option>
                </Form.Select>
              </Form.Group>

              {newStatus === 'REJECTED' && (
                <Form.Group>
                  <Form.Label className="fw-bold">Reason for Rejection</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Explain why this ticket is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    disabled={submitting}
                  />
                </Form.Group>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top">
          <Button variant="secondary" onClick={() => setShowStatusModal(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus} disabled={submitting}>
            {submitting ? <Spinner size="sm" className="me-2" /> : '✓'} Update
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminTicketsPage;
