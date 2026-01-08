import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
}

export const PullToRefreshIndicator = ({ 
  pullDistance, 
  isRefreshing, 
  progress 
}: PullToRefreshIndicatorProps) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div 
      className="flex items-center justify-center transition-all duration-200 overflow-hidden"
      style={{ 
        height: pullDistance,
        opacity: Math.min(progress / 50, 1)
      }}
    >
      <div 
        className={cn(
          "p-2 rounded-full bg-gold/10 border border-gold/20",
          isRefreshing && "animate-spin"
        )}
        style={{
          transform: `rotate(${progress * 3.6}deg)`,
        }}
      >
        <RefreshCw className="h-5 w-5 text-gold" />
      </div>
      {!isRefreshing && progress >= 100 && (
        <span className="ml-2 text-xs text-muted-foreground">Eliberează pentru a reîncărca</span>
      )}
    </div>
  );
};
