'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { completeReminder, deleteReminder, snoozeReminder } from '@/app/actions/reminders';

type Props = {
  reminderId: string;
  vehicleId: string;
  isCompleted: boolean;
};

export function ReminderActions({ reminderId, vehicleId, isCompleted }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleComplete() {
    setLoading(true);
    const result = await completeReminder(reminderId);
    setLoading(false);
    
    if (!result.error) {
      router.refresh();
    }
  }

  async function handleSnooze(days: number) {
    setLoading(true);
    const result = await snoozeReminder(reminderId, days);
    setLoading(false);
    
    if (!result.error) {
      router.refresh();
    }
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteReminder(reminderId, vehicleId);
    setLoading(false);
    
    if (!result.error) {
      router.push('/reminders');
    }
  }

  if (showDeleteConfirm) {
    return (
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => setShowDeleteConfirm(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700"
        >
          {loading ? 'Deleting...' : 'Confirm Delete'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {!isCompleted && (
        <>
          <Button onClick={handleComplete} disabled={loading}>
            {loading ? 'Processing...' : 'Mark Complete'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSnooze(7)}
            disabled={loading}
          >
            Snooze 7 Days
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSnooze(30)}
            disabled={loading}
          >
            Snooze 30 Days
          </Button>
        </>
      )}
      <Button
        variant="secondary"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={loading}
        className="bg-red-50 text-red-600 hover:bg-red-100"
      >
        Delete
      </Button>
    </div>
  );
}
