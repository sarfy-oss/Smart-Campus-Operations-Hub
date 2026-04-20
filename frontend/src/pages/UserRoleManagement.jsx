import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import OperationsSidebar from '../components/OperationsSidebar';
import { authAPI } from '../services/api';
import { adminWorkspaceBaseStyles } from './adminWorkspaceStyles';
import { createRoleId, loadRoleItems, normalizeRole, saveRoleItems } from '../utils/roleConfig';

const roleManagementStyles = String.raw`
.urm-create-card {
  margin-bottom: 18px;
}

.urm-create-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: end;
}

.urm-role-cell {
  font-weight: 700;
  color: #1f4e9a;
  letter-spacing: 0.02em;
}

.urm-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.urm-error {
  margin-bottom: 10px;
  color: #991b1b;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
}

.urm-inline-note {
  color: #5b667a;
  margin: 0;
}

@media (max-width: 980px) {
  .urm-create-grid {
    grid-template-columns: 1fr;
  }
}
`;

const UserRoleManagement = () => {
  const navigate = useNavigate();
  const profile = authAPI.getProfile();
  const currentUsername = profile?.username;

  const [roles, setRoles] = useState(loadRoleItems);
  const [createData, setCreateData] = useState({ name: '', role: '' });
  const [createError, setCreateError] = useState('');

  const [editTarget, setEditTarget] = useState(null);
  const [editData, setEditData] = useState({ name: '', role: '' });
  const [editError, setEditError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    saveRoleItems(roles);
  }, [roles]);

  const sortedRoles = useMemo(
    () => [...roles].sort((left, right) => left.name.localeCompare(right.name)),
    [roles]
  );

  const findDuplicateRole = (roleValue, ignoreId = null) =>
    roles.some((item) => item.role === roleValue && item.id !== ignoreId);

  const validateRoleInput = (nameValue, roleValue, ignoreId = null) => {
    const normalizedName = nameValue.trim();
    const normalizedRole = normalizeRole(roleValue);

    if (!normalizedName) {
      return 'Name is required.';
    }

    if (!normalizedRole) {
      return 'Role is required.';
    }

    if (findDuplicateRole(normalizedRole, ignoreId)) {
      return `Role "${normalizedRole}" already exists.`;
    }

    return '';
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const handleCreateSubmit = (event) => {
    event.preventDefault();
    setCreateError('');

    const name = createData.name.trim();
    const role = normalizeRole(createData.role);
    const validationError = validateRoleInput(name, role);

    if (validationError) {
      setCreateError(validationError);
      return;
    }

    const newRole = {
      id: createRoleId(),
      name,
      role,
    };

    setRoles((prev) => [newRole, ...prev]);
    setCreateData({ name: '', role: '' });
    toast.success(`Role "${name}" created`);
  };

  const openEditModal = (roleItem) => {
    setEditTarget(roleItem);
    setEditData({ name: roleItem.name, role: roleItem.role });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();
    if (!editTarget) return;

    const name = editData.name.trim();
    const role = normalizeRole(editData.role);
    const validationError = validateRoleInput(name, role, editTarget.id);

    if (validationError) {
      setEditError(validationError);
      return;
    }

    setRoles((prev) =>
      prev.map((item) =>
        item.id === editTarget.id
          ? {
              ...item,
              name,
              role,
            }
          : item
      )
    );

    setShowEditModal(false);
    setEditTarget(null);
    toast.success(`Role "${name}" updated`);
  };

  const openDeleteModal = (roleItem) => {
    setDeleteTarget(roleItem);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    setRoles((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    toast.success(`Role "${deleteTarget.name}" deleted`);
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  return (
    <div className="aw-page">
      <style>{`${adminWorkspaceBaseStyles}\n${roleManagementStyles}`}</style>
      <OperationsSidebar activeKey="user-role-management" />

      <section className="aw-main">
        <header className="aw-topbar">
          <h1>User Role Management</h1>
          <div className="aw-user-menu">
            <span>{currentUsername || 'Admin'}</span>
            <button type="button" onClick={handleLogout} className="aw-logout-btn">
              Logout
            </button>
          </div>
        </header>

        <div className="aw-content">
          <section className="aw-card urm-create-card">
            <div className="aw-card-header">
              <h3>Role Creation Form</h3>
              <small>Create a new role definition for your workspace</small>
            </div>
            <div className="aw-card-body">
              <p className="urm-inline-note">
                The <strong>Role</strong> value is always stored in lowercase.
              </p>
              <form onSubmit={handleCreateSubmit}>
                {createError && <div className="urm-error">{createError}</div>}
                <div className="urm-create-grid">
                  <Form.Group>
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Example: Admin"
                      value={createData.name}
                      onChange={(event) =>
                        setCreateData((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Role</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Example: admin"
                      value={createData.role}
                      onChange={(event) =>
                        setCreateData((prev) => ({
                          ...prev,
                          role: event.target.value.toLowerCase(),
                        }))
                      }
                    />
                  </Form.Group>

                  <Button type="submit">Create Role</Button>
                </div>
              </form>
            </div>
          </section>

          <section className="aw-card">
            <div className="aw-card-header">
              <h3>Role Display Section</h3>
              <small>{sortedRoles.length} role{sortedRoles.length === 1 ? '' : 's'} available</small>
            </div>
            <div className="aw-table-wrap">
              <table className="aw-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRoles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="aw-empty">
                        No roles found. Create your first role above.
                      </td>
                    </tr>
                  ) : (
                    sortedRoles.map((roleItem, index) => (
                      <tr key={roleItem.id}>
                        <td>{index + 1}</td>
                        <td>{roleItem.name}</td>
                        <td className="urm-role-cell">{roleItem.role}</td>
                        <td>
                          <div className="urm-actions">
                            <Button size="sm" variant="warning" onClick={() => openEditModal(roleItem)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => openDeleteModal(roleItem)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Role</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {editError && <div className="urm-error">{editError}</div>}

            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={editData.name}
                onChange={(event) =>
                  setEditData((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Role</Form.Label>
              <Form.Control
                type="text"
                value={editData.role}
                onChange={(event) =>
                  setEditData((prev) => ({
                    ...prev,
                    role: event.target.value.toLowerCase(),
                  }))
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.role})?
        </Modal.Body>
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

export default UserRoleManagement;
