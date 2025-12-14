import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const ComplexDetailSkeleton = () => {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-16 sm:py-20 md:py-24">
      {/* Back Button */}
      <Skeleton className="h-9 w-40 mb-4 sm:mb-6 md:mb-8" />

      {/* Project Header */}
      <div className="mb-6 sm:mb-8 md:mb-12 space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-4">
            <Skeleton className="h-10 sm:h-12 md:h-14 w-64 sm:w-80 md:w-96" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-2 sm:gap-4">
            <Card className="p-2.5 sm:p-3 md:p-4 text-center flex-1 sm:flex-initial">
              <Skeleton className="h-7 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </Card>
            <Card className="p-2.5 sm:p-3 md:p-4 text-center flex-1 sm:flex-initial">
              <Skeleton className="h-7 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </Card>
          </div>
        </div>

        {/* Main Image */}
        <Skeleton className="w-full h-48 sm:h-64 md:h-80 lg:h-[400px] rounded-lg" />

        {/* Description */}
        <div className="space-y-2 max-w-3xl">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>

      {/* Filters and Sorting */}
      <Card className="mb-6 sm:mb-8">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </CardContent>
      </Card>

      {/* Building Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Skeleton className="h-10 w-28 flex-shrink-0" />
        <Skeleton className="h-10 w-28 flex-shrink-0" />
      </div>

      {/* Apartments Grid */}
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, floorIdx) => (
          <div key={floorIdx} className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ApartmentCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ApartmentCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Title and status */}
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        
        {/* Details */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        
        {/* Price */}
        <div className="pt-2 border-t">
          <Skeleton className="h-5 w-20" />
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
};
