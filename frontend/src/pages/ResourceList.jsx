import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import OperationsSidebar from '../components/OperationsSidebar';
import TopbarUserMenu from '../components/TopbarUserMenu';
import { useNotifications } from '../context/NotificationContext';
import { authAPI, resourceAPI } from '../services/api';

const resourceListStyles = String.raw`
.rm-page {
  height: 100vh;
  display: grid;
  grid-template-columns: 285px 1fr;
  background: #e9edf7;
  color: #1d2433;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

.rm-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.rm-topbar {
  min-height: 76px;
  background: #f4f6fb;
  border-bottom: 1px solid #d8dfea;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
}

.rm-topbar h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #2d3653;
}

.rm-user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rm-logout-btn {
  border: 1px solid #d4d9e2;
  border-radius: 8px;
  background: #fff;
  color: #2b3444;
  font-size: 14px;
  padding: 6px 11px;
}

.rm-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 24px 28px;
  min-width: 0;
  background: linear-gradient(120deg, #eef1f8 0%, #eceff6 52%, #e9edf5 100%);
}

.rm-actions-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.rm-add-btn.btn.btn-primary {
  background: #2f5cad;
  border-color: #2f5cad;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  padding: 10px 18px;
}

.rm-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 16px;
  margin-bottom: 12px;
}

.rm-overview-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.rm-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.rm-stat-card {
  border: 1px solid #dde3ee;
  border-radius: 14px;
  padding: 14px 16px 12px;
  box-shadow: 0 8px 18px rgba(46, 62, 91, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.75);
  position: relative;
  overflow: hidden;
}

.rm-stat-card::before {
  content: '';
  position: absolute;
  right: 14px;
  bottom: 12px;
  width: 88px;
  height: 42px;
  opacity: 0.4;
  border-radius: 10px;
  background: repeating-linear-gradient(
    90deg,
    transparent 0,
    transparent 7px,
    rgba(255, 255, 255, 0.1) 7px,
    rgba(255, 255, 255, 0.1) 12px
  );
}

.rm-stat-card::after {
  content: '';
  position: absolute;
  right: -18px;
  bottom: -22px;
  width: 120px;
  height: 64px;
  border-radius: 34px 34px 0 0;
  opacity: 0.35;
}

.rm-stat-card-total::after {
  background: linear-gradient(45deg, rgba(76, 139, 240, 0.55), rgba(76, 139, 240, 0));
}

.rm-stat-card-total {
  background: linear-gradient(160deg, #f7f9ff 0%, #f0f4ff 100%);
}

.rm-stat-card-available::after {
  background: linear-gradient(45deg, rgba(106, 203, 154, 0.55), rgba(106, 203, 154, 0));
}

.rm-stat-card-available {
  background: linear-gradient(160deg, #f8fffb 0%, #f1fbf6 100%);
}

.rm-stat-card-unavailable::after {
  background: linear-gradient(45deg, rgba(244, 156, 169, 0.55), rgba(244, 156, 169, 0));
}

.rm-stat-card-unavailable {
  background: linear-gradient(160deg, #fff9fb 0%, #fff1f5 100%);
}

.rm-stat-label {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #2f3a56;
}

.rm-stat-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
}

.rm-icon-blue {
  background: #4f8ef0;
  color: #ffffff;
}

.rm-icon-green {
  background: #5abf88;
  color: #ffffff;
}

.rm-icon-red {
  background: #e7485f;
  color: #ffffff;
}

.rm-stat-value {
  margin: 0;
  font-size: 52px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.rm-value-total {
  color: #315fd0;
}

.rm-value-available {
  color: #1f9d57;
}

.rm-value-unavailable {
  color: #dc1b3f;
}

.rm-chart-card {
  background: linear-gradient(180deg, #f8f9ff 0%, #f3f6fd 100%);
  border: 1px solid #dce3ef;
  border-radius: 14px;
  padding: 12px 14px 8px;
  box-shadow: 0 8px 18px rgba(46, 62, 91, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
}

.rm-chart-card::after {
  content: '';
  position: absolute;
  right: -38px;
  bottom: -30px;
  width: 210px;
  height: 86px;
  border: 1px solid rgba(182, 199, 232, 0.45);
  border-radius: 120px 120px 0 0;
  pointer-events: none;
}

.rm-chart-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: #2f3a56;
}

.rm-recent-card {
  background: #f4f6fb;
  border: 1px solid #dce3ef;
  border-radius: 12px;
  padding: 14px 14px 10px;
}

.rm-recent-title {
  margin: 2px 0 10px;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #2f3854;
}

.rm-recent-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rm-recent-item {
  background: #fff;
  border: 1px solid #dde3ef;
  border-radius: 10px;
  padding: 10px 12px;
}

.rm-recent-item-name {
  font-size: 14px;
  font-weight: 700;
  color: #2e3752;
  margin-bottom: 6px;
  line-height: 1.05;
}

.rm-recent-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rm-recent-item-type {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.rm-recent-item-type.lab {
  background: #dceeff;
  color: #0e5cab;
}

.rm-recent-item-type.hall {
  background: #e7e5ff;
  color: #4d3ab0;
}

.rm-recent-item-type.equipment {
  background: #fff3d6;
  color: #8b5d05;
}

.rm-recent-item-type.room {
  background: #e9edf4;
  color: #45556f;
}

.rm-recent-item-date {
  font-size: 12px;
  font-weight: 600;
  color: #7b879f;
}

.rm-recent-footer {
  margin-top: 6px;
  text-align: right;
}

.rm-recent-footer a {
  text-decoration: none;
  color: #3e5fb7;
  font-size: 12px;
  font-weight: 700;
}

.rm-filter-card {
  background: #f4f6fb;
  border: 1px solid #dce3ef;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

.rm-filter-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 120px;
  gap: 10px;
}

.rm-search-input,
.rm-select,
.rm-search-btn,
.rm-reset-btn {
  border: 1px solid #cfd7e6;
  border-radius: 8px;
  min-height: 40px;
  font-size: 15px;
}

.rm-search-input,
.rm-select {
  padding: 9px 12px;
  background: #fff;
  color: #2f3954;
}

.rm-search-btn {
  background: #eef2f9;
  color: #2a3342;
  font-weight: 700;
}

.rm-reset-btn {
  margin-top: 8px;
  min-height: 34px;
  background: #eef2f9;
  color: #4a5874;
  font-size: 14px;
  font-weight: 700;
  padding: 0 14px;
  border: 1px solid #cfd7e6;
  border-radius: 8px;
}

.rm-table-meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin: 8px 0 8px;
  color: #4c586c;
  font-size: 16px;
  font-weight: 700;
}

.rm-pager {
  display: flex;
  gap: 8px;
}

.rm-pager button {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #d2d9e7;
  background: #f4f6fb;
  color: #8694ad;
  font-size: 14px;
  font-weight: 700;
}

.rm-pager button:disabled {
  opacity: 0.7;
}

.rm-table-card {
  background: #f4f6fb;
  border: 1px solid #dce3ef;
  border-radius: 12px;
  padding: 14px;
}

.rm-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.rm-resource-card {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  min-height: 310px;
  background: #223551;
  border: 1px solid rgba(30, 50, 82, 0.55);
  box-shadow: 0 8px 18px rgba(20, 35, 61, 0.18);
  display: flex;
  flex-direction: column;
}

.rm-card-image-wrap {
  position: relative;
  flex: 1;
  min-height: 215px;
}

.rm-card-image-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 26, 44, 0) 20%, rgba(15, 26, 44, 0.92) 82%);
  pointer-events: none;
}

.rm-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.rm-card-image-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dbe5f5;
  background: linear-gradient(135deg, #42699f 0%, #243a5c 100%);
  font-size: 14px;
  font-weight: 700;
}

.rm-card-details {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  padding: 12px 12px 10px;
  color: #ffffff;
}

.rm-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.rm-card-name {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0;
}

.rm-card-capacity {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #f5f9ff;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(2px);
  white-space: nowrap;
}

.rm-card-description {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.35;
  color: rgba(238, 245, 255, 0.92);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rm-card-tags {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.rm-card-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.rm-chip-location {
  background: rgba(255, 255, 255, 0.18);
  color: #f5f9ff;
}

.rm-chip-type {
  background: rgba(19, 33, 56, 0.45);
  color: #eef6ff;
}

.rm-chip-status.rm-status-available {
  background: rgba(31, 157, 87, 0.9);
  color: #e9ffef;
}

.rm-chip-status.rm-status-other {
  background: rgba(85, 98, 122, 0.88);
  color: #f0f4fb;
}

.rm-card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.rm-card-actions .rm-view-btn,
.rm-card-actions .rm-book-btn,
.rm-card-actions .rm-edit-btn,
.rm-card-actions .rm-delete-btn {
  border: none;
  border-radius: 10px;
  min-height: 30px;
  font-size: 12px;
  font-weight: 800;
  padding: 6px 8px;
}

.rm-card-actions .rm-view-btn {
  background: rgba(46, 108, 215, 0.95);
  color: #ffffff;
}

.rm-card-actions .rm-book-btn {
  background: #ffffff;
  color: #1f2d45;
}

.rm-card-actions .rm-book-btn:disabled {
  background: rgba(206, 215, 232, 0.82);
  color: #5f6d82;
}

.rm-card-actions .rm-edit-btn {
  background: #f4c542;
  color: #3d2b00;
}

.rm-card-actions .rm-delete-btn {
  background: #dc3545;
  color: #ffffff;
}

.rm-card-actions-admin {
  grid-template-columns: 1fr 1fr;
}

.rm-empty-state {
  min-height: 220px;
  border: 1px dashed #c9d4e8;
  border-radius: 14px;
  background: #f8fafe;
  color: #6c7a93;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 18px;
}

.rm-status-badge,
.rm-type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}

.rm-status-available {
  background: #d7f3df;
  color: #237d3b;
}

.rm-status-other {
  background: #eceff6;
  color: #55627a;
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
  gap: 6px;
}

.rm-action-buttons button {
  border: 1px solid #c8d0df;
  border-radius: 8px;
  background: #f3f6fc;
  color: #2a3342;
  font-size: 14px;
  font-weight: 700;
  padding: 5px 11px;
}

.rm-action-buttons .rm-view-btn {
  background: #2f5cad;
  border-color: #2f5cad;
  color: #ffffff;
}

.rm-action-buttons .rm-book-btn {
  background: #10b981;
  border-color: #059669;
  color: #ffffff;
}

.rm-action-buttons .rm-book-btn:disabled {
  background: #9ca3af;
  border-color: #9ca3af;
  color: #f8fafc;
  cursor: not-allowed;
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
  padding: 32px;
  color: #64748b;
}

@media (max-width: 1500px) {
  .rm-topbar h1 {
    font-size: 28px;
  }

  .rm-add-btn.btn.btn-primary {
    font-size: 20px;
  }

  .rm-stat-label {
    font-size: 14px;
  }

  .rm-stat-value {
    font-size: 38px;
  }

  .rm-chart-title {
    font-size: 22px;
  }

  .rm-recent-title {
    font-size: 28px;
  }

  .rm-recent-item-name {
    font-size: 23px;
  }

  .rm-recent-item-type,
  .rm-recent-item-date,
  .rm-recent-footer a,
  .rm-search-input,
  .rm-select,
  .rm-search-btn,
  .rm-reset-btn,
  .rm-table-meta,
  .rm-pager button,
  .rm-table th,
  .rm-table td {
    font-size: 15px;
  }
}

@media (max-width: 900px) {
  .rm-page {
    height: auto;
    min-height: 100vh;
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .rm-main,
  .rm-content {
    overflow: visible;
  }

  .rm-overview-grid {
    grid-template-columns: 1fr;
  }

  .rm-filter-row {
    grid-template-columns: 1fr;
  }

  .rm-cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rm-card-name {
    font-size: 21px;
  }

  .rm-chart-title {
    font-size: 18px;
  }
}

@media (max-width: 640px) {
  .rm-cards-grid {
    grid-template-columns: 1fr;
  }
}
`;

