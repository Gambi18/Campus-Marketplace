"use client";

import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { notificationHref } from '../utils/notificationLink';

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
  <div className="flex justify-center">
    <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center shadow-sm">
      <Bell className="w-10 h-10 text-brand-primary" />
    </div>
  </div>
</div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-text-muted mt-1">Stay updated with your listings and messages</p>
          </div>
          
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-brand-primary hover:underline font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading && notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-primary border-t-transparent mb-4"></div>
              <p className="text-text-muted">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Bell className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="font-semibold text-gray-900">No notifications yet</h3>
              <p className="text-text-muted text-sm mt-1">We&apos;ll notify you when something important happens.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 flex gap-4 transition-colors ${
                    !notification.is_read ? 'bg-blue-50/20' : ''
                  }`}
                >
                  <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    !notification.is_read ? 'bg-brand-primary text-white' : 'bg-gray-100 text-text-muted'
                  }`}>
                    {notification.type.includes('MESSAGE') ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h9m-11.25-8.25h13.5A2.25 2.25 0 0 1 21 7.5V18a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V7.5A2.25 2.25 0 0 1 5.25 5.25Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-text-muted whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted mb-3">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      {notificationHref(notification) !== '#' && (
                        <Link
                          href={notificationHref(notification)}
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                          className="text-xs font-semibold text-brand-primary hover:text-brand-neutral transition-colors"
                        >
                          View Details
                        </Link>
                      )}
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs font-medium text-text-muted hover:text-gray-900 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
