import React from 'react';
import { Badge } from 'react-bootstrap';
import './TicketStatusBadge.css';

/**
 * TicketStatusBadge - Visual indicator for ticket status
 * Shows color-coded status with progress indication
 */
const TicketStatusBadge = ({ status, className = '' }) => {
  const statusConfig = {
    OPEN: {
      variant: 'danger',
      icon: '🔴',
      label: 'Open',
      description: 'Ticket received, awaiting assignment',
    },
    IN_PROGRESS: {
      variant: 'warning',
      icon: '🟡',
      label: 'In Progress',
      description: 'Technician is working on this',
    },
    RESOLVED: {
      variant: 'info',
      icon: '🔵',
      label: 'Resolved',
      description: 'Issue resolved, awaiting closure',
    },
    CLOSED: {
      variant: 'success',
      icon: '🟢',
      label: 'Closed',
      description: 'Ticket completed',
    },
    REJECTED: {
      variant: 'secondary',
      icon: '⚫',
      label: 'Rejected',
      description: 'Ticket rejected',
    },
  };

  const config = statusConfig[status] || statusConfig.OPEN;

  return (
    <div className={`ticket-status-badge ${className}`} title={config.description}>
      <span className="status-icon">{config.icon}</span>
      <Badge bg={config.variant} className="status-badge">
        {config.label}
      </Badge>
    </div>
  );
};

export default TicketStatusBadge;