const CHART_COLOR_MAP = {
  EQUIPMENT: '#4e8df1',
  LAB: '#61c8a2',
  HALL: '#f4c542',
  ROOM: '#8ec5ff',
};

const formatRecentDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date
    .toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase();
};

const ResourceList = () => {
  const navigate = useNavigate();
  const isAdmin = authAPI.isAdmin();
  const { addNotification } = useNotifications();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteResourceId, setDeleteResourceId] = useState(null);
  const [allResources, setAllResources] = useState([]);

  const resourceTypes = ['LAB', 'HALL', 'ROOM', 'EQUIPMENT'];
  const resourceStatuses = ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'];

  useEffect(() => {
    fetchAllResources();
  }, []);

  useEffect(() => {
    fetchResources();
  }, [currentPage, pageSize, searchKeyword, filterType, filterStatus]);

  const fetchAllResources = async () => {
    try {
      const response = await resourceAPI.getAllResources(0, 1000);
      const payload = response.data;
      const list = payload.content || payload || [];
      setAllResources(list);
    } catch (error) {
      console.error('Failed to load all resources:', error);
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      let response;

      if (searchKeyword) {
        response = await resourceAPI.searchResources(searchKeyword, currentPage, pageSize);
      } else if (filterType && filterStatus) {
        response = await resourceAPI.filterByTypeAndCapacity(filterType, 0, currentPage, pageSize);
      } else if (filterType) {
        response = await resourceAPI.filterByType(filterType, currentPage, pageSize);
      } else if (filterStatus) {
        response = await resourceAPI.filterByStatus(filterStatus, currentPage, pageSize);
      } else {
        response = await resourceAPI.getAllResources(currentPage, pageSize);
      }

      const payload = response.data;
      const list = payload.content || payload || [];
      setResources(list);
      setTotalPages(payload.totalPages || 1);
      setTotalElements(payload.totalElements || list.length);
    } catch (error) {
      toast.error('Failed to load resources');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = allResources.length;
    const available = allResources.filter((item) => item.status === 'AVAILABLE').length;
    const unavailable = allResources.filter((item) => item.status === 'UNAVAILABLE').length;
    return { total, available, unavailable };
  }, [allResources]);

  const chartData = useMemo(() => {
    const grouped = {};

    allResources.forEach((item) => {
      const type = item.type || 'ROOM';
      grouped[type] = (grouped[type] || 0) + 1;
    });

    return resourceTypes.map((name) => ({
      name,
      count: grouped[name] || 0,
      fill: CHART_COLOR_MAP[name] || '#8ec5ff',
    }));
  }, [allResources]);

  const recentResources = useMemo(() => {
    const safeList = [...allResources];
    safeList.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const bDate = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return bDate - aDate;
    });
    return safeList.slice(0, 4);
  }, [allResources]);

  const from = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const to = totalElements === 0 ? 0 : Math.min((currentPage + 1) * pageSize, totalElements);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setCurrentPage(0);
    setSearchKeyword(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchKeyword('');
    setFilterType('');
    setFilterStatus('');
    setCurrentPage(0);
  };

  const handleAddResource = () => navigate('/resources/add');

  const handleViewResource = (id) => {
    if (!id) {
      toast.error('Invalid resource ID');
      return;
    }
    navigate(`/resources/${id}`);
  };

  const handleEditResource = (id) => {
    if (!id) {
      toast.error('Invalid resource ID');
      return;
    }
    navigate(`/resources/edit/${id}`);
  };

  const handleDeleteClick = (id) => {
    setDeleteResourceId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await resourceAPI.deleteResource(deleteResourceId);
      addNotification('Resource deleted successfully!', 'success');
      setShowDeleteModal(false);
      setDeleteResourceId(null);
      fetchResources();
      fetchAllResources();
    } catch (error) {
      toast.error('Failed to delete resource');
      addNotification('Failed to delete resource', 'error');
      console.error(error);
    }
  };

  const handleBookResource = (resourceId) => {
    navigate(`/my-bookings?resourceId=${resourceId}`);
  };

  const isResourceBookable = (status) => String(status || '').toUpperCase() === 'AVAILABLE';

  const getResourceImageSrc = (resource) => {
    const value = (resource?.imageUrl || '').trim();
    if (!value) {
      return null;
    }

    if (value.startsWith('data:image') || value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    return `data:image/jpeg;base64,${value}`;
  };

  return (
    <div className="rm-page">
      <style>{resourceListStyles}</style>
      <OperationsSidebar activeKey="resources" />

      <section className="rm-main">
        <header className="rm-topbar">
          <h1>Facilities Resource Management</h1>
          <TopbarUserMenu containerClassName="rm-user-menu" logoutButtonClassName="rm-logout-btn" />
        </header>

        <div className="rm-content">
          <div className="rm-actions-row">
            {isAdmin && (
              <Button className="rm-add-btn" onClick={handleAddResource}>
                + Add Resource
              </Button>
            )}
          </div>

          <div className="rm-overview-grid">
            <div className="rm-overview-main">
              <div className="rm-stats-grid">
                <article className="rm-stat-card rm-stat-card-total">
                  <div className="rm-stat-label">
                    <span className="rm-stat-icon rm-icon-blue">▮</span>
                    <span>Total Resources</span>
                  </div>
                  <p className="rm-stat-value rm-value-total">{stats.total}</p>
                </article>

                <article className="rm-stat-card rm-stat-card-available">
                  <div className="rm-stat-label">
                    <span className="rm-stat-icon rm-icon-green">✓</span>
                    <span>Available Resources</span>
                  </div>
                  <p className="rm-stat-value rm-value-available">{stats.available}</p>
                </article>

                <article className="rm-stat-card rm-stat-card-unavailable">
                  <div className="rm-stat-label">
                    <span className="rm-stat-icon rm-icon-red">✕</span>
                    <span>Unavailable Resources</span>
                  </div>
                  <p className="rm-stat-value rm-value-unavailable">{stats.unavailable}</p>
                </article>
              </div>

              <div className="rm-chart-card">
                <h3 className="rm-chart-title">Resource Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -14, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e4e9f2" />
                    <XAxis dataKey="name" tick={{ fill: '#7d8aa4', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#7d8aa4', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend
                      iconType="rect"
                      iconSize={10}
                      formatter={(value) => `${value.charAt(0)}${value.slice(1).toLowerCase()}`}
                      wrapperStyle={{ fontSize: '12px', color: '#73809a', paddingTop: '8px' }}
                    />
                    <Bar dataKey="count" barSize={44} radius={[6, 6, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <aside className="rm-recent-card">
              <h3 className="rm-recent-title">Recent Added Resources</h3>
              <div className="rm-recent-items">
                {recentResources.length > 0 ? (
                  recentResources.map((resource) => (
                    <div key={resource.id || resource._id} className="rm-recent-item">
                      <div className="rm-recent-item-name">{resource.name}</div>
                      <div className="rm-recent-meta">
                        <span className={`rm-recent-item-type ${(resource.type || '').toLowerCase()}`}>{resource.type}</span>
                        <span className="rm-recent-item-date">{formatRecentDate(resource.createdAt || resource.updatedAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rm-recent-item-date">No recent resources</div>
                )}
              </div>
              <div className="rm-recent-footer">
                <a href="/resources">View All</a>
              </div>
            </aside>
          </div>

          <div className="rm-filter-card">
            <form className="rm-filter-row" onSubmit={handleSearchSubmit}>
              <input
                className="rm-search-input"
                placeholder="Search by name or location..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />

              <Form.Select
                className="rm-select"
                value={filterType}
                onChange={(event) => {
                  setFilterType(event.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="">All Types</option>
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Form.Select>

              <Form.Select
                className="rm-select"
                value={filterStatus}
                onChange={(event) => {
                  setFilterStatus(event.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="">All Status</option>
                {resourceStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Form.Select>

              <button type="submit" className="rm-search-btn">
                Search
              </button>
            </form>

            <button type="button" className="rm-reset-btn" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>

          <div className="rm-table-meta">
            <span>{from}-{to} of {totalElements}</span>
            <div className="rm-pager">
              <button type="button" disabled={currentPage === 0} onClick={() => setCurrentPage((prev) => prev - 1)}>
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages - 1 || totalPages <= 1}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>

          <div className="rm-table-card">
            {loading ? (
              <div className="rm-loading-wrap">
                <Spinner animation="border" role="status" />
              </div>
            ) : (
              resources.length === 0 ? (
                <div className="rm-empty-state">No resources found</div>
              ) : (
                <div className="rm-cards-grid">
                  {resources.map((resource) => {
                    const resourceId = resource.id || resource._id;
                    const imgSrc = getResourceImageSrc(resource);
                    const isBookable = isResourceBookable(resource.status);
                    const statusClass = resource.status === 'AVAILABLE' ? 'rm-status-available' : 'rm-status-other';

                    return (
                      <article key={resourceId || `${resource.name}-${resource.location}`} className="rm-resource-card">
                        <div className="rm-card-image-wrap">
                          {imgSrc ? (
                            <img className="rm-card-image" src={imgSrc} alt={resource.name} />
                          ) : (
                            <div className="rm-card-image-fallback">No Image</div>
                          )}

                          <div className="rm-card-details">
                            <div className="rm-card-head">
                              <h3 className="rm-card-name">{resource.name}</h3>
                              <span className="rm-card-capacity">{resource.capacity || 0} seats</span>
                            </div>

                            <p className="rm-card-description">
                              {resource.description || 'Resource is available for campus operations and academic activities.'}
                            </p>

                            <div className="rm-card-tags">
                              <span className="rm-card-chip rm-chip-location">{resource.location || 'Campus Area'}</span>
                              <span className="rm-card-chip rm-chip-type">{resource.type || 'RESOURCE'}</span>
                              <span className={`rm-card-chip rm-chip-status ${statusClass}`}>{resource.status || 'UNKNOWN'}</span>
                            </div>

                            <div className={`rm-card-actions ${isAdmin ? 'rm-card-actions-admin' : ''}`}>
                              <button type="button" className="rm-view-btn" onClick={() => handleViewResource(resourceId)}>
                                View
                              </button>
                              <button
                                type="button"
                                className="rm-book-btn"
                                onClick={() => handleBookResource(resourceId)}
                                disabled={!isBookable}
                                title={isBookable ? 'Book this resource' : 'Booking is only available for AVAILABLE resources'}
                              >
                                {isBookable ? 'Book now' : 'Not Available'}
                              </button>
                              {isAdmin && (
                                <>
                                  <button type="button" className="rm-edit-btn" onClick={() => handleEditResource(resourceId)}>
                                    Edit
                                  </button>
                                  <button type="button" className="rm-delete-btn" onClick={() => handleDeleteClick(resourceId)}>
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this resource? This action cannot be undone.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ResourceList;
