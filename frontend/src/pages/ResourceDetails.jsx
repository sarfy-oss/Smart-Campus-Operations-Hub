import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Form,
  ListGroup,
  Spinner,
  Button,
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import OperationsSidebar from '../components/OperationsSidebar';
import TopbarUserMenu from '../components/TopbarUserMenu';
import { authAPI, resourceAPI } from '../services/api';
import { formatDate, getEnumDisplay } from '../utils/helpers';

const resourceShellStyles = String.raw`
.rm-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 285px 1fr;
  background: #f2f4f8;
  color: #101828;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.rm-sidebar {
  background: radial-gradient(circle at 10% 0%, #1e376f 0%, #152d5d 30%, #0f2349 60%, #0b1b3b 100%);
  color: #e9efff;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 14px 12px;
}

.rm-brand {
  height: 66px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  padding: 0 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  margin-bottom: 16px;
}

.rm-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rm-nav-item {
  border: none;
  background: transparent;
  color: #d7e2ff;
  font-size: 16px;
  text-align: left;
  padding: 11px 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.rm-nav-item span {
  width: 26px;
  text-align: center;
  opacity: 0.95;
}

.rm-nav-item-active {
  background: linear-gradient(90deg, #2f5bb3, #315fae);
  color: #fff;
}

.rm-main {
  display: flex;
  flex-direction: column;
}

.rm-topbar {
  min-height: 82px;
  background: #f8f9fc;
  border-bottom: 1px solid #d9dee8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
}

.rm-topbar h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1d2433;
}

.rm-user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: #2b3444;
}

.rm-logout-btn {
  border: 1px solid #d4d9e2;
  border-radius: 6px;
  background: #fff;
  color: #2b3444;
  font-size: 14px;
  padding: 6px 10px;
}

.rm-content {
  padding: 22px 30px;
}

.rm-actions-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.rm-add-btn.btn.btn-primary {
  background: #2f5cad;
  border-color: #2f5cad;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  padding: 8px 18px;
}

.rm-filter-card {
  background: #fff;
  border: 1px solid #dce2ec;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 18px;
}

.rm-filter-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 120px;
  gap: 12px;
}

.rm-search-input,
.rm-select,
.rm-search-btn,
.rm-reset-btn {
  border: 1px solid #ccd3df;
  border-radius: 6px;
  min-height: 44px;
  font-size: 15px;
}

.rm-search-input,
.rm-select {
  padding: 10px 12px;
  background: #fff;
}

.rm-search-btn {
  background: #f5f7fb;
  color: #2a3342;
}

.rm-reset-btn {
  margin-top: 10px;
  min-height: 38px;
  background: #f5f7fb;
  color: #2a3342;
  padding: 0 14px;
}

.rm-table-meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
  color: #4c586c;
}

.rm-pager {
  display: flex;
  gap: 8px;
}

.rm-pager button {
  min-height: 34px;
  padding: 0 16px;
  border-radius: 6px;
  border: 1px solid #cfd6e1;
  background: #fff;
  color: #2a3342;
}

.rm-pager button:disabled {
  opacity: 0.5;
}

.rm-table-card {
  background: #fff;
  border: 1px solid #dce2ec;
  border-radius: 8px;
  overflow: hidden;
}

.rm-table {
  width: 100%;
  border-collapse: collapse;
}

.rm-table thead {
  background: #f2f4f8;
}

.rm-table th,
.rm-table td {
  padding: 14px 14px;
  border-bottom: 1px solid #e0e6ef;
  font-size: 15px;
  color: #253041;
  vertical-align: middle;
}

.rm-table th {
  font-size: 16px;
  font-weight: 600;
}

.rm-name {
  font-size: 20px;
  font-weight: 500;
  color: #1f2938;
}

.rm-thumb {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
  background: #e9edf4;
}

.rm-thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #66758e;
}

.rm-status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.rm-status-available {
  background: #d7f3df;
  color: #237d3b;
}

.rm-status-other {
  background: #eceff6;
  color: #55627a;
}

.rm-type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.rm-type-lab {
  background: #dceeff;
  color: #0e5cab;
}

.rm-type-hall {
  background: #e7e5ff;
  color: #4d3ab0;
}

.rm-type-room {
  background: #e9edf4;
  color: #45556f;
}

.rm-type-equipment {
  background: #fff3d6;
  color: #8b5d05;
}

.rm-action-buttons {
  display: flex;
  gap: 8px;
}

.rm-action-buttons button {
  border: 1px solid #c8d0df;
  border-radius: 6px;
  background: #f3f6fc;
  color: #2a3342;
  font-size: 14px;
  padding: 6px 12px;
}

.rm-action-buttons .rm-view-btn {
  background: #2f5cad;
  border-color: #2f5cad;
  color: #ffffff;
}

.rm-action-buttons .rm-edit-btn {
  background: #f4c542;
  border-color: #e6b72f;
  color: #3d2b00;
}

.rm-action-buttons .rm-delete-btn {
  background: #dc3545;
  border-color: #dc3545;
  color: #ffffff;
}

.rm-empty,
.rm-loading-wrap {
  text-align: center;
  padding: 36px;
  color: #64748b;
}

@media (max-width: 1100px) {
  .rm-page {
    grid-template-columns: 1fr;
  }

  .rm-sidebar {
    display: none;
  }

  .rm-filter-row {
    grid-template-columns: 1fr;
  }

  .rm-topbar h1 {
    font-size: 28px;
  }
}
`;

