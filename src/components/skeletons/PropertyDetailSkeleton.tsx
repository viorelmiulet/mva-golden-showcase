import { Skeleton, AnimatedSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export const PropertyDetailSkeleton = () => {
  return (
    <motion.div
      className="space-y-6 sm:space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Back Button */}
      <motion.div variants={staggerItem}>
        <AnimatedSkeleton className="h-9 w-40 rounded-lg" />
      </motion.div>

      {/* Image Gallery - matches real grid layout */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-xl overflow-hidden">
        {/* Main hero image */}
        <div className="col-span-2 row-span-2">
          <AnimatedSkeleton className="w-full h-64 md:h-96" />
        </div>
        {/* Thumbnail images */}
        <AnimatedSkeleton className="w-full h-32 md:h-[calc(12rem-0.25rem)]" />
        <AnimatedSkeleton className="w-full h-32 md:h-[calc(12rem-0.25rem)]" />
        <AnimatedSkeleton className="w-full h-32 md:h-[calc(12rem-0.25rem)]" />
        <AnimatedSkeleton className="w-full h-32 md:h-[calc(12rem-0.25rem)]" />
      </motion.div>

      {/* Badges + Title + Price Row */}
      <motion.div variants={staggerItem} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <AnimatedSkeleton className="h-6 w-24 rounded-full" />
          <AnimatedSkeleton className="h-6 w-16 rounded-full" />
          <AnimatedSkeleton className="h-6 w-28 rounded-full" />
        </div>
        <AnimatedSkeleton className="h-8 sm:h-10 w-3/4 rounded-lg" />
        <div className="flex flex-wrap items-baseline gap-4">
          <AnimatedSkeleton className="h-8 w-40 rounded-lg" />
          <AnimatedSkeleton className="h-5 w-56 rounded-md" />
        </div>
      </motion.div>

      {/* Stats Grid - matches Detalii Anunț section */}
      <motion.div variants={staggerItem}>
        <Card className="border-brass/20">
          <CardContent className="p-4 sm:p-6">
            <AnimatedSkeleton className="h-6 w-40 mb-4 rounded-md" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-muted/40 border border-border/50 p-4 flex flex-col items-center justify-center text-center min-h-[120px] space-y-2"
                >
                  <AnimatedSkeleton className="h-6 w-6 rounded-full" />
                  <AnimatedSkeleton className="h-7 w-16 rounded-md" />
                  <AnimatedSkeleton className="h-3 w-12 rounded-md" />
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-border/50 flex items-center gap-3">
              <AnimatedSkeleton className="h-5 w-5 rounded-full" />
              <div className="space-y-1">
                <AnimatedSkeleton className="h-3 w-16 rounded-md" />
                <AnimatedSkeleton className="h-4 w-32 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Description Section */}
      <motion.div variants={staggerItem}>
        <Card className="border-brass/20">
          <CardContent className="p-4 sm:p-6 space-y-3">
            <AnimatedSkeleton className="h-6 w-32 rounded-md" />
            <div className="space-y-2">
              <AnimatedSkeleton className="h-4 w-full rounded-md" />
              <AnimatedSkeleton className="h-4 w-full rounded-md" />
              <AnimatedSkeleton className="h-4 w-full rounded-md" />
              <AnimatedSkeleton className="h-4 w-3/4 rounded-md" />
              <AnimatedSkeleton className="h-4 w-5/6 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Features & Amenities */}
      <motion.div variants={staggerItem} className="grid md:grid-cols-2 gap-4">
        <Card className="border-brass/20">
          <CardContent className="p-4 sm:p-6 space-y-3">
            <AnimatedSkeleton className="h-6 w-32 rounded-md" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <AnimatedSkeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-brass/20">
          <CardContent className="p-4 sm:p-6 space-y-3">
            <AnimatedSkeleton className="h-6 w-28 rounded-md" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <AnimatedSkeleton key={i} className="h-6 w-24 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agent Card */}
      <motion.div variants={staggerItem}>
        <Card className="border-brass/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <AnimatedSkeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <AnimatedSkeleton className="h-5 w-40 rounded-md" />
                <AnimatedSkeleton className="h-4 w-56 rounded-md" />
                <div className="flex gap-2 pt-1">
                  <AnimatedSkeleton className="h-8 w-28 rounded-lg" />
                  <AnimatedSkeleton className="h-8 w-28 rounded-lg" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={staggerItem} className="grid sm:grid-cols-2 gap-3">
        <AnimatedSkeleton className="h-12 w-full rounded-lg" />
        <AnimatedSkeleton className="h-12 w-full rounded-lg" />
      </motion.div>

      {/* Contact Form Skeleton */}
      <motion.div variants={staggerItem}>
        <Card className="border-brass/20">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <AnimatedSkeleton className="h-6 w-48 rounded-md" />
            <div className="grid sm:grid-cols-2 gap-4">
              <AnimatedSkeleton className="h-10 w-full rounded-lg" />
              <AnimatedSkeleton className="h-10 w-full rounded-lg" />
            </div>
            <AnimatedSkeleton className="h-10 w-full rounded-lg" />
            <AnimatedSkeleton className="h-24 w-full rounded-lg" />
            <AnimatedSkeleton className="h-12 w-full rounded-lg" />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
