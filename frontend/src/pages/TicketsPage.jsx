import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import TicketCard from '../components/TicketCard';
import { ticketAPI } from '../services/api';
import './TicketsPage.css';

/**
 * TicketsPage - User views their reported tickets
 * Features:
 * - Filter by status
 * - Sort by date/priority
 * - Search by title
 * - Quick action buttons
 */
const TicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });

  const statusOptions = [
    { value: 'ALL', label: 'All Tickets' },
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  // Fetch user's tickets on mount
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      const response = await ticketAPI.getMyTickets(0, 100);
      const allTickets = response.data || [];

      setTickets(allTickets);

      // Calculate stats
      const stats = {
        total: allTickets.length,
        open: allTickets.filter((t) => t.status === 'OPEN').length,
        inProgress: allTickets.filter((t) => t.status === 'IN_PROGRESS').length,
        resolved: allTickets.filter((t) => t.status === 'RESOLVED').length,
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort tickets
  const getFilteredTickets = () => {
    let filtered = [...tickets];

    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    // Search by title
    if (searchQuery.trim()) {
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'priority-high') {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      return 0;
    });

    return filtered;
  };

  const displayedTickets = getFilteredTickets();

  return (
    <div className="tickets-page">
      <Container fluid className="py-5">
        {/* Page Header */}
        <Row className="mb-5">
          <Col>
            <div className="page-header">
              <h1>📋 My Maintenance Tickets</h1>
              <p className="text-muted">Track and manage all your reported incidents</p>
            </div>
          </Col>
          <Col md="auto">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/tickets/create')}
              className="btn-create-ticket"
            >
              + Create New Ticket
            </Button>
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col md={3} sm={6} className="mb-3">
            <div className="stat-card stat-total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{stats.total}</h3>
                <p>Total Tickets</p>
              </div>
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <div className="stat-card stat-open">
              <div className="stat-icon">🔴</div>
              <div className="stat-content">
                <h3>{stats.open}</h3>
                <p>Open</p>
              </div>
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <div className="stat-card stat-progress">
              <div className="stat-icon">🟡</div>
              <div className="stat-content">
                <h3>{stats.inProgress}</h3>
                <p>In Progress</p>
              </div>
            </div>
          </Col>
          <Col md={3} sm={6} className="mb-3">
            <div className="stat-card stat-resolved">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{stats.resolved}</h3>
                <p>Resolved</p>
              </div>
            </div>
          </Col>
        </Row>

        {/* Filters & Search */}
        <Row className="mb-4">
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-bold">Search Tickets</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-bold">Filter by Status</Form.Label>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label className="fw-bold">Sort By</Form.Label>
              <Form.Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority-high">High Priority First</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Tickets Grid */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-3">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p>Loading your tickets...</p>
          </div>
        ) : displayedTickets.length === 0 ? (
          <Alert variant="info" className="text-center py-5">
            <h5>📭 No Tickets Found</h5>
            <p className="mb-3">
              {tickets.length === 0
                ? 'You haven\'t created any tickets yet. Report an issue to get started!'
                : 'No tickets match your current filters.'}
            </p>
            {tickets.length === 0 && (
              <Button
                variant="primary"
                onClick={() => navigate('/tickets/create')}
              >
                Create Your First Ticket
              </Button>
            )}
          </Alert>
        ) : (
          <Row>
            {displayedTickets.map((ticket) => (
              <Col md={6} lg={4} key={ticket.id} className="mb-4">
                <TicketCard ticket={ticket} showAssignedTo={false} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default TicketsPage;
