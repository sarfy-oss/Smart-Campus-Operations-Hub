import React from 'react';
import { Badge } from 'react-bootstrap';
import './TicketPriorityBadge.css';

/**
 * TicketPriorityBadge - Visual indicator for ticket priority
 * Shows priority level with urgency indication
 */
const TicketPriorityBadge = ({ priority, className = '' }) => {
  const priorityConfig = {
    LOW: {
      variant: 'success',
      icon: '↓',
      label: 'Low',
      urgency: 'Non-urgent',
    },
    MEDIUM: {
      variant: 'warning',
      icon: '→',
      label: 'Medium',
      urgency: 'Standard',
    },
    HIGH: {
      variant: 'danger',
      icon: '↑',
      label: 'High',
      urgency: 'Urgent',
    },
  };

  const config = priorityConfig[priority] || priorityConfig.MEDIUM;

  return (
    <Badge bg={config.variant} className={`priority-badge ${className}`} title={config.urgency}>
      <span className="priority-icon">{config.icon}</span>
      {config.label}
    </Badge>
  );
};

export default TicketPriorityBadge;
