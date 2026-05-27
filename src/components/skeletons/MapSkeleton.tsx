import { MapPin } from "lucide-react";
import { AnimatedSkeleton } from "@/components/ui/skeleton";

export const MapSkeleton = () => (
  <section className="space-y-2" aria-label="Se încarcă locația…">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0" />
        <AnimatedSkeleton className="h-5 w-40 sm:w-56" />
      </div>
      <AnimatedSkeleton className="h-4 w-28 sm:w-40" />
    </div>
    <div className="relative w-full h-[300px] sm:h-[400px] md:h-[460px] rounded-lg overflow-hidden border border-gold/20 bg-muted">
      <AnimatedSkeleton className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full bg-muted-foreground/5 border-2 border-dashed border-muted-foreground/20 w-32 h-32" />
      </div>
    </div>
    <AnimatedSkeleton className="h-3 w-3/4 max-w-md" />
  </section>
);
