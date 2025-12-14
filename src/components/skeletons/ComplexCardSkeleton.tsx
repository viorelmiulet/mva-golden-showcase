import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const ComplexCardSkeleton = () => {
  return (
    <Card className="overflow-hidden h-full">
      {/* Image skeleton */}
      <div className="relative h-48 md:h-64">
        <Skeleton className="w-full h-full rounded-none" />
        {/* Overlay title skeleton */}
        <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4">
          <Skeleton className="h-7 w-3/4 bg-background/20" />
        </div>
      </div>

      <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
        {/* Location */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Statistics Section */}
        <div className="pt-3 md:pt-4 border-t space-y-2 md:space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          {/* Progress bar skeleton */}
          <Skeleton className="h-3 md:h-4 w-full rounded-full" />
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 md:gap-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* CTA */}
        <div className="pt-3 md:pt-4">
          <Skeleton className="h-5 w-48" />
        </div>
      </CardContent>
    </Card>
  );
};

export const ComplexGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ComplexCardSkeleton key={i} />
      ))}
    </div>
  );
};
