'use client';

import { motion } from 'framer-motion';
import { Calendar, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import { ReminderItem } from '@/app/actions/dashboard-metrics';

interface UpcomingRemindersProps {
  reminders: ReminderItem[];
  loading?: boolean;
}

// Helper function to format date
const formatDate = (date: Date): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ReminderSkeleton = () => (
  <div className="animate-pulse flex items-center justify-between p-3 border-b border-grayBorder last:border-0">
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-grayBorder rounded w-3/4"></div>
      <div className="h-3 bg-grayBorder rounded w-1/2"></div>
    </div>
    <div className="h-6 w-16 bg-grayBorder rounded ml-4"></div>
  </div>
);

export function UpcomingReminders({ reminders, loading = false }: UpcomingRemindersProps) {
  return (
    <div className="bg-containerBg rounded-xl shadow-sm border border-grayBorder p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-whitePure">Upcoming Reminders</h3>
        {reminders.length > 0 && (
          <Link
            href="/reminders"
            className="text-sm text-redPrimary hover:text-redMuted transition-colors font-medium"
          >
            View All
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <ReminderSkeleton key={index} />
          ))}
        </div>
      ) : reminders.length > 0 ? (
        <div className="space-y-2">
          {reminders.map((reminder, index) => {
            const isOverdue = reminder.status === 'overdue';
            const isHighPriority = reminder.priority === 'high' || isOverdue;
            
            return (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href="/reminders"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-darkBg transition-colors border-b border-grayBorder last:border-0"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {isHighPriority ? (
                      <AlertTriangle className="h-5 w-5 text-redPrimary flex-shrink-0 mt-0.5" />
                    ) : (
                      <Calendar className="h-5 w-5 text-redPrimary flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium ${isHighPriority ? 'text-redPrimary' : 'text-whitePure'}`}>
                        {reminder.title}
                      </h4>
                      {reminder.vehicleName && (
                        <p className="text-sm text-textSecondary mt-0.5">
                          {reminder.vehicleName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        isOverdue
                          ? 'bg-redPrimary/20 text-redPrimary'
                          : 'bg-darkBg text-textSecondary'
                      }`}
                    >
                      {formatDate(reminder.dueDate)}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-textSecondary">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-grayBorder" />
          <p className="text-lg font-medium text-whitePure">No upcoming reminders</p>
          <p className="text-sm mt-1">Set reminders to stay on top of vehicle maintenance</p>
        </div>
      )}
    </div>
  );
}
