'use client';

export default function GarageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="application-workspace py-6 sm:py-8">
    <section role="alert" className="card p-6">
      <h1 className="text-xl font-semibold text-ink">We couldn&apos;t load your garage</h1>
      <p className="mt-2 text-sm text-muted">Your vehicle data is unavailable right now. Please try again.</p>
      <button type="button" onClick={reset} className="button-primary mt-4 min-h-11">Try again</button>
    </section>
  </div>;
}
