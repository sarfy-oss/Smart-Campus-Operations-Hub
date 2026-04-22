import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { clearUserProfile, selectCurrentUserName } from '../store/userSlice';
import NotificationPanel from './NotificationPanel';
import './TopbarUserMenu.css';

const TopbarUserMenu = ({
  containerClassName,
  logoutButtonClassName,
  logoutLabel = 'Logout',
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const username = useSelector(selectCurrentUserName);

  const handleOpenProfile = () => {
    navigate('/profile');
  };

  const handleLogout = () => {
    authAPI.logout();
    dispatch(clearUserProfile());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className={containerClassName}>
      <NotificationPanel />

      <button
        type="button"
        className="topbar-profile-btn"
        onClick={handleOpenProfile}
        aria-label="Open profile management"
        title="Profile Management"
      >
        <span className="topbar-profile-icon" aria-hidden="true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
              fill="currentColor"
            />
            <path
              d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20V22H4V20Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="topbar-profile-name">{username}</span>
      </button>

      <button
        type="button"
        onClick={handleLogout}
        className={logoutButtonClassName}
      >
        {logoutLabel}
      </button>
    </div>
  );
};

export default TopbarUserMenu;
