import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const ProjectDetailSkeleton = () => {
  return (
    <>
      {/* Back Button */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Project Hero */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Project Image */}
            <Skeleton className="aspect-video lg:aspect-square rounded-2xl" />

            {/* Project Info */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-gold/20">
                    <CardContent className="p-4 text-center space-y-2">
                      <Skeleton className="h-6 w-6 rounded-full mx-auto" />
                      <Skeleton className="h-3 w-12 mx-auto" />
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Contact Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Skeleton className="h-10 flex-1 rounded-lg" />
                <Skeleton className="h-10 flex-1 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Features & Amenities */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <Card className="border-gold/20">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-28" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-gold/20">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Apartments Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>

          {/* Apartment Cards Grid */}
          <div className="space-y-8">
            {Array.from({ length: 2 }).map((_, floorIdx) => (
              <div key={floorIdx}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-muted" />
                  <Skeleton className="h-6 w-24" />
                  <div className="h-px flex-1 bg-muted" />
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-gold/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-5 w-24" />
                          </div>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                        <div className="h-px bg-muted" />
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-10" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <div className="h-px bg-muted" />
                        <div className="grid grid-cols-2 gap-2">
                          <Skeleton className="h-8 rounded-md" />
                          <Skeleton className="h-8 rounded-md" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
