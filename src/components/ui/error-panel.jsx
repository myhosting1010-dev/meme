"use client";

export function ErrorPanel({ onRetry }) {
  return (
    <section aria-labelledby="error-title" className="max-w-2xl rounded-panel border border-border bg-surface p-6">
      <h1 id="error-title" className="text-2xl font-semibold">Something went wrong</h1>
      <p role="alert" className="mt-3 text-muted">Please try again. If the problem continues, return later.</p>
      <button type="button" onClick={onRetry} className="mt-6 rounded-lg bg-accent px-4 py-3 font-semibold text-black">Try again</button>
    </section>
  );
}
