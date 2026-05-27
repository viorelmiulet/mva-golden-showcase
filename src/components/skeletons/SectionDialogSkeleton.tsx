import { AnimatedSkeleton } from "@/components/ui/skeleton";

export const SectionDialogSkeleton = () => (
  <div className="p-6 space-y-5" aria-label="Se încarcă secțiunea…">
    <AnimatedSkeleton className="h-6 w-48" />
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <AnimatedSkeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  </div>
);
