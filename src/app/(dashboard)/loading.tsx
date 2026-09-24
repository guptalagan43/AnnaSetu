import { MetricSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8" role="status" aria-busy="true">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-[#DDD6C8] animate-pulse" />
        <div className="h-10 w-64 bg-[#DDD6C8] animate-pulse" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>

      {/* Data Table Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-[#DDD6C8] animate-pulse" />
        <TableSkeleton rows={4} cols={5} />
      </div>
    </div>
  );
}
