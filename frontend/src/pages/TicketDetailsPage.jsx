import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Spinner,
  Alert,
  Badge,
  Modal,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import TicketStatusBadge from '../components/TicketStatusBadge';
import TicketPriorityBadge from '../components/TicketPriorityBadge';
import { ticketAPI, authAPI } from '../services/api';
import './TicketDetailsPage.css';

/**
 * TicketDetailsPage - Full ticket details with:
 * - Timeline view
 * - Comments section
 * - Attachment gallery
 * - Admin actions (assign, status change)
 * - SLA tracking
 */
const TicketDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const normalizeTicket = (raw) => {
    if (!raw) return raw;

    const assignedTo = raw.assignedTo || (
      raw.assignedToId || raw.assignedToUsername
        ? {
            id: raw.assignedToId,
            username: raw.assignedToUsername,
            specialization: raw.assignedToSpecialization,
          }
        : null
    );

    const reportedBy = raw.reportedBy || (
      raw.reportedById || raw.reportedByUsername
        ? {
            id: raw.reportedById,
            username: raw.reportedByUsername,
          }
        : null
    );

    return {
      ...raw,
      assignedTo,
      reportedBy,
    };
  };

  const normalizeComments = (items) => {
    return (items || []).map((comment) => ({
      ...comment,
      author: comment.author || (
        comment.authorId || comment.authorUsername
          ? {
              id: comment.authorId,
              username: comment.authorUsername,
            }
          : null
      ),
    }));
  };

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');

  const formatSpecialization = (value) => {
    const labels = {
      ELECTRICIAN: 'Electrician',
      TECHNICIAN: 'Technician',
      IT_ASSISTANT: 'IT Assistant',
      GENERAL: 'General',
    };

    return labels[value] || value || 'General';
  };

  // Fetch ticket and comments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const profile = authAPI.getProfile();
        setUserRole(profile?.role);
        setIsAdmin(profile?.role === 'ADMIN');

        // Fetch ticket
        const ticketRes = await ticketAPI.getTicketById(id);
        const normalizedTicket = normalizeTicket(ticketRes.data);
        setTicket(normalizedTicket);
        setNewStatus(normalizedTicket.status);
        setSelectedTechnician(normalizedTicket.assignedTo?.id || '');

        // Fetch comments
        try {
          const commentsRes = await ticketAPI.getComments(id);
          setComments(normalizeComments(commentsRes.data));
        } catch (commentError) {
          console.error('Error fetching comments:', commentError);
          setComments([]);
        }

        // Fetch technicians
        if (profile?.role === 'ADMIN') {
          try {
            const techRes = await ticketAPI.getTechnicians();
            setTechnicians(techRes.data || []);
          } catch (error) {
            console.error('Error fetching technicians:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching ticket:', error);
        toast.error('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.warning('Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);

      await ticketAPI.addComment(id, { content: newComment });

      // Refresh comments
      const commentsRes = await ticketAPI.getComments(id);
      setComments(normalizeComments(commentsRes.data));

      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      setSubmitting(true);

      const updateData = {
        status: newStatus,
        ...(newStatus === 'REJECTED' && { rejectionReason }),
      };

      await ticketAPI.updateTicketStatus(id, updateData);

      // Refresh ticket
      const ticketRes = await ticketAPI.getTicketById(id);
      setTicket(normalizeTicket(ticketRes.data));

      setShowStatusModal(false);
      toast.success('Ticket status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) {
      toast.warning('Please select a technician');
      return;
    }

    try {
      setSubmitting(true);
      await ticketAPI.assignTechnician(id, { technicianId: selectedTechnician });

      // Refresh ticket
      const ticketRes = await ticketAPI.getTicketById(id);
      setTicket(normalizeTicket(ticketRes.data));

      setShowAssignModal(false);
      toast.success('Technician assigned successfully');
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast.error('Failed to assign technician');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    const isConfirmed = window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.');
    if (!isConfirmed) {
      return;
    }

    try {
      setSubmitting(true);
      await ticketAPI.deleteTicket(id);
      toast.success('Ticket deleted successfully');
      navigate('/admin/tickets');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateSLA = () => {
    if (!ticket) return null;

    const prioritySLA = {
      HIGH: 24,
      MEDIUM: 72,
      LOW: 168,
    };

    const hours = prioritySLA[ticket.priority] || 72;
    const createdDate = new Date(ticket.createdAt);
    const dueDate = new Date(createdDate.getTime() + hours * 60 * 60 * 1000);
    const now = new Date();

    return {
      dueDate,
      hoursRemaining: Math.round((dueDate - now) / (1000 * 60 * 60)),
      isOverdue: now > dueDate,
    };
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading ticket details...</p>
      </Container>
    );
  }

  if (!ticket) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <h5>Ticket Not Found</h5>
          <p>The requested ticket could not be found.</p>
          <Button onClick={() => navigate('/tickets')} variant="primary">
            Back to Tickets
          </Button>
        </Alert>
      </Container>
    );
  }

  const sla = calculateSLA();
  const canEdit = isAdmin || ticket.reportedBy?.id === authAPI.getProfile()?.id;

  return (
    <div className="ticket-details-page">
      <Container fluid className="py-5">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="ticket-header">
              <div>
                <h1>
                  Ticket #{ticket.id?.substring(0, 8)}
                  <TicketStatusBadge status={ticket.status} className="ms-3" />
                </h1>
                <h4 className="text-muted mt-2">{ticket.title}</h4>
              </div>
              <div className="header-actions">
                <TicketPriorityBadge priority={ticket.priority} />
                {isAdmin && (
                  <Button
                    variant="primary"
                    onClick={() => setShowStatusModal(true)}
                    size="sm"
                  >
                    Change Status
                  </Button>
                )}
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          {/* Main Content */}
          <Col lg={8}>
            {/* Ticket Info Card */}
            <Card className="mb-4 ticket-info-card">
              <Card.Header className="bg-light">
                <h6 className="mb-0">📝 Ticket Information</h6>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <div className="info-group">
                      <small className="text-muted">Category</small>
                      <p className="fw-bold">{ticket.category}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="info-group">
                      <small className="text-muted">Status</small>
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <div className="info-group">
                      <small className="text-muted">Priority</small>
                      <TicketPriorityBadge priority={ticket.priority} />
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="info-group">
                      <small className="text-muted">Created Date</small>
                      <p className="fw-bold">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Col>
                </Row>

                <div className="info-group">
                  <small className="text-muted">Location</small>
                  <p className="fw-bold">
                    {ticket.locationText || ticket.resourceId || 'Not specified'}
                  </p>
                </div>

                <div className="info-group">
                  <small className="text-muted">Description</small>
                  <p>{ticket.description}</p>
                </div>

                <div className="info-group">
                  <small className="text-muted">Current Assignment</small>
                  {ticket.assignedTo ? (
                    <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                      <Badge bg="info">{ticket.assignedTo.username}</Badge>
                      <Badge bg="secondary">
                        {formatSpecialization(ticket.assignedTo.specialization)}
                      </Badge>
                      <Badge bg="primary">{ticket.status}</Badge>
                    </div>
                  ) : (
                    <Alert variant="warning" className="mt-2 mb-0">
                      Not assigned yet. Current status: {ticket.status}
                    </Alert>
                  )}
                </div>

                {ticket.resolutionNotes && (
                  <div className="info-group resolution-notes">
                    <small className="text-muted">Resolution Notes</small>
                    <Alert variant="success" className="mt-2">
                      {ticket.resolutionNotes}
                    </Alert>
                  </div>
                )}

                {ticket.rejectionReason && (
                  <div className="info-group rejection-reason">
                    <small className="text-muted">Rejection Reason</small>
                    <Alert variant="danger" className="mt-2">
                      {ticket.rejectionReason}
                    </Alert>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Comments Section */}
            <Card className="comments-card">
              <Card.Header className="bg-light">
                <h6 className="mb-0">💬 Comments ({comments.length})</h6>
              </Card.Header>
              <Card.Body>
                {/* Comment List */}
                <div className="comments-list mb-4">
                  {comments.length === 0 ? (
                    <Alert variant="info">No comments yet. Be the first to comment!</Alert>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <strong>{comment.author?.username}</strong>
                          <small className="text-muted">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                        <p className="comment-text">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <Form onSubmit={handleAddComment}>
                  <Form.Group className="mb-3">
                    <Form.Label>Add a Comment</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts or updates..."
                      disabled={submitting}
                    />
                  </Form.Group>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            {/* Assignee Card */}
            <Card className="mb-4 sidebar-card">
              <Card.Header className="bg-light">
                <h6 className="mb-0">👤 Assignment</h6>
              </Card.Header>
              <Card.Body>
                {ticket.assignedTo ? (
                  <>
                    <p className="mb-1">
                      <small className="text-muted">Assigned To</small>
                    </p>
                    <p className="fw-bold mb-1">{ticket.assignedTo.username}</p>
                    <Badge bg="info" className="mb-2">
                      {formatSpecialization(ticket.assignedTo.specialization)}
                    </Badge>
                    {isAdmin && (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="w-100 mt-3"
                        onClick={() => setShowAssignModal(true)}
                      >
                        👤 Change Assignment
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Alert variant="warning" className="mb-3">
                      Not yet assigned to a technician
                    </Alert>
                    {isAdmin && (
                      <Button
                        variant="warning"
                        size="sm"
                        className="w-100"
                        onClick={() => setShowAssignModal(true)}
                      >
                        👤 Assign Technician
                      </Button>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>

            {/* SLA Card */}
            {sla && (
              <Card className="mb-4 sidebar-card sla-card">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">⏱️ SLA Status</h6>
                </Card.Header>
                <Card.Body>
                  <div className="sla-status">
                    <div className={`sla-indicator ${sla.isOverdue ? 'overdue' : 'active'}`}>
                      {sla.isOverdue ? '⚠️ OVERDUE' : `${Math.max(0, sla.hoursRemaining)}h remaining`}
                    </div>
                    <small className="text-muted d-block mt-2">
                      Due: {sla.dueDate.toLocaleDateString()}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Contact Card */}
            <Card className="mb-4 sidebar-card">
              <Card.Header className="bg-light">
                <h6 className="mb-0">📧 Contact Info</h6>
              </Card.Header>
              <Card.Body>
                <p className="mb-1">
                  <small className="text-muted">Name</small>
                </p>
                <p className="fw-bold">{ticket.contactName}</p>

                <p className="mb-1 mt-3">
                  <small className="text-muted">Email</small>
                </p>
                <p className="fw-bold">{ticket.contactEmail}</p>
              </Card.Body>
            </Card>

            {/* Actions Card */}
            <Card className="sidebar-card">
              <Card.Header className="bg-light">
                <h6 className="mb-0">⚙️ Actions</h6>
              </Card.Header>
              <Card.Body>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="w-100 mb-2"
                  onClick={() => navigate('/tickets')}
                >
                  ← Back to Tickets
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="w-100"
                    onClick={handleDeleteTicket}
                    disabled={submitting}
                  >
                    {submitting ? 'Deleting...' : 'Delete Ticket'}
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Status Change Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>⚙️ Change Ticket Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Rejection Reason *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                disabled={submitting}
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStatusChange}
            disabled={submitting || (newStatus === 'REJECTED' && !rejectionReason.trim())}
          >
            {submitting ? <Spinner size="sm" className="me-2" /> : '✓'} Update Status
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assignment Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>👤 Assign Technician</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                      {tech.username} ({formatSpecialization(tech.specialization)})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleAssignTechnician}
            disabled={submitting || !selectedTechnician}
          >
            {submitting ? <Spinner size="sm" className="me-2" /> : '✓'} Assign
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TicketDetailsPage;
