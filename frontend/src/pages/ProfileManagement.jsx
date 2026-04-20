import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import OperationsSidebar from '../components/OperationsSidebar';
import TopbarUserMenu from '../components/TopbarUserMenu';
import { authAPI } from '../services/api';
import {
  clearUserProfile,
  selectCurrentUser,
  setUserProfile,
} from '../store/userSlice';
import { adminWorkspaceBaseStyles } from './adminWorkspaceStyles';

const profileStyles = String.raw`
.pm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.pm-card {
  background: #ffffff;
  border: 1px solid #dce2ec;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(15, 35, 73, 0.04);
  overflow: hidden;
}

.pm-card-header {
  padding: 16px 18px;
  border-bottom: 1px solid #e6ebf2;
}

.pm-card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1d2433;
}

.pm-card-header p {
  margin: 8px 0 0;
  color: #5b667a;
  font-size: 14px;
}

.pm-card-body {
  padding: 18px;
}

.pm-field {
  margin-bottom: 14px;
}

.pm-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.pm-danger-note {
  color: #991b1b;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.pm-danger-cta {
  border-radius: 8px;
}

.pm-mono-input {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

@media (max-width: 1024px) {
  .pm-grid {
    grid-template-columns: 1fr;
  }
}
`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

const extractApiError = (error, fallbackMessage) => {
  const response = error?.response?.data;
  if (response?.message) {
    return response.message;
  }

  if (response?.errors && typeof response.errors === 'object') {
    const [firstError] = Object.values(response.errors);
    if (firstError) {
      return firstError;
    }
  }

  return fallbackMessage;
};

const ProfileManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    setProfileForm({
      username: currentUser?.username || '',
      email: currentUser?.email || '',
    });
  }, [currentUser?.email, currentUser?.username]);

  const memberSinceLabel = useMemo(() => {
    if (!currentUser?.id) {
      return 'Profile loaded from your active session';
    }

    return `User ID: ${currentUser.id}`;
  }, [currentUser?.id]);

  const validateProfileForm = () => {
    const username = profileForm.username.trim();
    const email = profileForm.email.trim();

    if (!username) {
      return 'Name is required.';
    }

    if (username.length < 3) {
      return 'Name must be at least 3 characters.';
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return 'Please provide a valid email address.';
    }

    return '';
  };

  const validatePasswordForm = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      return 'Please fill out all password fields.';
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      return 'New password and confirmation do not match.';
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      return 'New password must be different from the current password.';
    }

    if (!PASSWORD_STRENGTH_REGEX.test(passwordForm.newPassword)) {
      return 'Password must be at least 6 characters and include both letters and numbers.';
    }

    return '';
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError('');

    const validationError = validateProfileForm();
    if (validationError) {
      setProfileError(validationError);
      return;
    }

    setProfileSaving(true);
    try {
      const updatedProfile = await authAPI.updateMyProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
      });

      dispatch(setUserProfile(updatedProfile));
      toast.success('Profile updated successfully.');
    } catch (error) {
      setProfileError(
        extractApiError(error, 'Failed to update profile. Please try again.')
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');

    const validationError = validatePasswordForm();
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setPasswordSaving(true);
    try {
      await authAPI.changeMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      toast.success('Password changed successfully.');
    } catch (error) {
      setPasswordError(
        extractApiError(error, 'Failed to change password. Please try again.')
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');

    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Type DELETE to confirm account deletion.');
      return;
    }

    setDeletingAccount(true);
    try {
      await authAPI.deleteMyAccount();
      authAPI.logout();
      dispatch(clearUserProfile());
      setShowDeleteModal(false);
      toast.success('Your account has been deleted.');
      navigate('/register', { replace: true });
    } catch (error) {
      setDeleteError(
        extractApiError(error, 'Failed to delete account. Please try again.')
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="aw-page">
      <style>{`${adminWorkspaceBaseStyles}\n${profileStyles}`}</style>
      <OperationsSidebar activeKey="profile" />

      <section className="aw-main">
        <header className="aw-topbar">
          <h1>Profile Management</h1>
          <TopbarUserMenu
            containerClassName="aw-user-menu"
            logoutButtonClassName="aw-logout-btn"
          />
        </header>

        <div className="aw-content">
          <section className="aw-hero">
            <div>
              <h2>Manage your account details securely</h2>
              <p>
                Update your basic profile information, rotate your password, and
                delete your account when needed.
              </p>
            </div>
            <div className="aw-hero-actions">
              <Button variant="outline-dark" onClick={() => navigate('/resources')}>
                Back to Resources
              </Button>
            </div>
          </section>

          <section className="pm-grid">
            <article className="pm-card">
              <div className="pm-card-header">
                <h3>Profile Information</h3>
                <p>{memberSinceLabel}</p>
              </div>
              <div className="pm-card-body">
                {profileError && (
                  <Alert variant="danger" className="mb-3 py-2">
                    {profileError}
                  </Alert>
                )}

                <Form onSubmit={handleProfileSubmit}>
                  <Form.Group className="pm-field">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={profileForm.username}
                      onChange={(event) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          username: event.target.value,
                        }))
                      }
                      placeholder="Enter your name"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="pm-field">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={profileForm.email}
                      onChange={(event) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder="name@example.com"
                    />
                  </Form.Group>

                  <div className="pm-actions">
                    <Button type="submit" disabled={profileSaving}>
                      {profileSaving ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Profile'
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
            </article>

            <article className="pm-card">
              <div className="pm-card-header">
                <h3>Change Password</h3>
                <p>Use a strong password that is unique to this account.</p>
              </div>
              <div className="pm-card-body">
                {passwordError && (
                  <Alert variant="danger" className="mb-3 py-2">
                    {passwordError}
                  </Alert>
                )}

                <Form onSubmit={handlePasswordSubmit}>
                  <Form.Group className="pm-field">
                    <Form.Label>Current Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: event.target.value,
                        }))
                      }
                      placeholder="Current password"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="pm-field">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: event.target.value,
                        }))
                      }
                      placeholder="At least 6 characters with letters and numbers"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="pm-field">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.confirmNewPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmNewPassword: event.target.value,
                        }))
                      }
                      placeholder="Repeat your new password"
                      required
                    />
                  </Form.Group>

                  <div className="pm-actions">
                    <Button type="submit" variant="primary" disabled={passwordSaving}>
                      {passwordSaving ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
            </article>
          </section>

          <section className="pm-card mt-3">
            <div className="pm-card-header">
              <h3>Delete Account</h3>
              <p>
                This action permanently removes your account and cannot be
                undone.
              </p>
            </div>
            <div className="pm-card-body">
              <div className="pm-danger-note">
                Deleting your account will remove your access immediately.
              </div>
              <Button
                variant="danger"
                className="pm-danger-cta"
                onClick={() => {
                  setDeleteConfirmText('');
                  setDeleteError('');
                  setShowDeleteModal(true);
                }}
              >
                Delete My Account
              </Button>
            </div>
          </section>
        </div>
      </section>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Account Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <Alert variant="danger" className="mb-3 py-2">
              {deleteError}
            </Alert>
          )}
          <p className="mb-2">
            Type <strong>DELETE</strong> below to confirm.
          </p>
          <Form.Control
            className="pm-mono-input"
            value={deleteConfirmText}
            onChange={(event) => setDeleteConfirmText(event.target.value)}
            placeholder="DELETE"
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deletingAccount}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <>
                <Spinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProfileManagement;
