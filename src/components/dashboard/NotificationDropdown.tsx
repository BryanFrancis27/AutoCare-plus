'use client';

import { Bell, Wrench, Car, CheckCircle, AlertTriangle, Clock, X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { LoadingState } from '@/components/ui';

interface LiveNotification {
  id: string;
  type: 'vehicle_added' | 'maintenance' | 'reminder_upcoming' | 'reminder_overdue' | 'reminder_done';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const formatRelTime = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return 'Just now';
  if (hours < 1) return `${mins}m ago`;
  if (days < 1) return `${hours}h ago`;
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

const getNotifIcon = (type: LiveNotification['type']) => {
  switch (type) {
    case 'vehicle_added': return Car;
    case 'maintenance': return Wrench;
    case 'reminder_done': return CheckCircle;
    case 'reminder_overdue': return AlertTriangle;
    default: return Clock;
  }
};

const getNotifIconBg = (type: LiveNotification['type']) => {
  switch (type) {
    case 'reminder_overdue': return 'bg-red-500/10 text-accent';
    case 'reminder_done': return 'bg-green-500/10 text-success';
    default: return 'bg-accent/10 text-accent';
  }
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    const todayStr = today.toISOString().split('T')[0];
    const sevenStr = sevenDaysLater.toISOString().split('T')[0];

    const [vehiclesRes, maintenanceRes, upcomingRes, overdueRes, doneRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select('id, make, model, year, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('maintenance_logs')
        .select('id, service_type, service_date, vehicles(make, model, year)')
        .eq('user_id', user.id)
        .order('service_date', { ascending: false })
        .limit(5),
      supabase
        .from('reminders')
        .select('id, title, due_date, vehicles(make, model, year)')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .gte('due_date', todayStr)
        .lte('due_date', sevenStr)
        .order('due_date', { ascending: true })
        .limit(5),
      supabase
        .from('reminders')
        .select('id, title, due_date, updated_at, vehicles(make, model, year)')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .lt('due_date', todayStr)
        .order('due_date', { ascending: false })
        .limit(5),
      supabase
        .from('reminders')
        .select('id, title, updated_at, vehicles(make, model, year)')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .order('updated_at', { ascending: false })
        .limit(3),
    ]);

    const notifs: LiveNotification[] = [];

    vehiclesRes.data?.forEach((v: any) => {
      notifs.push({
        id: `va-${v.id}`,
        type: 'vehicle_added',
        title: 'Vehicle Added',
        message: `${v.year} ${v.make} ${v.model} was added to your garage.`,
        timestamp: new Date(v.created_at),
        read: false,
      });
    });

    maintenanceRes.data?.forEach((m: any) => {
      const veh = m.vehicles;
      notifs.push({
        id: `ml-${m.id}`,
        type: 'maintenance',
        title: 'Maintenance Logged',
        message: veh
          ? `${m.service_type} logged for ${veh.year} ${veh.make} ${veh.model}.`
          : `${m.service_type} maintenance was logged.`,
        timestamp: new Date(m.service_date),
        read: false,
      });
    });

    upcomingRes.data?.forEach((r: any) => {
      const veh = r.vehicles;
      const due = new Date(r.due_date);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);
      const label = diffDays <= 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
      notifs.push({
        id: `ru-${r.id}`,
        type: 'reminder_upcoming',
        title: diffDays <= 3 ? 'Service Due Soon' : 'Upcoming Service',
        message: veh
          ? `${r.title} due for ${veh.year} ${veh.make} ${veh.model} — ${label}.`
          : `${r.title} is due ${label}.`,
        timestamp: due,
        read: false,
      });
    });

    overdueRes.data?.forEach((r: any) => {
      const veh = r.vehicles;
      notifs.push({
        id: `ro-${r.id}`,
        type: 'reminder_overdue',
        title: 'Overdue Maintenance',
        message: veh
          ? `${r.title} is overdue for ${veh.year} ${veh.make} ${veh.model}.`
          : `${r.title} is overdue.`,
        timestamp: new Date(r.due_date),
        read: false,
      });
    });

    doneRes.data?.forEach((r: any) => {
      const veh = r.vehicles;
      notifs.push({
        id: `rd-${r.id}`,
        type: 'reminder_done',
        title: 'Reminder Completed',
        message: veh
          ? `${r.title} completed for ${veh.year} ${veh.make} ${veh.model}.`
          : `${r.title} was marked as done.`,
        timestamp: new Date(r.updated_at),
        read: true,
      });
    });

    // Sort by most recent first, cap at 15
    notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setNotifications(notifs.slice(0, 15));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markAsRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const removeNotification = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={(event) => { if (event.key === "Escape") { setIsOpen(false); dropdownRef.current?.querySelector("button")?.focus(); } }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 hover:bg-surfaceHover rounded-lg transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-controls="notifications-panel"
      >
        <Bell className="w-5 h-5 text-ink" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-onAccent text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div id="notifications-panel" className="fixed inset-x-4 top-16 sm:inset-x-auto sm:absolute sm:right-0 sm:top-full mt-2 w-[min(24rem,calc(100vw-2rem))] bg-surface border border-line rounded-xl shadow-2xl z-50 max-h-[min(32rem,calc(100dvh-6rem))] flex flex-col">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-ink">Notifications</h3>
              <p className="text-sm text-muted">
                {loading ? 'Syncing updates...' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && !loading && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-accent hover:text-accent font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4">
                <LoadingState mode="container" label="Loading notifications..." className="min-h-[180px]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-line mx-auto mb-3" />
                <p className="text-muted">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {notifications.map((n) => {
                  const Icon = getNotifIcon(n.type);
                  const iconClass = getNotifIconBg(n.type);
                  return (
                    <div
                      key={n.id}
                      className={`p-4 hover:bg-canvas transition-colors group cursor-pointer ${
                        !n.read ? 'bg-canvas/30' : ''
                      }`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-ink">{n.title}</h4>
                            <button
                              aria-label={`Dismiss ${n.title}`}
                              onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                              className="opacity-100 transition-opacity p-1 hover:bg-surfaceHover rounded flex-shrink-0"
                            >
                              <X className="w-3 h-3 text-muted" />
                            </button>
                          </div>
                          <p className="text-sm text-muted mb-1 leading-snug">{n.message}</p>
                          <span className="text-xs text-muted">{formatRelTime(n.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
