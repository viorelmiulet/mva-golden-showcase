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
      "relative flex flex-col h-full py-4 transition-all duration-300 ease-in-out",
      "bg-gradient-to-b from-muted/20 to-transparent",
      collapsed ? "w-[72px]" : "w-[260px]"
    )}>
      {/* Toggle button - Floating pill style */}
      {onToggleCollapse && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className={cn(
                  "absolute -right-3 top-8 z-10 h-6 w-6 rounded-full",
                  "bg-background border border-border/50 shadow-lg shadow-black/5",
                  "flex items-center justify-center",
                  "hover:bg-muted hover:scale-110 transition-all duration-200"
                )}
              >
                {collapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Extinde meniul" : "Restrânge meniul"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Compose Button - Modern floating action button */}
      <div className={cn("px-3 mb-6", collapsed && "px-2")}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onCompose}
                className={cn(
                  "relative overflow-hidden transition-all duration-300",
                  "bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90",
                  "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
                  "border-0 font-semibold text-primary-foreground",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  collapsed 
                    ? "w-12 h-12 rounded-2xl p-0" 
                    : "w-full h-14 rounded-2xl px-6 justify-start gap-3"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
                <PenSquare className={cn("h-5 w-5 relative z-10", !collapsed && "-ml-1")} />
                {!collapsed && <span className="text-sm relative z-10">Compune</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Compune</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Main Navigation - Modern card style */}
      <nav className="flex-1 space-y-1 px-3">
        {mainItems.map((item) => (
          <TooltipProvider key={item.key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    "text-sm font-medium relative group",
                    collapsed && "justify-center px-0",
                    filter === item.key 
                      ? "bg-primary/10 text-primary shadow-sm" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {filter === item.key && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                    filter === item.key ? "text-primary" : "text-muted-foreground"
                  )} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.showCount && item.count > 0 && (
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full",
                          filter === item.key 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
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
        ))}

        {/* Drafts */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onShowDrafts}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  "text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground group",
                  collapsed && "justify-center px-0"
                )}
              >
                <FileText className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Ciorne</span>
                    {draftsCount > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
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

        {/* More label */}
        {!collapsed && (
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-xl transition-all duration-200 group">
            <ChevronDown className="h-5 w-5 transition-transform group-hover:rotate-180" />
            <span>Mai mult</span>
          </button>
        )}

        {/* Divider */}
        <div className="my-4 mx-2 border-t border-border/30" />

        {/* Secondary items */}
        {secondaryItems.map((item) => (
          <TooltipProvider key={item.key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    "text-sm font-medium group",
                    collapsed && "justify-center px-0",
                    filter === item.key 
                      ? "bg-primary/10 text-primary shadow-sm" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {filter === item.key && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                    filter === item.key ? "text-primary" : ""
                  )} />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Labels section */}
        {!collapsed && (
          <>
            <div className="my-4 mx-2 border-t border-border/30" />
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etichete</span>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors">
                <Tag className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </nav>
    </div>
  );
};
