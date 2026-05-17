/** Short relative label e.g. "5 hours ago" */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';

  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return 'Just now';

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;

  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
