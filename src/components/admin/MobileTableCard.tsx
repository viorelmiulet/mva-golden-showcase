import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MobileTableCardProps {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}

export function MobileTableCard({ children, className, highlight }: MobileTableCardProps) {
  return (
    <Card className={cn(
      "mb-3",
      highlight && "border-primary/30 bg-primary/5",
      className
    )}>
      <CardContent className="p-4 space-y-3">
        {children}
      </CardContent>
    </Card>
  );
}

interface MobileCardRowProps {
  label: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function MobileCardRow({ label, children, icon, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex items-start justify-between gap-2", className)}>
      <span className="text-sm text-muted-foreground flex items-center gap-1.5 shrink-0">
        {icon}
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  );
}

interface MobileCardActionsProps {
  children: ReactNode;
}

export function MobileCardActions({ children }: MobileCardActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/50">
      {children}
    </div>
  );
}

interface MobileCardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
}

export function MobileCardHeader({ title, subtitle, badge }: MobileCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-2 pb-2 border-b border-border/50">
      <div className="space-y-0.5 min-w-0 flex-1">
        <div className="font-medium text-foreground truncate">{title}</div>
        {subtitle && <div className="text-sm text-muted-foreground truncate">{subtitle}</div>}
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}

export function useIsMobileView() {
  // This hook can be used to check if the table should be shown as cards
  // It's a simple check based on CSS media query logic
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}
