import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import NotificationPanel from './NotificationPanel';
import BrandLogo from './BrandLogo';
import { clearUserProfile, selectCurrentUserName } from '../store/userSlice';

const headerStyles = String.raw`
.header-profile-btn {
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.header-profile-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.55);
}

.header-profile-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
`;

/**
 * Navigation Header Component
 */
const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = authAPI.isAuthenticated();
  const username = useSelector(selectCurrentUserName);
  const isAdmin = authAPI.isAdmin();

  const handleLogout = () => {
    authAPI.logout();
    dispatch(clearUserProfile());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleOpenProfile = () => navigate('/profile');

  return (
    <Navbar bg="dark" expand="lg" sticky="top">
      <style>{headerStyles}</style>
      <Container>
        <Navbar.Brand href="/resources" className="fw-bold d-flex align-items-center">
          <BrandLogo compact />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {isAuthenticated && (
              <>
                <Nav.Link href="/resources">Resources</Nav.Link>
                {isAdmin && <Nav.Link href="/resources/add">Add Resource</Nav.Link>}
                {isAdmin && <Nav.Link href="/users">User Management</Nav.Link>}
                <Nav.Item className="d-flex align-items-center mx-2">
                  <NotificationPanel />
                </Nav.Item>
                <Nav.Item className="d-flex align-items-center gap-2">
                  <button type="button" className="header-profile-btn" onClick={handleOpenProfile}>
                    <span className="header-profile-icon" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" />
                        <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20V22H4V20Z" />
                      </svg>
                    </span>
                    <span>{username}</span>
                  </button>
                  <button type="button" className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                    Logout
                  </button>
                </Nav.Item>
              </>
            )}
            {!isAuthenticated && (
              <Nav.Link href="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
