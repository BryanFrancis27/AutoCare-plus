'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { DashboardSessionError, loadDashboard, withDeadline, type DashboardData } from '../../services/dashboardService';

type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; message: string; sessionExpired: boolean }
  | { status: 'ready'; data: DashboardData };

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({ status: 'loading' });
  const active = useRef<AbortController | null>(null);
  const queued = useRef(false);
  const mounted = useRef(false);
  const refresh = useCallback(async (afterMutation = false) => {
    if (!mounted.current) return;
    if (active.current) {
      if (afterMutation) queued.current = true;
      return;
    }
    do {
      queued.current = false;
      const controller = new AbortController();
      active.current = controller;
      setState({ status: 'loading' });
      try {
        const data = await withDeadline(signal => loadDashboard(createSupabaseBrowserClient(), signal), controller.signal);
        if (!controller.signal.aborted && mounted.current && !queued.current) setState({ status: 'ready', data });
      } catch (error) {
        if (!controller.signal.aborted && mounted.current && !queued.current) setState({ status: 'error', message: error instanceof Error ? error.message : 'Could not load your dashboard. Please try again.', sessionExpired: error instanceof DashboardSessionError });
      } finally {
        if (active.current === controller) active.current = null;
      }
      if (controller.signal.aborted) return;
    } while (queued.current && mounted.current);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; queued.current = false; active.current?.abort(); active.current = null; };
  }, [refresh]);
  return { state, refresh };
}
