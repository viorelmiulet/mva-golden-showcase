import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const PropertyDetailSkeleton = () => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back Button */}
      <Skeleton className="h-9 w-40" />

      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-10 sm:h-12 w-3/4" />
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <div className="col-span-3">
          <Skeleton className="w-full aspect-[16/10] rounded-xl" />
        </div>
        <div className="space-y-2 sm:space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-square rounded-lg" />
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-gold/20">
            <CardContent className="p-3 sm:p-6 text-center space-y-2">
              <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl mx-auto" />
              <Skeleton className="h-3 w-12 mx-auto" />
              <Skeleton className="h-5 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Description */}
      <Card className="border-gold/20">
        <CardContent className="p-4 sm:p-6 space-y-3">
          <Skeleton className="h-7 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>

      {/* Features & Amenities */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-gold/20">
          <CardContent className="p-4 sm:p-6 space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-gold/20">
          <CardContent className="p-4 sm:p-6 space-y-3">
            <Skeleton className="h-6 w-28" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-24 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
};