const resourceDetailsStyles = String.raw`
.rd-actions-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.rd-details-card {
  background: #ffffff;
  border: 1px solid #dce2ec;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 380px 1fr;
  box-shadow: 0 1px 4px rgba(16, 24, 40, 0.08);
}

.rd-image-wrap {
  min-height: 320px;
  background: #eef3fa;
}

.rd-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.rd-image-placeholder {
  width: 100%;
  height: 100%;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #68778f;
  font-weight: 600;
}

.rd-content {
  padding: 24px;
}

.rd-content h2 {
  margin: 0 0 12px 0;
  font-size: 30px;
  color: #1d2433;
}

.rd-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.rd-availability-card {
  border: 1px solid #dce2ec;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fafc 0%, #f3f7fb 100%);
  padding: 14px 16px;
  margin-bottom: 16px;
}

.rd-availability-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.rd-availability-title {
  font-size: 14px;
  font-weight: 700;
  color: #44536a;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rd-availability-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 800;
}

.rd-availability-pill-available {
  background: #d7f3df;
  color: #237d3b;
}

.rd-availability-pill-unavailable {
  background: #fee2e2;
  color: #991b1b;
}

.rd-availability-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.rd-availability-item {
  background: #fff;
  border: 1px solid #e1e7f1;
  border-radius: 8px;
  padding: 10px 12px;
}

.rd-availability-item span {
  display: block;
  font-size: 12px;
  color: #67758d;
  margin-bottom: 4px;
}

.rd-availability-item strong {
  font-size: 14px;
  color: #223046;
}

.rd-description {
  margin: 0 0 16px 0;
  color: #46546c;
  line-height: 1.5;
}

.rd-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.rd-item {
  background: #f7f9fc;
  border: 1px solid #e1e7f1;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rd-item span {
  font-size: 12px;
  color: #67758d;
}

.rd-item strong {
  font-size: 15px;
  color: #223046;
}

.rd-item-full {
  grid-column: 1 / -1;
}

.rd-reviews-card {
  margin-top: 18px;
  background: #ffffff;
  border: 1px solid #dce2ec;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(16, 24, 40, 0.08);
}

.rd-reviews-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e6ebf2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.rd-reviews-header h3 {
  margin: 0;
  font-size: 20px;
  color: #1d2433;
}

.rd-reviews-meta {
  color: #66758e;
  font-size: 14px;
}

.rd-reviews-body {
  padding: 18px 20px 20px;
}

.rd-review-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.rd-review-summary .badge {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
}

.rd-review-form {
  background: #f7f9fc;
  border: 1px solid #e1e7f1;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 18px;
}

.rd-review-form h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #1d2433;
}

.rd-rating-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0 14px;
}

.rd-rating-pill {
  border: 1px solid #cfd7e6;
  background: #fff;
  color: #2a3342;
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 700;
}

.rd-rating-pill-active {
  background: #2f5cad;
  color: #fff;
  border-color: #2f5cad;
}

.rd-review-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.rd-review-list {
  margin-top: 10px;
}

.rd-review-item {
  border: 1px solid #e1e7f1;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  background: #fff;
}

.rd-review-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.rd-review-user {
  font-weight: 700;
  color: #223046;
}

.rd-review-stars {
  color: #f4b400;
  font-weight: 800;
}

.rd-review-comment {
  margin: 0;
  color: #46546c;
  line-height: 1.5;
}

.rd-review-date {
  margin-top: 8px;
  font-size: 12px;
  color: #7a879c;
}

.rd-review-empty {
  color: #64748b;
  padding: 8px 0 0;
}

@media (max-width: 1100px) {
  .rd-details-card {
    grid-template-columns: 1fr;
  }

  .rd-image-wrap,
  .rd-image-placeholder {
    min-height: 260px;
  }

  .rd-actions-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .rd-grid {
    grid-template-columns: 1fr;
  }
}
`;

