export default function ProtectedLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-100 dark:border-slate-800">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-72 bg-gray-100 dark:bg-slate-800/60 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-gray-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-9 w-28 bg-gray-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Hero / Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-slate-800" />
              <div className="h-4 w-12 bg-gray-100 dark:bg-slate-800/60 rounded-md" />
            </div>
            <div className="space-y-1.5">
              <div className="h-6 w-24 bg-gray-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-slate-800/60 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="h-5 w-40 bg-gray-200 dark:bg-slate-800 rounded-lg" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-800" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-3 w-20 bg-gray-100 dark:bg-slate-800/60 rounded-md" />
                  </div>
                </div>
                <div className="h-5 w-16 bg-gray-200 dark:bg-slate-800 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="h-5 w-32 bg-gray-200 dark:bg-slate-800 rounded-lg" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-full bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2">
                <div className="h-4 w-28 bg-gray-200 dark:bg-slate-800 rounded-md" />
                <div className="h-3 w-full bg-gray-100 dark:bg-slate-800/60 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
