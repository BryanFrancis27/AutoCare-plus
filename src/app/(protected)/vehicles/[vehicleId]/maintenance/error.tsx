'use client';
import { Button } from '@/components/ui';
export default function Error({ reset }: { reset: () => void }) { return <main className="application-workspace space-y-4 py-8"><h1 className="text-2xl font-semibold">Information could not be loaded</h1><p role="alert">Please try again. No empty result has been assumed.</p><Button onClick={reset}>Try again</Button></main>; }
