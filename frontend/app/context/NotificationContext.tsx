"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification, NotificationResponse, UnreadCountResponse } from '../types/notifications';
import { fetchAPI, patchAPI, postAPI, API_URL } from '../utils/api';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAPI<NotificationResponse>('/api/v1/notifications');
      setNotifications(data.notifications || []);
      
      const unreadData = await fetchAPI<UnreadCountResponse>('/api/v1/notifications/unread-count');
      setUnreadCount(unreadData.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await patchAPI(`/api/v1/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await postAPI('/api/v1/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // WebSocket for real-time notifications
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    // Use existing WS endpoint but handle notification types
    const wsUrl = API_URL.replace('http', 'ws') + '/api/v1/ws';
    const ws = new WebSocket(`${wsUrl}?token=${token}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        const newNotification = data.payload as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Optional: show a toast or browser notification
        if (Notification.permission === 'granted') {
          new window.Notification(newNotification.title, {
            body: newNotification.message,
          });
        }
      }
    };

    return () => ws.close();
  }, []);

  // Initial fetch
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