/**
 * Resource Details Page - displays full information about a single resource
 */
const ResourceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = authAPI.isAdmin();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ totalReviews: 0, averageRating: 0 });
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Load resource details on component mount
  useEffect(() => {
    const loadResource = async () => {
      try {
        setLoadError('');
        const response = await resourceAPI.getResourceById(id);
        setResource(response.data);
      } catch (error) {
        setLoadError('Failed to load resource details');
      } finally {
        setLoading(false);
      }
    };

    loadResource();
  }, [id]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setReviewLoading(true);
        const [reviewsResponse, summaryResponse] = await Promise.all([
          resourceAPI.getResourceReviews(id),
          resourceAPI.getResourceReviewSummary(id),
        ]);

        setReviews(reviewsResponse.data || []);
        setReviewSummary(summaryResponse.data || { totalReviews: 0, averageRating: 0 });
      } catch (error) {
        setReviewError('Failed to load reviews');
      } finally {
        setReviewLoading(false);
      }
    };

    if (id) {
      loadReviews();
    }
  }, [id]);

  const averageRatingLabel = useMemo(() => {
    const value = Number(reviewSummary?.averageRating || 0);
    return value > 0 ? value.toFixed(1) : '0.0';
  }, [reviewSummary]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    const trimmedComment = reviewComment.trim();
    if (!trimmedComment) {
      setReviewError('Please enter a comment');
      return;
    }

    try {
      setReviewSubmitting(true);
      await resourceAPI.submitResourceReview(id, {
        rating: reviewRating,
        comment: trimmedComment,
      });

      setReviewSuccess('Your review was submitted successfully');
      setReviewComment('');
      setReviewRating(5);

      const [reviewsResponse, summaryResponse] = await Promise.all([
        resourceAPI.getResourceReviews(id),
        resourceAPI.getResourceReviewSummary(id),
      ]);

      setReviews(reviewsResponse.data || []);
      setReviewSummary(summaryResponse.data || { totalReviews: 0, averageRating: 0 });
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data || 'Failed to submit review';
      setReviewError(message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getResourceImageSrc = (item) => {
    const value = (item?.imageUrl || '').trim();
    if (!value) {
      return null;
    }

    if (value.startsWith('data:image') || value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    return `data:image/jpeg;base64,${value}`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="my-5 container">
        <div className="alert alert-warning mb-3">{loadError || 'Resource not found'}</div>
        <Button variant="secondary" onClick={() => navigate('/resources')}>
          Back to Resources
        </Button>
      </div>
    );
  }

  const imageSrc = getResourceImageSrc(resource);

  return (
    <div className="rm-page">
      <style>{`${resourceShellStyles}\n${resourceDetailsStyles}`}</style>
      <OperationsSidebar activeKey="resources" />

      <section className="rm-main">
        <header className="rm-topbar">
          <h1>Resource Details</h1>
          <TopbarUserMenu
            containerClassName="rm-user-menu"
            logoutButtonClassName="rm-logout-btn"
          />
        </header>

        <div className="rm-content">
          <div className="rd-actions-top">
            <Button variant="secondary" onClick={() => navigate('/resources')}>
              Back to Resources
            </Button>
            {isAdmin && (
              <Button className="rm-add-btn" onClick={() => navigate(`/resources/edit/${resource.id}`)}>
                Edit Resource
              </Button>
            )}
          </div>

          <div className="rd-details-card">
            <div className="rd-image-wrap">
              {imageSrc ? (
                <img src={imageSrc} alt={resource.name} className="rd-image" />
              ) : (
                <div className="rd-image-placeholder">No Image Available</div>
              )}
            </div>

            <div className="rd-content">
              <h2>{resource.name}</h2>

              <div className="rd-badges">
                <span className={`rm-type-badge rm-type-${(resource.type || '').toLowerCase()}`}>
                  {getEnumDisplay('ResourceType', resource.type)}
                </span>
                <span className={`rm-status-badge ${resource.status === 'AVAILABLE' ? 'rm-status-available' : 'rm-status-other'}`}>
                  {getEnumDisplay('ResourceStatus', resource.status)}
                </span>
              </div>

              <div className="rd-availability-card">
                <div className="rd-availability-head">
                  <div className="rd-availability-title">Availability</div>
                  <div className={`rd-availability-pill ${resource.status === 'AVAILABLE' ? 'rd-availability-pill-available' : 'rd-availability-pill-unavailable'}`}>
                    {resource.status === 'AVAILABLE' ? 'Available Now' : 'Not Available'}
                  </div>
                </div>

                <div className="rd-availability-grid">
                  <div className="rd-availability-item">
                    <span>Hours</span>
                    <strong>
                      {resource.availableFrom && resource.availableTo
                        ? `${resource.availableFrom} - ${resource.availableTo}`
                        : '-'}
                    </strong>
                  </div>
                  <div className="rd-availability-item">
                    <span>Days</span>
                    <strong>
                      {resource.availableDays && resource.availableDays.length > 0
                        ? resource.availableDays.map((day) => getEnumDisplay('AvailableDay', day)).join(', ')
                        : '-'}
                    </strong>
                  </div>
                  <div className="rd-availability-item">
                    <span>Status</span>
                    <strong>{getEnumDisplay('ResourceStatus', resource.status)}</strong>
                  </div>
                </div>
              </div>

              {resource.description && <p className="rd-description">{resource.description}</p>}

              <div className="rd-grid">
                <div className="rd-item">
                  <span>Capacity</span>
                  <strong>{resource.capacity} persons</strong>
                </div>
                <div className="rd-item">
                  <span>Location</span>
                  <strong>{resource.location || '-'}</strong>
                </div>
                <div className="rd-item">
                  <span>Category</span>
                  <strong>{resource.category || '-'}</strong>
                </div>
                <div className="rd-item">
                  <span>Available Hours</span>
                  <strong>{resource.availableFrom && resource.availableTo ? `${resource.availableFrom} - ${resource.availableTo}` : '-'}</strong>
                </div>
                <div className="rd-item rd-item-full">
                  <span>Available Days</span>
                  <strong>
                    {resource.availableDays && resource.availableDays.length > 0
                      ? resource.availableDays.map((day) => getEnumDisplay('AvailableDay', day)).join(', ')
                      : '-'}
                  </strong>
                </div>
                <div className="rd-item">
                  <span>Created</span>
                  <strong>{formatDate(resource.createdAt)}</strong>
                </div>
                <div className="rd-item">
                  <span>Last Updated</span>
                  <strong>{formatDate(resource.updatedAt)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="rd-reviews-card">
            <div className="rd-reviews-header">
              <h3>Reviews & Comments</h3>
              <div className="rd-reviews-meta">
                {reviewSummary.totalReviews} review{reviewSummary.totalReviews === 1 ? '' : 's'} • Average {averageRatingLabel}/5
              </div>
            </div>

            <div className="rd-reviews-body">
              {reviewError && <Alert variant="danger">{reviewError}</Alert>}
              {reviewSuccess && <Alert variant="success">{reviewSuccess}</Alert>}

              <div className="rd-review-summary">
                <Badge bg="primary">Average Rating: {averageRatingLabel}/5</Badge>
                <Badge bg="success">Total Reviews: {reviewSummary.totalReviews}</Badge>
              </div>

              <Form className="rd-review-form" onSubmit={handleReviewSubmit}>
                <h4>Write a Review</h4>
                <Form.Group className="mb-2">
                  <Form.Label>Your Rating</Form.Label>
                  <div className="rd-rating-row">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`rd-rating-pill ${reviewRating === value ? 'rd-rating-pill-active' : ''}`}
                        onClick={() => setReviewRating(value)}
                      >
                        {'★'.repeat(value)}
                      </button>
                    ))}
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Comment</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Share your experience with this resource"
                  />
                </Form.Group>

                <div className="rd-review-actions">
                  <Button type="submit" disabled={reviewSubmitting}>
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </Form>

              <div className="rd-review-list">
                {reviewLoading ? (
                  <div className="rm-loading-wrap">
                    <Spinner animation="border" role="status" />
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="rd-review-item">
                      <div className="rd-review-top">
                        <div className="rd-review-user">{review.username}</div>
                        <div className="rd-review-stars">{'★'.repeat(review.rating || 0)}{'☆'.repeat(5 - (review.rating || 0))}</div>
                      </div>
                      <p className="rd-review-comment">{review.comment}</p>
                      <div className="rd-review-date">
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rd-review-empty">No reviews yet. Be the first to share your experience.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResourceDetails;
