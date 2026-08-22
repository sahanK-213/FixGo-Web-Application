

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-[18px] border border-gray-200 py-5 px-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-[52px] h-[52px] rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 pt-1">
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-7 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-2.5 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-white rounded-[18px] border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden animate-pulse">
      <div className="flex items-center justify-between py-4 px-6 border-b border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>
      <div className="px-6 py-6">
        <div className="h-[220px] bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

export function PageCard({ title, action, children }) {
  return (
    <div className="bg-white rounded-[18px] border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      {(title || action) && (
        <div className="flex items-center justify-between py-4 px-6 border-b border-gray-100">
          {title && <h2 className="text-[15px] font-bold text-gray-900 m-0">{title}</h2>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function PageHeading({ title, sub }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 m-0">{title}</h1>
      {sub && <p className="text-gray-500 mt-1.5 text-sm mb-0">{sub}</p>}
    </div>
  );
}
