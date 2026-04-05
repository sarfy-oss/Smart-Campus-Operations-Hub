import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import BrandLogo from '../components/BrandLogo';

const styles = String.raw`
.um-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 285px 1fr;
  background: #f2f4f8;
  color: #101828;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.um-sidebar {
  background: radial-gradient(circle at 10% 0%, #1e376f 0%, #152d5d 30%, #0f2349 60%, #0b1b3b 100%);
  color: #e9efff;
  border-right: 1px solid rgba(255,255,255,0.1);
  padding: 14px 12px;
}

.um-brand {
  height: 66px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  padding: 0 8px;
  border-bottom: 1px solid rgba(255,255,255,0.14);
  margin-bottom: 16px;
}

.um-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.um-nav-item {
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
  cursor: pointer;
  width: 100%;
}

.um-nav-item span {
  width: 26px;
  text-align: center;
  opacity: 0.95;
}

.um-nav-item-active {
  background: linear-gradient(90deg, #2f5bb3, #315fae);
  color: #fff;
}

.um-main {
  display: flex;
  flex-direction: column;
}

.um-topbar {
  min-height: 82px;
  background: #f8f9fc;
  border-bottom: 1px solid #d9dee8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
}

.um-topbar h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1d2433;
}

.um-user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: #2b3444;
}

.um-logout-btn {
  border: 1px solid #d4d9e2;
  border-radius: 6px;
  background: #fff;
  color: #2b3444;
  font-size: 14px;
  padding: 6px 10px;
  cursor: pointer;
}

.um-content {
  padding: 22px 30px;
}

.um-actions-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.um-add-btn {
  background: #2f5cad !important;
  border-color: #2f5cad !important;
  border-radius: 8px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  padding: 8px 18px !important;
}

.um-table-card {
  background: #fff;
  border: 1px solid #dce2ec;
  border-radius: 8px;
  overflow: hidden;
}

.um-table-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e6ef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.um-table-header h6 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2433;
}

.um-table-header small {
  color: #64748b;
  font-size: 13px;
}

.um-table {
  width: 100%;
  border-collapse: collapse;
}

.um-table thead {
  background: #f2f4f8;
}

.um-table th,
.um-table td {
  padding: 13px 16px;
  border-bottom: 1px solid #e0e6ef;
  font-size: 14px;
  color: #253041;
  vertical-align: middle;
}

.um-table th {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.um-table tbody tr:hover {
  background: #f8f9fc;
}

.um-username {
  font-weight: 600;
  color: #1a2436;
  font-size: 15px;
}

.um-you-badge {
  display: inline-block;
  background: #e9edf4;
  color: #55627a;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  margin-left: 7px;
  vertical-align: middle;
}

.um-role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.um-role-admin   { background: #fee2e2; color: #991b1b; }
.um-role-technician { background: #fef3c7; color: #92400e; }
.um-role-user    { background: #dbeafe; color: #1e40af; }

.um-status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.um-status-active   { background: #d7f3df; color: #237d3b; }
.um-status-disabled { background: #f3f4f6; color: #6b7280; }

.um-action-buttons {
  display: flex;
  gap: 8px;
}

.um-action-buttons button {
  border: 1px solid #c8d0df;
  border-radius: 6px;
  font-size: 13px;
  padding: 5px 12px;
  cursor: pointer;
}

.um-edit-btn   { background: #f4c542; border-color: #e6b72f !important; color: #3d2b00; }
.um-delete-btn { background: #dc3545; border-color: #dc3545 !important; color: #fff; }

.um-empty {
  text-align: center;
  padding: 48px;
  color: #64748b;
  font-size: 15px;
}

.um-loading-wrap {
  text-align: center;
  padding: 48px;
}

@media (max-width: 1100px) {
  .um-page { grid-template-columns: 1fr; }
  .um-sidebar { display: none; }
}
`;

const roleBadgeClass = (role) => {
  if (role === 'ADMIN') return 'um-role-admin';
  if (role === 'TECHNICIAN') return 'um-role-technician';
  return 'um-role-user';
};

const EMPTY_EDIT = { username: '', email: '', password: '', confirmPassword: '', role: 'USER' };

