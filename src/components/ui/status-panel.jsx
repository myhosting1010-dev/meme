export function StatusPanel({ title, children }) {
  return (
    <section className="max-w-2xl rounded-panel border border-border bg-surface p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <div className="mt-4 text-base leading-7 text-muted">{children}</div>
    </section>
  );
}
