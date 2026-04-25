import React from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import TicketStatusBadge from './TicketStatusBadge';
import TicketPriorityBadge from './TicketPriorityBadge';
import './TicketCard.css';

/**
 * TicketCard - Displays a single ticket in a compact card format
 * Shows key info: ID, title, status, priority, category, assigned technician
 */
const TicketCard = ({ ticket, onStatusClick, showAssignedTo = false }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/tickets/${ticket.id}`);
  };

  const categoryColors = {
    ELECTRICAL: 'info',
    PLUMBING: 'warning',
    HVAC: 'secondary',
    STRUCTURAL: 'danger',
    IT: 'primary',
    CLEANING: 'success',
    OTHER: 'light',
  };

  const daysAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <Card className="ticket-card h-100 border-left">
      <Card.Body className="d-flex flex-column">
        <Row className="mb-3">
          <Col md={8}>
            <div className="ticket-header">
              <span className="ticket-id">#{ticket.id?.substring(0, 8)}</span>
              <h5 className="ticket-title mb-0">{ticket.title}</h5>
            </div>
          </Col>
          <Col md={4} className="text-end">
            <TicketPriorityBadge priority={ticket.priority} />
          </Col>
        </Row>

        <div className="ticket-meta mb-2">
          <TicketStatusBadge status={ticket.status} />
          <span className="category-badge">
            {ticket.category}
          </span>
        </div>

        <div className="ticket-description mb-3">
          <p className="text-muted small">
            {ticket.description?.length > 100
              ? `${ticket.description.substring(0, 100)}...`
              : ticket.description}
          </p>
        </div>

        {showAssignedTo && ticket.assignedTo && (
          <div className="ticket-assigned mb-2">
            <small className="text-muted">
              Assigned to:{' '}
              <strong>{ticket.assignedTo.username}</strong>
            </small>
          </div>
        )}

        <div className="ticket-footer mt-auto">
          <small className="text-muted d-block mb-2">
            {daysAgo(ticket.createdAt)}
          </small>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleViewDetails}
            className="w-100"
          >
            View Details →
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TicketCard;
