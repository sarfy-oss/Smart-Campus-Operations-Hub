import React, { useState, useEffect } from 'react';
import {
  Form,
  Button,
  Card,
  Alert,
  Row,
  Col,
  ProgressBar,
  Spinner,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import './TicketForm.css';

/**
 * TicketForm - Create/edit incident tickets with:
 * - Smart category suggestion (AI-powered)
 * - Multi-image upload (up to 3)
 * - Priority indicators with SLA
 * - Real-time form validation
 */
const TicketForm = ({ onSubmit, loading = false, initialData = null, resources = [] }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || 'OTHER',
    description: initialData?.description || '',
    priority: initialData?.priority || 'MEDIUM',
    resourceId: initialData?.resourceId || '',
    locationText: initialData?.locationText || '',
    contactName: initialData?.contactName || '',
    contactEmail: initialData?.contactEmail || '',
  });

  const [files, setFiles] = useState([]);
  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  const categories = [
    { value: 'ELECTRICAL', label: '⚡ Electrical' },
    { value: 'EQUIPMENT', label: '🔧 Equipment' },
    { value: 'NETWORK', label: '🌐 Network/IT' },
    { value: 'STRUCTURAL', label: '🏗️ Structural' },
    { value: 'OTHER', label: '📋 Other' },
  ];

  const priorities = [
    { value: 'LOW', label: 'Low Priority', sla: '5-7 days' },
    { value: 'MEDIUM', label: 'Medium Priority', sla: '2-3 days' },
    { value: 'HIGH', label: 'High Priority', sla: '24 hours' },
  ];

  // AI-powered category suggestion based on description
  useEffect(() => {
    if (formData.description.length > 20) {
      const suggestion = suggestCategory(formData.description);
      setSuggestedCategory(suggestion);
    } else {
      setSuggestedCategory(null);
    }
  }, [formData.description]);

  // Simple AI: keyword-based category suggestion
  const suggestCategory = (text) => {
    const lowerText = text.toLowerCase();

    const categoryKeywords = {
      ELECTRICAL: ['electrical', 'lights', 'power', 'outlet', 'voltage', 'wire', 'switch', 'circuit', 'wiring'],
      EQUIPMENT: ['equipment', 'machine', 'device', 'motor', 'pump', 'compressor', 'fan', 'broken', 'malfunction'],
      NETWORK: ['internet', 'network', 'wifi', 'server', 'computer', 'data', 'software', 'system', 'email', 'connectivity'],
      STRUCTURAL: ['building', 'wall', 'roof', 'floor', 'door', 'window', 'crack', 'leak', 'structural', 'ceiling'],
    };

    let bestMatch = null;
    let maxMatches = 0;

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      const matches = keywords.filter((kw) => lowerText.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = category;
      }
    });

    return bestMatch;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);

    if (files.length + newFiles.length > 3) {
      toast.error('Maximum 3 images allowed per ticket');
      return;
    }

    // Validate file types
    const validFiles = newFiles.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.description.trim().length < 10) errors.description = 'Description must be at least 10 characters';
    if (!formData.contactName.trim()) errors.contactName = 'Contact name is required';
    if (!formData.contactEmail.trim()) errors.contactEmail = 'Contact email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const submissionData = new FormData();

    // Append form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value) submissionData.append(key, value);
    });

    // Append files
    files.forEach((file) => {
      submissionData.append('files', file);
    });

    try {
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const selectedPriority = priorities.find((p) => p.value === formData.priority);

  return (
    <Card className="ticket-form-card">
      <Card.Header className="bg-light">
        <h5 className="mb-0">📝 Create Incident Ticket</h5>
        <small className="text-muted">Report a maintenance issue or incident</small>
      </Card.Header>

      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-section">
            <h6 className="section-title">Basic Information</h6>

            <Form.Group className="mb-3">
              <Form.Label>Ticket Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Brief description of the issue"
                isInvalid={!!formErrors.title}
                maxLength={100}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.title}
              </Form.Control.Feedback>
              <small className="text-muted">{formData.title.length}/100 characters</small>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </Form.Select>

                  {suggestedCategory && suggestedCategory !== formData.category && (
                    <div className="suggested-category mt-2">
                      <small className="text-info">
                        💡 We suggest: <strong>{suggestedCategory}</strong>
                        <Button
                          variant="link"
                          size="sm"
                          className="ms-2"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              category: suggestedCategory,
                            }))
                          }
                        >
                          Apply
                        </Button>
                      </small>
                    </div>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority *</Form.Label>
                  <Form.Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    {priorities.map((pri) => (
                      <option key={pri.value} value={pri.value}>
                        {pri.label} - SLA: {pri.sla}
                      </option>
                    ))}
                  </Form.Select>

                  {selectedPriority && (
                    <div className="sla-indicator mt-2">
                      <small className="text-muted">Expected resolution time:</small>
                      <div className="sla-text">{selectedPriority.sla}</div>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Detailed Description *</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide detailed information about the issue (what, when, where)"
                rows={5}
                isInvalid={!!formErrors.description}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
              <small className="text-muted">{formData.description.length} characters</small>
            </Form.Group>
          </div>

          {/* Location Information */}
          <div className="form-section">
            <h6 className="section-title">Location</h6>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Resource/Location</Form.Label>
                  <Form.Select
                    name="resourceId"
                    value={formData.resourceId}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a resource (optional)</option>
                    {resources.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.name} - {res.location}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Or Enter Location Text</Form.Label>
                  <Form.Control
                    type="text"
                    name="locationText"
                    value={formData.locationText}
                    onChange={handleInputChange}
                    placeholder="e.g., Building A, Room 205"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Contact Information */}
          <div className="form-section">
            <h6 className="section-title">Contact Information</h6>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Your Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    isInvalid={!!formErrors.contactName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.contactName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    isInvalid={!!formErrors.contactEmail}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.contactEmail}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Image Attachments */}
          <div className="form-section">
            <h6 className="section-title">Evidence Images (Optional)</h6>
            <p className="text-muted small">
              Upload up to 3 images to help technicians understand the issue
            </p>

            <Form.Group className="mb-3">
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={files.length >= 3}
              />
              {files.length >= 3 && (
                <small className="text-warning d-block mt-2">
                  Maximum 3 images reached
                </small>
              )}
            </Form.Group>

            {files.length > 0 && (
              <div className="uploaded-files">
                <h6>Attached Images ({files.length}/3)</h6>
                <div className="file-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-preview">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="file-thumbnail"
                        />
                      </div>
                      <div className="file-info">
                        <small className="d-block text-truncate">{file.name}</small>
                        <small className="text-muted">
                          {(file.size / 1024).toFixed(2)} KB
                        </small>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="ms-auto"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="form-actions">
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              size="lg"
              className="w-100"
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Creating Ticket...
                </>
              ) : (
                '✓ Create Ticket'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default TicketForm;
