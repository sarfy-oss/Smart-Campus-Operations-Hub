import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI, notificationAPI } from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    if (!authAPI.isAuthenticated()) return;
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data);
    } catch {
      // silently ignore fetch errors
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Local-only notification (for toasts / optimistic UI)
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    const notification = {
      id,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notification, ...prev].slice(0, 20));
    return id;
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationAPI.markRead(id);
    } catch {
      // best-effort
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllRead();
    } catch {
      // best-effort
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback(async (id) => {
    try {
      await notificationAPI.delete(id);
    } catch {
      // best-effort
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearNotifications,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