const UserManagement = () => {
  const navigate = useNavigate();
  const profile = authAPI.getProfile();
  const currentUsername = profile?.username;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ username: '', email: '', password: '', role: 'USER' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // full user object
  const [editData, setEditData] = useState(EMPTY_EDIT);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete modal
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAPI.getUsers();
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Create ──────────────────────────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const res = await authAPI.createUser(createData);
      setUsers((prev) => [res.data, ...prev]);
      toast.success(`User "${createData.username}" created`);
      setShowCreate(false);
      setCreateData({ username: '', email: '', password: '', role: 'USER' });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────
  const openEdit = (user) => {
    setEditTarget(user);
    setEditData({ username: user.username, email: user.email || '', password: '', confirmPassword: '', role: user.role });
    setEditError('');
    setShowEdit(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (editData.password && editData.password !== editData.confirmPassword) {
      setEditError('Passwords do not match');
      return;
    }
    setEditLoading(true);
    const payload = {
      username: editData.username.trim(),
      email: editData.email.trim(),
      role: editData.role,
    };
    if (editData.password) payload.password = editData.password;

    try {
      const res = await authAPI.updateUser(editTarget.id, payload);
      setUsers((prev) => prev.map((u) => (u.id === editTarget.id ? res.data : u)));
      toast.success('User updated');
      setShowEdit(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────
  const openDelete = (user) => { setDeleteTarget(user); setShowDelete(true); };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await authAPI.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success(`User "${deleteTarget.username}" deleted`);
      setShowDelete(false);
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = () => { authAPI.logout(); navigate('/login'); };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  return (
    <div className="um-page">
      <style>{styles}</style>

      {/* ── Sidebar ── */}
      <aside className="um-sidebar">
        <div className="um-brand">
          <BrandLogo />
        </div>
        <nav className="um-nav">
          <button className="um-nav-item" onClick={() => navigate('/resources')}>
            <span>⌂</span> Dashboard
          </button>
          <button className="um-nav-item" onClick={() => navigate('/resources')}>
            <span>▣</span> Resources
          </button>
          <button className="um-nav-item">
            <span>▤</span> Bookings
          </button>
          <button className="um-nav-item">
            <span>◌</span> Issues
          </button>
          <button className="um-nav-item um-nav-item-active">
            <span>◉</span> Users
          </button>
        </nav>
      </aside>

      {/* ── Main ── */}
      <section className="um-main">
        <header className="um-topbar">
          <h1>User Management</h1>
          <div className="um-user-menu">
            <span>{currentUsername}</span>
            <button className="um-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <div className="um-content">
          <div className="um-actions-bar">
            <Button className="um-add-btn" onClick={() => setShowCreate(true)}>
              + Add User
            </Button>
          </div>

          <div className="um-table-card">
            <div className="um-table-header">
              <div>
                <h6>All Users</h6>
                <small>{users.length} user{users.length !== 1 ? 's' : ''} registered</small>
              </div>
            </div>

            {loading ? (
              <div className="um-loading-wrap">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="um-empty">No users found</div>
            ) : (
              <table className="um-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={user.id}>
                      <td style={{ color: '#9aa3b2' }}>{idx + 1}</td>
                      <td>
                        <span className="um-username">{user.username}</span>
                        {user.username === currentUsername && (
                          <span className="um-you-badge">You</span>
                        )}
                      </td>
                      <td style={{ color: '#64748b' }}>{user.email || '—'}</td>
                      <td>
                        <span className={`um-role-badge ${roleBadgeClass(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`um-status-badge ${user.enabled ? 'um-status-active' : 'um-status-disabled'}`}>
                          {user.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: 13 }}>{formatDate(user.createdAt)}</td>
                      <td>
                        {user.username !== currentUsername ? (
                          <div className="um-action-buttons">
                            <button className="um-edit-btn" onClick={() => openEdit(user)}>Edit</button>
                            <button className="um-delete-btn" onClick={() => openDelete(user)}>Delete</button>
                          </div>
                        ) : (
                          <span style={{ color: '#9aa3b2', fontSize: 13 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* ── Create Modal ── */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body>
            {createError && <div className="alert alert-danger py-2">{createError}</div>}
            <Form.Group className="mb-3">
              <Form.Label>Username <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={createData.username}
                onChange={(e) => setCreateData({ ...createData, username: e.target.value })}
                placeholder="e.g. john_doe"
                required minLength={3}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                placeholder="user@example.com (optional)"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="password"
                value={createData.password}
                onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required minLength={6}
              />
            </Form.Group>
            <Form.Group className="mb-1">
              <Form.Label>Role <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={createData.role}
                onChange={(e) => setCreateData({ ...createData, role: e.target.value })}
              >
                <option value="USER">User — view, book, report</option>
                <option value="TECHNICIAN">Technician — update tickets</option>
                <option value="ADMIN">Admin — full access</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={createLoading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={createLoading}>
              {createLoading ? <><Spinner size="sm" className="me-2" />Creating...</> : 'Create User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit User — <span style={{ color: '#2f5cad' }}>{editTarget?.username}</span></Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {editError && <div className="alert alert-danger py-2">{editError}</div>}
            <Form.Group className="mb-3">
              <Form.Label>Username <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={editData.username}
                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                required minLength={3}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password <span className="text-muted" style={{ fontSize: 12 }}>(leave blank to keep current)</span></Form.Label>
              <Form.Control
                type="password"
                value={editData.password}
                onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                placeholder="Enter new password"
                minLength={editData.password ? 6 : 0}
              />
            </Form.Group>
            {editData.password && (
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="password"
                  value={editData.confirmPassword}
                  onChange={(e) => setEditData({ ...editData, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                />
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={editData.role}
                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
              >
                <option value="USER">User — view, book, report</option>
                <option value="TECHNICIAN">Technician — update tickets</option>
                <option value="ADMIN">Admin — full access</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEdit(false)} disabled={editLoading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={editLoading}>
              {editLoading ? <><Spinner size="sm" className="me-2" />Saving...</> : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete user <strong>"{deleteTarget?.username}"</strong>?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleteLoading}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
            {deleteLoading ? <><Spinner size="sm" className="me-2" />Deleting...</> : 'Delete User'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement;
