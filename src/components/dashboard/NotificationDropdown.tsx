'use client';

import { Bell, Calendar, Tag, CheckCircle, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Notification {
  id: number;
  type: 'appointment' | 'promotion';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'appointment',
      title: 'Upcoming Service',
      message: 'Oil change scheduled for tomorrow at 10:00 AM',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      type: 'promotion',
      title: 'Special Offer',
      message: '20% off brake inspection this week!',
      time: '5 hours ago',
      read: false,
    },
    {
      id: 3,
      type: 'appointment',
      title: 'Service Reminder',
      message: 'Tire rotation due in 3 days',
      time: '1 day ago',
      read: true,
    },
    {
      id: 4,
      type: 'promotion',
      title: 'Winter Maintenance',
      message: 'Get ready for winter with our maintenance package',
      time: '2 days ago',
      read: true,
    },
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[#262626] rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D32F2F] text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-[#262626] border border-[#3A3A3A] rounded-xl shadow-2xl z-50 max-h-[32rem] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#3A3A3A] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <p className="text-sm text-[#B0B0B0]">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-[#D32F2F] hover:text-[#E53935] font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-[#3A3A3A] mx-auto mb-3" />
                <p className="text-[#B0B0B0]">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-[#3A3A3A]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-[#1D1D1C] transition-colors group ${
                      !notification.read ? 'bg-[#1D1D1C]/30' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          notification.type === 'appointment'
                            ? 'bg-blue-500/10'
                            : 'bg-[#D32F2F]/10'
                        }`}
                      >
                        {notification.type === 'appointment' ? (
                          <Calendar
                            className={`w-5 h-5 ${
                              notification.type === 'appointment'
                                ? 'text-blue-400'
                                : 'text-[#D32F2F]'
                            }`}
                          />
                        ) : (
                          <Tag className="w-5 h-5 text-[#D32F2F]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-white">
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#3A3A3A] rounded"
                          >
                            <X className="w-3 h-3 text-[#B0B0B0]" />
                          </button>
                        </div>
                        <p className="text-sm text-[#B0B0B0] mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#B0B0B0]">{notification.time}</span>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-[#D32F2F] hover:text-[#E53935] font-medium transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
