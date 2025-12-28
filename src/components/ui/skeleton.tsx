import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Animated skeleton with shimmer effect
function AnimatedSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        className
      )}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  )
}

// Skeleton with fade-in animation
function FadeInSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <motion.div
      className={cn("rounded-md bg-muted", className)}
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

// Card skeleton with staggered children animation
function CardSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("rounded-lg border bg-card p-4 space-y-3", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <AnimatedSkeleton className="h-4 w-24" />
        <AnimatedSkeleton className="h-8 w-8 rounded-full" />
      </div>
      <AnimatedSkeleton className="h-8 w-32" />
      <AnimatedSkeleton className="h-3 w-20" />
    </motion.div>
  )
}

// Chart skeleton with animation
function ChartSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("rounded-lg border bg-card overflow-hidden", className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
    >
      <div className="p-4 space-y-2 border-b">
        <AnimatedSkeleton className="h-5 w-40" />
        <AnimatedSkeleton className="h-3 w-28" />
      </div>
      <div className="p-4 h-[200px] flex items-end justify-around gap-2">
        {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
          <motion.div
            key={i}
            className="bg-muted rounded-t w-full"
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{
              duration: 0.5,
              delay: i * 0.1,
              ease: "easeOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// Table row skeleton
function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <motion.div
      className="flex items-center gap-4 p-4 border-b"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <AnimatedSkeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-32" : i === columns - 1 ? "w-20" : "w-24"
          )}
        />
      ))}
    </motion.div>
  )
}

// Stats skeleton with pulse
function StatsSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 },
        },
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="rounded-lg border bg-card p-4 space-y-3"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center justify-between">
            <FadeInSkeleton className="h-4 w-20" />
            <FadeInSkeleton className="h-8 w-8 rounded-lg" />
          </div>
          <FadeInSkeleton className="h-7 w-24" />
          <FadeInSkeleton className="h-3 w-16" />
        </motion.div>
      ))}
    </motion.div>
  )
}

export { 
  Skeleton, 
  AnimatedSkeleton, 
  FadeInSkeleton, 
  CardSkeleton, 
  ChartSkeleton, 
  TableRowSkeleton,
  StatsSkeleton 
}
