import { motion, AnimatePresence } from "framer-motion";
import { 
  Inbox, 
  Star, 
  Send, 
  FileText, 
  Archive, 
  Trash2,
  PenSquare,
  ChevronDown,
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
      "relative flex flex-col h-full py-2 transition-all duration-300 ease-in-out border-r border-border/30",
      collapsed ? "w-[68px]" : "w-[256px]"
    )}>
      {/* Toggle button */}
      {onToggleCollapse && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className={cn(
                  "absolute -right-3 top-6 z-10 h-6 w-6 rounded-full",
                  "bg-background border border-border shadow-sm",
                  "flex items-center justify-center",
                  "hover:bg-muted transition-colors"
                )}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Extinde meniul" : "Restrânge meniul"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {/* Compose Button */}
      <div className={cn("px-3 mb-4", collapsed && "px-2")}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onCompose}
                className={cn(
                  "shadow-md hover:shadow-lg transition-all duration-200",
                  "bg-primary/10 hover:bg-primary/20 text-primary",
                  "border-0 font-medium",
                  collapsed 
                    ? "w-12 h-12 rounded-full p-0" 
                    : "w-full h-14 rounded-2xl px-6 justify-start gap-3"
                )}
              >
                <PenSquare className={cn("h-5 w-5", !collapsed && "-ml-1")} />
                {!collapsed && <span className="text-sm">Compune</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Compune</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-0.5 px-2">
        {mainItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              "w-full flex items-center gap-4 px-3 py-2 rounded-r-full transition-colors",
              "text-sm font-medium relative",
              collapsed && "justify-center rounded-full px-0",
              filter === item.key 
                ? "bg-[hsl(210,100%,92%)] text-[hsl(210,100%,30%)]" 
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 shrink-0",
              filter === item.key ? "text-[hsl(210,100%,30%)]" : "text-muted-foreground"
            )} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.showCount && item.count > 0 && (
                  <span className="text-xs font-bold">{item.count}</span>
                )}
              </>
            )}
          </button>
        ))}

        {/* Drafts */}
        <button
          onClick={onShowDrafts}
          className={cn(
            "w-full flex items-center gap-4 px-3 py-2 rounded-r-full transition-colors",
            "text-sm font-medium text-muted-foreground hover:bg-muted/50",
            collapsed && "justify-center rounded-full px-0"
          )}
        >
          <FileText className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Ciorne</span>
              {draftsCount > 0 && (
                <span className="text-xs font-bold text-muted-foreground">{draftsCount}</span>
              )}
            </>
          )}
        </button>

        {/* More label */}
        {!collapsed && (
          <button className="w-full flex items-center gap-4 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 rounded-r-full">
            <ChevronDown className="h-5 w-5" />
            <span>Mai mult</span>
          </button>
        )}

        {/* Divider */}
        <div className="my-3 border-t border-border/50" />

        {/* Secondary items */}
        {secondaryItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              "w-full flex items-center gap-4 px-3 py-2 rounded-r-full transition-colors",
              "text-sm font-medium",
              collapsed && "justify-center rounded-full px-0",
              filter === item.key 
                ? "bg-[hsl(210,100%,92%)] text-[hsl(210,100%,30%)]" 
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
              </>
            )}
          </button>
        ))}

        {/* Labels section */}
        {!collapsed && (
          <>
            <div className="my-3 border-t border-border/50" />
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Etichete</span>
              <button className="text-muted-foreground hover:text-foreground">
                <Tag className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </nav>
    </div>
  );
};
