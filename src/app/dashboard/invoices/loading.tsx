import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 space-y-4 animate-pulse">
      <div className="h-10 w-48 rounded-lg bg-slate-900/50" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  );
}
