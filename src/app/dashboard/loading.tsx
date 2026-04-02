import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="h-24 rounded-2xl bg-card" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-card" />
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-64 rounded-xl bg-card lg:col-span-2" />
        <div className="h-64 rounded-xl bg-card" />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="h-12 rounded-xl bg-card" />

      {/* Tables Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 rounded-xl bg-card" />
        <div className="h-72 rounded-xl bg-card" />
      </div>
    </div>
  );
}
