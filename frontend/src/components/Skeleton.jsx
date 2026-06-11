const shimmer = 'animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl';

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`${shimmer} h-40 w-full ${className}`} />
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Header row */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={`h-${c}`} className={`${shimmer} h-4 flex-1`} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={`${r}-${c}`} className={`${shimmer} h-4 flex-1`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${shimmer} h-3.5`}
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-full ${sizeMap[size] || sizeMap.md} ${className}`} />
  );
}

export function SkeletonStat({ className = '' }) {
  return (
    <div className={`p-5 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3 ${className}`}>
      <div className={`${shimmer} h-8 w-20`} />
      <div className={`${shimmer} h-3.5 w-28`} />
    </div>
  );
}
