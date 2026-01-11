import { Skeleton } from "@/components/ui/skeleton";

const EmailItemSkeleton = () => (
  <div className="p-3 md:p-4 flex items-start gap-3 border-b border-white/5">
    {/* Avatar */}
    <Skeleton className="h-9 w-9 md:h-10 md:w-10 rounded-full shrink-0" />
    
    <div className="flex-1 min-w-0 space-y-2">
      {/* Sender name and date */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24 md:w-32" />
        <Skeleton className="h-3 w-12 md:w-16" />
      </div>
      
      {/* Subject */}
      <Skeleton className="h-4 w-3/4" />
      
      {/* Preview text */}
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
    
    {/* Star button */}
    <Skeleton className="h-6 w-6 rounded shrink-0" />
  </div>
);

interface EmailListSkeletonProps {
  count?: number;
}

const EmailListSkeleton = ({ count = 5 }: EmailListSkeletonProps) => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <EmailItemSkeleton key={index} />
      ))}
    </div>
  );
};

export default EmailListSkeleton;
