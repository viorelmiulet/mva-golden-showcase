import { AnimatedSkeleton } from "@/components/ui/skeleton";

export const FooterSkeleton = () => (
  <footer className="border-t bg-muted/30" aria-label="Se încarcă footer-ul…">
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <AnimatedSkeleton className="h-6 w-32" />
          <AnimatedSkeleton className="h-4 w-full" />
          <AnimatedSkeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-3">
          <AnimatedSkeleton className="h-6 w-24" />
          <AnimatedSkeleton className="h-4 w-full" />
          <AnimatedSkeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-3">
          <AnimatedSkeleton className="h-6 w-28" />
          <AnimatedSkeleton className="h-4 w-full" />
          <AnimatedSkeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <AnimatedSkeleton className="h-4 w-48" />
        <AnimatedSkeleton className="h-4 w-32" />
      </div>
    </div>
  </footer>
);
