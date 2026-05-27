import { AnimatedSkeleton } from "@/components/ui/skeleton";

export const LightboxSkeleton = () => (
  <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200]" aria-label="Se încarcă galeria…">
    <AnimatedSkeleton className="w-[90vw] max-w-5xl h-[60vh] sm:h-[70vh] rounded-lg" />
  </div>
);
