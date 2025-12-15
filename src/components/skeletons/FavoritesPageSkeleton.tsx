import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const FavoritePropertyCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-9 w-full" />
    </CardContent>
  </Card>
);

export const FavoriteComplexCardSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="w-full h-40 rounded-none" />
    <CardContent className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      
      <Skeleton className="h-9 w-full" />
    </CardContent>
  </Card>
);

export const FavoritesPageSkeleton = () => (
  <div className="space-y-6">
    {/* Complexes Section */}
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <FavoriteComplexCardSkeleton key={`complex-${i}`} />
        ))}
      </div>
    </div>
    
    {/* Properties Section */}
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <FavoritePropertyCardSkeleton key={`property-${i}`} />
        ))}
      </div>
    </div>
  </div>
);
