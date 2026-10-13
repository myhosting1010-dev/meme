export function CoinListSkeleton() {
  return <div className="coin-list" role="status" aria-label="Loading coin list"><span className="sr-only">Loading coins</span>{Array.from({ length: 5 }, (_, index) => <div className="coin-card skeleton-card" aria-hidden="true" key={index}><div className="skeleton-avatar" /><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line" /></div>)}</div>;
}
