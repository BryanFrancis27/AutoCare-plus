'use client';

import { motion } from 'framer-motion';
import { Wrench, Bell, DollarSign, Car, Clock, Edit, Trash2 } from 'lucide-react';
import { ActivityItem } from '@/app/actions/dashboard-metrics';
import { LoadingState } from '@/components/ui';

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }

  const months = Math.floor(diffDays / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
};

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'maintenance':
      return { Icon: Wrench, bgColor: 'bg-redPrimary', iconColor: 'text-whitePure' };
    case 'reminder':
      return { Icon: Bell, bgColor: 'bg-redPrimary', iconColor: 'text-whitePure' };
    case 'expense':
      return { Icon: DollarSign, bgColor: 'bg-redPrimary', iconColor: 'text-whitePure' };
    case 'vehicle_added':
      return { Icon: Car, bgColor: 'bg-redPrimary', iconColor: 'text-whitePure' };
    case 'vehicle_edited':
      return { Icon: Edit, bgColor: 'bg-redPrimary', iconColor: 'text-whitePure' };
    case 'vehicle_deleted':
      return { Icon: Trash2, bgColor: 'bg-redPrimary', iconColor: 'text-whitePure' };
    default:
      return { Icon: Clock, bgColor: 'bg-redPrimary', iconColor: 'text-whitePure' };
  }
};

export function ActivityFeed({ activities, loading = false, maxItems = 3 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-containerBg rounded-xl shadow-sm border border-grayBorder p-6">
      <h3 className="text-lg font-semibold text-whitePure mb-4">Recent Activity</h3>

      {loading ? (
        <LoadingState mode="container" label="Loading recent activity..." className="min-h-[220px]" />
      ) : displayActivities.length > 0 ? (
        <div className="space-y-4">
          {displayActivities.map((activity, index) => {
            const { Icon, bgColor, iconColor } = getActivityIcon(activity.type);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-darkBg rounded-lg p-4 hover:bg-[#2a2a2a] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`${bgColor} p-3 rounded-full flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <h4 className="font-semibold text-whitePure">{activity.description}</h4>
                        {activity.vehicleName && (
                          <p className="text-sm text-textSecondary mt-0.5">{activity.vehicleName}</p>
                        )}
                      </div>
                      <span className="text-xs text-textSecondary flex-shrink-0 ml-2">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-textSecondary">
          <Clock className="h-16 w-16 mx-auto mb-4 text-grayBorder" />
          <p className="text-lg font-medium text-whitePure">No recent activity</p>
          <p className="text-sm mt-1">Activity will appear here as you use AutoCare+</p>
        </div>
      )}
    </div>
  );
}
