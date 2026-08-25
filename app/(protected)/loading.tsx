export default function ProtectedLoading() {
  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-pulse">
      {/* 1. Header Skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gray-200 dark:bg-slate-800 shrink-0" />
          <div className="space-y-2">
            <div className="h-5 w-40 sm:w-56 bg-gray-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-3 w-28 bg-gray-100 dark:bg-slate-800/60 rounded-md" />
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-8 w-24 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-28 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-28 bg-gray-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* 2. Top 3 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-gray-200 dark:bg-slate-800 rounded-md" />
              <div className="h-4 w-16 bg-gray-100 dark:bg-slate-800/60 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-36 bg-gray-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-3 w-48 bg-gray-100 dark:bg-slate-800/60 rounded-md" />
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-between">
              <div className="h-3 w-24 bg-gray-100 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Mid Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-5 h-64 flex flex-col justify-between">
          <div className="h-4 w-32 bg-gray-200 dark:bg-slate-800 rounded-md" />
          <div className="h-40 bg-gray-100 dark:bg-slate-800/40 rounded-xl" />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-5 h-64 flex flex-col justify-between">
          <div className="h-4 w-32 bg-gray-200 dark:bg-slate-800 rounded-md" />
          <div className="h-40 bg-gray-100 dark:bg-slate-800/40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
