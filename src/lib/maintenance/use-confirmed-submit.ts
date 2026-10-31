'use client';
import { useRef, useState } from 'react';
// Ref closes the same-render double-click window; finally enables deliberate retry.
export function useConfirmedSubmit() {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(write: () => Promise<{ data: { id: string } | null; error: string | null }>, success: () => void) {
    if (busy.current) return;
    busy.current = true; setPending(true); setError(null);
    try {
      const result = await write();
      if (result.error || !result.data?.id) throw new Error(result.error || 'The save could not be confirmed.');
      success();
    } catch (failure) {
      setError(`${failure instanceof Error ? failure.message : 'The save could not be confirmed.'} Your entries are retained. Review existing records before retrying if the connection was interrupted.`);
    } finally { busy.current = false; setPending(false); }
  }
  return { pending, error, submit };
}
