import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import OperationsSidebar from '../components/OperationsSidebar';
import { authAPI } from '../services/api';

const compressImageFile = (file, maxSize = 512, quality = 0.82) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const source = typeof fileReader.result === 'string' ? fileReader.result : '';
      if (!source) {
        reject(new Error('Unable to read image file'));
        return;
      }

      const image = new Image();
      image.onload = () => {
        const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
        const targetWidth = Math.max(1, Math.round(image.width * ratio));
        const targetHeight = Math.max(1, Math.round(image.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Unable to process image'));
          return;
        }

        context.drawImage(image, 0, 0, targetWidth, targetHeight);
        const output = canvas.toDataURL('image/jpeg', quality);
        resolve(output);
      };

      image.onerror = () => reject(new Error('Invalid image content'));
      image.src = source;
    };

    fileReader.onerror = () => reject(new Error('Unable to read image file'));
    fileReader.readAsDataURL(file);
  });

const profileStyles = String.raw`
.pf-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 270px 1fr;
  background: linear-gradient(180deg, #ebeff8 0%, #e8edf7 100%);
  color: #1b2435;
  font-family: 'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.pf-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pf-topbar {
  min-height: 86px;
  background: rgba(250, 252, 255, 0.68);
  border-bottom: 1px solid #d5dceb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
}

.pf-topbar h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 700;
  color: #25314a;
}

.pf-content {
  padding: 20px;
}

.pf-card {
  max-width: 760px;
  background: linear-gradient(180deg, #f8fbff 0%, #f2f6ff 100%);
  border: 1px solid #d8e2f1;
  border-radius: 14px;
  padding: 20px;
  box-shadow: inset 0 1px 0 #ffffff, 0 6px 14px rgba(37, 66, 122, 0.06);
}

.pf-subtitle {
  margin: 4px 0 18px;
  color: #5e6d88;
  font-size: 14px;
}

.pf-avatar-section {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.pf-avatar {
  width: 78px;
  height: 78px;
  border-radius: 999px;
  border: 2px solid #d4def0;
  background: #eaf0fb;
  object-fit: cover;
  display: block;
}

.pf-avatar-placeholder {
  width: 78px;
  height: 78px;
  border-radius: 999px;
  border: 2px solid #d4def0;
  background: #eaf0fb;
  color: #5f7191;
  font-size: 26px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pf-avatar-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pf-avatar-controls small {
  color: #6a7b98;
}

.pf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pf-grid-full {
  grid-column: 1 / span 2;
}

.pf-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pf-save-btn.btn.btn-primary {
  background: linear-gradient(180deg, #3e7de2 0%, #2458ad 100%);
  border: 1px solid #2f5fad;
  border-radius: 8px;
  font-weight: 700;
}

.pf-cancel-btn.btn.btn-outline-secondary {
  border-radius: 8px;
}

.pf-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

@media (max-width: 1100px) {
  .pf-page {
    grid-template-columns: 1fr;
  }

  .pf-grid {
    grid-template-columns: 1fr;
  }

  .pf-grid-full {
    grid-column: auto;
  }
}
`;

const Profile = () => {
  const navigate = useNavigate();
  const profile = authAPI.getProfile();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [removeImagePending, setRemoveImagePending] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await authAPI.getMe();
        const me = response.data || {};
        setFormData((prev) => ({
          ...prev,
          username: me.username || profile?.username || '',
          email: me.email || '',
          role: me.role || profile?.role || '',
          profileImage: me.profileImage || profile?.profileImage || '',
        }));
        setSelectedImageFile(null);
        setRemoveImagePending(false);
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profile?.role, profile?.username]);

  const roleLabel = useMemo(() => formData.role || profile?.role || 'USER', [formData.role, profile?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      toast.error('Selected file is too large. Please choose an image under 6MB.');
      return;
    }

    try {
      const value = await compressImageFile(file, 512, 0.82);
      if (value.length > 1_200_000) {
        toast.error('Compressed image is still too large. Please use a smaller image.');
        return;
      }

      setSelectedImageFile(file);
      setRemoveImagePending(false);
      setFormData((prev) => ({ ...prev, profileImage: value }));
    } catch (error) {
      toast.error(error.message || 'Failed to process image');
    }
  };

  const removeProfileImage = () => {
    setSelectedImageFile(null);
    setRemoveImagePending(true);
    setFormData((prev) => ({ ...prev, profileImage: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New password and confirm password must match');
      return;
    }

    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim(),
    };

    if (removeImagePending) {
      payload.profileImage = '';
    }

    if (formData.newPassword) {
      payload.currentPassword = formData.currentPassword;
      payload.newPassword = formData.newPassword;
    }

    setSubmitting(true);
    try {
      const response = await authAPI.updateMe(payload);
      const updated = response.data || {};
      let finalProfileImage = updated.profileImage !== undefined ? updated.profileImage : formData.profileImage;

      if (selectedImageFile) {
        const avatarResponse = await authAPI.uploadMyAvatar(selectedImageFile);
        finalProfileImage = avatarResponse.data?.profileImage || finalProfileImage;
      }

      authAPI.updateStoredProfile({
        username: updated.username || payload.username,
        role: updated.role || roleLabel,
        token: updated.token || profile?.token,
        profileImage: finalProfileImage,
      });

      setFormData((prev) => ({
        ...prev,
        role: updated.role || prev.role,
        email: updated.email !== undefined ? updated.email : prev.email,
        profileImage: finalProfileImage,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      setSelectedImageFile(null);
      setRemoveImagePending(false);

      toast.success(updated.message || 'Profile updated successfully');
    } catch (error) {
      const statusCode = error.response?.status;
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.statusText;

      const friendly =
        statusCode === 413
          ? 'Image is too large for upload. Please use a smaller image.'
          : backendMessage || 'Failed to update profile';

      toast.error(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="pf-page">
      <style>{profileStyles}</style>
      <OperationsSidebar />

      <section className="pf-main">
        <header className="pf-topbar">
          <h1>My Profile</h1>
          <Button variant="outline-secondary" onClick={handleLogout}>Logout</Button>
        </header>

        <div className="pf-content">
          <div className="pf-card">
            <h3>Profile Settings</h3>
            <p className="pf-subtitle">Update your account details and password from this page.</p>

            {loading ? (
              <div className="pf-loading">
                <Spinner animation="border" role="status" />
              </div>
            ) : (
              <Form onSubmit={handleSubmit}>
                <div className="pf-avatar-section">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="pf-avatar" />
                  ) : (
                    <div className="pf-avatar-placeholder" aria-hidden="true">
                      {formData.username ? formData.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}

                  <div className="pf-avatar-controls">
                    <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
                    <small>Upload JPG/PNG/WebP up to 2MB</small>
                    {formData.profileImage && (
                      <Button type="button" size="sm" variant="outline-danger" onClick={removeProfileImage}>
                        Remove Image
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pf-grid">
                  <Form.Group>
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                    />
                  </Form.Group>

                  <Form.Group className="pf-grid-full">
                    <Form.Label>Role</Form.Label>
                    <Form.Control value={roleLabel} disabled readOnly />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Current Password</Form.Label>
                    <Form.Control
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Required only to change password"
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Leave empty to keep current password"
                    />
                  </Form.Group>

                  <Form.Group className="pf-grid-full">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>

                <div className="pf-actions">
                  <Button className="pf-cancel-btn" variant="outline-secondary" onClick={() => navigate('/resources')}>
                    Back
                  </Button>
                  <Button className="pf-save-btn" type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
