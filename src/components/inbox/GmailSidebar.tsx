import {
  Inbox,
  Star,
  Send,
  FileText,
  Archive,
  Trash2,
  PenSquare,
  ChevronLeft,
  ChevronRight,
  Tag,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GmailSidebarProps {
  filter: 'all' | 'unread' | 'starred' | 'archived' | 'sent' | 'trash';
  setFilter: (filter: 'all' | 'unread' | 'starred' | 'archived' | 'sent' | 'trash') => void;
  emailsCount: number;
  unreadCount: number;
  starredCount: number;
  archivedCount: number;
  sentCount: number;
  trashCount: number;
  draftsCount: number;
  onCompose: () => void;
  onShowDrafts: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const GmailSidebar = ({
  filter,
  setFilter,
  unreadCount,
  starredCount,
  archivedCount,
  sentCount,
  trashCount,
  draftsCount,
  onCompose,
  onShowDrafts,
  collapsed = false,
  onToggleCollapse,
}: GmailSidebarProps) => {
  const mainItems = [
    { key: 'all' as const, label: 'Inbox', count: unreadCount, icon: Inbox },
    { key: 'starred' as const, label: 'Favorite', count: starredCount, icon: Star },
    { key: 'unread' as const, label: 'Necitite', count: unreadCount, icon: Clock },
    { key: 'sent' as const, label: 'Trimise', count: sentCount, icon: Send },
  ];

  const secondaryItems = [
    { key: 'archived' as const, label: 'Arhivă', count: archivedCount, icon: Archive },
    { key: 'trash' as const, label: 'Coș de gunoi', count: trashCount, icon: Trash2 },
  ];

  const renderItem = (
    item: { key: 'all' | 'unread' | 'starred' | 'archived' | 'sent' | 'trash'; label: string; count: number; icon: any },
    showCount = true,
  ) => (
    <TooltipProvider key={item.key}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setFilter(item.key)}
            className={cn(
              "group relative w-full rounded-xl border text-sm transition-all duration-200",
              collapsed
                ? "flex h-11 items-center justify-center border-transparent bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                : "grid grid-cols-[20px_1fr_auto] items-center gap-3 px-3 py-2.5",
              !collapsed && (filter === item.key
                ? "border-border/40 bg-secondary text-foreground shadow-sm"
                : "border-transparent text-muted-foreground hover:border-border/30 hover:bg-muted/40 hover:text-foreground"),
            )}
          >
            {filter === item.key && !collapsed && (
              <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />
            )}

            <item.icon className={cn(
              "h-[18px] w-[18px] shrink-0",
              filter === item.key ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
            )} />

            {!collapsed && (
              <>
                <span className="truncate text-left font-medium">{item.label}</span>
                {showCount && item.count > 0 && (
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                    filter === item.key ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}>
                    {item.count}
                  </span>
                )}
              </>
            )}
          </button>
        </TooltipTrigger>
        {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-border/20 bg-muted/20 transition-all duration-300",
        collapsed ? "w-16" : "w-[264px]",
      )}
    >
      <div className={cn("border-b border-border/20 p-3", collapsed && "px-2")}>
        <div className={cn("flex items-center justify-between gap-2", collapsed && "justify-center")}>
          {!collapsed && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mail</p>
              <p className="mt-1 text-sm font-medium text-foreground">Foldere</p>
            </div>
          )}

          {onToggleCollapse && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleCollapse}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/30 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{collapsed ? "Extinde" : "Restrânge"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className={cn("p-3", collapsed && "px-2")}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onCompose}
                className={cn(
                  "h-11 rounded-xl border border-primary/20 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
                  collapsed ? "w-11 px-0" : "w-full justify-start gap-3 px-4",
                )}
              >
                <PenSquare className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm font-semibold">Mesaj nou</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Mesaj nou</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-3">
        {!collapsed && <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Principal</p>}
        {mainItems.map((item) => renderItem(item))}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onShowDrafts}
                className={cn(
                  "w-full rounded-xl border text-sm transition-all duration-200",
                  collapsed
                    ? "flex h-11 items-center justify-center border-transparent bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    : "grid grid-cols-[20px_1fr_auto] items-center gap-3 border-transparent px-3 py-2.5 text-muted-foreground hover:border-border/30 hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <FileText className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="text-left font-medium">Ciorne</span>
                    {draftsCount > 0 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                        {draftsCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Ciorne</TooltipContent>}
          </Tooltip>
        </TooltipProvider>

        <div className="my-3 border-t border-border/20" />

        {!collapsed && <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Organizare</p>}
        {secondaryItems.map((item) => renderItem(item))}

        {!collapsed && (
          <>
            <div className="my-3 border-t border-border/20" />
            <div className="flex items-center justify-between px-1 py-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Etichete</span>
              <button className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Tag className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </nav>
    </div>
  );
};
