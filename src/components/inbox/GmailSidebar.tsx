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
  Clock
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
  emailsCount,
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
    { key: 'all' as const, label: 'Primite', count: unreadCount, icon: Inbox, showCount: true },
    { key: 'starred' as const, label: 'Cu stea', count: starredCount, icon: Star, showCount: false },
    { key: 'unread' as const, label: 'Programate', count: 0, icon: Clock, showCount: false },
    { key: 'sent' as const, label: 'Trimise', count: 0, icon: Send, showCount: false },
  ];

  const secondaryItems = [
    { key: 'archived' as const, label: 'Toate mesajele', count: archivedCount, icon: Archive },
    { key: 'trash' as const, label: 'Coș de gunoi', count: trashCount, icon: Trash2 },
  ];

  return (
    <div className={cn(
      "relative flex flex-col h-full py-3 transition-all duration-300 border-r border-border/10",
      collapsed ? "w-16" : "w-56"
    )}>
      {/* Toggle */}
      {onToggleCollapse && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className="absolute -right-2.5 top-7 z-10 h-5 w-5 rounded-full bg-background border border-border/40 shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
              >
                {collapsed ? <ChevronRight className="h-3 w-3 text-muted-foreground" /> : <ChevronLeft className="h-3 w-3 text-muted-foreground" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">{collapsed ? "Extinde" : "Restrânge"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Compose */}
      <div className={cn("px-2.5 mb-4", collapsed && "px-1.5")}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onCompose}
                className={cn(
                  "transition-all duration-200 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20",
                  "bg-primary hover:bg-primary/90 text-primary-foreground font-medium",
                  collapsed 
                    ? "w-10 h-10 rounded-xl p-0" 
                    : "w-full h-10 rounded-xl px-4 justify-start gap-2.5"
                )}
              >
                <PenSquare className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm">Compune</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Compune</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2">
        {mainItems.map((item) => (
          <TooltipProvider key={item.key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150",
                    "text-sm relative",
                    collapsed && "justify-center px-0",
                    filter === item.key 
                      ? "bg-primary/12 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  {filter === item.key && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    filter === item.key ? "text-primary" : ""
                  )} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.showCount && item.count > 0 && (
                        <span className="text-xs font-semibold tabular-nums">{item.count}</span>
                      )}
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Drafts */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onShowDrafts}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150",
                  "text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <FileText className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Ciorne</span>
                    {draftsCount > 0 && <span className="text-xs font-semibold tabular-nums">{draftsCount}</span>}
                  </>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Ciorne</TooltipContent>}
          </Tooltip>
        </TooltipProvider>

        {/* Divider */}
        <div className="my-3 mx-1 border-t border-border/15" />

        {/* Secondary */}
        {secondaryItems.map((item) => (
          <TooltipProvider key={item.key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150",
                    "text-sm relative",
                    collapsed && "justify-center px-0",
                    filter === item.key 
                      ? "bg-primary/12 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  {filter === item.key && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0", filter === item.key ? "text-primary" : "")} />
                  {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Labels */}
        {!collapsed && (
          <>
            <div className="my-3 mx-1 border-t border-border/15" />
            <div className="px-2.5 py-1.5 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">Etichete</span>
              <button className="text-muted-foreground/50 hover:text-foreground p-1 rounded hover:bg-muted/40 transition-colors">
                <Tag className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </nav>
    </div>
  );
};
