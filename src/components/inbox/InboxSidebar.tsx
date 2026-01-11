import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Star, 
  Clock, 
  FileText, 
  PanelLeftClose, 
  PanelLeftOpen,
  Search,
  X,
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Draft {
  id: string;
  subject: string | null;
  recipient: string | null;
  updated_at: string;
}

interface InboxSidebarProps {
  filter: 'all' | 'unread' | 'starred' | 'archived';
  setFilter: (filter: 'all' | 'unread' | 'starred' | 'archived') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  emailsCount: number;
  unreadCount: number;
  starredCount: number;
  archivedCount: number;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  showDrafts: boolean;
  setShowDrafts: (show: boolean) => void;
  drafts: Draft[] | undefined;
  onLoadDraft: (draft: Draft) => void;
  onDeleteDraft: (e: React.MouseEvent, draftId: string) => void;
}

export const InboxSidebar = ({
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  emailsCount,
  unreadCount,
  starredCount,
  archivedCount,
  collapsed,
  setCollapsed,
  showDrafts,
  setShowDrafts,
  drafts,
  onLoadDraft,
  onDeleteDraft,
}: InboxSidebarProps) => {
  const filterItems = [
    { key: 'all' as const, label: 'Toate', count: emailsCount, icon: Mail },
    { key: 'unread' as const, label: 'Necitite', count: unreadCount, icon: Clock },
    { key: 'starred' as const, label: 'Cu stea', count: starredCount, icon: Star },
    { key: 'archived' as const, label: 'Arhivate', count: archivedCount, icon: Archive }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0, width: collapsed ? 56 : 'auto' }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col gap-3 transition-all shrink-0",
        collapsed ? "w-14" : "w-full lg:w-64"
      )}
    >
      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "border border-white/10 hover:bg-white/5 hover:border-gold/30",
          collapsed ? "w-10 h-10 p-0 mx-auto" : "w-full justify-start gap-2"
        )}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <>
            <PanelLeftClose className="h-4 w-4" />
            <span className="text-sm">Restrânge</span>
          </>
        )}
      </Button>

      {/* Search */}
      {!collapsed && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Caută email-uri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 focus:border-gold/50"
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div className={cn(
        "flex flex-col gap-1 p-1 rounded-xl bg-white/5 border border-white/10",
        collapsed && "p-0.5"
      )}>
        {filterItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              "flex items-center rounded-lg text-sm font-medium transition-all",
              collapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5",
              filter === item.key 
                ? "bg-gradient-to-r from-gold/20 to-gold/5 text-gold border-l-2 border-gold" 
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
            title={collapsed ? item.label : undefined}
          >
            {collapsed ? (
              <div className="relative">
                <item.icon className="h-4 w-4" />
                {item.count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gold text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.count > 9 ? '9+' : item.count}
                  </span>
                )}
              </div>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.count > 0 && (
                  <Badge variant="secondary" className={cn(
                    "text-xs",
                    filter === item.key ? "bg-gold/20 text-gold" : "bg-white/10"
                  )}>
                    {item.count}
                  </Badge>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Drafts Button */}
      <button
        onClick={() => !collapsed && setShowDrafts(!showDrafts)}
        className={cn(
          "flex items-center rounded-xl text-sm font-medium transition-all border",
          collapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5",
          showDrafts && !collapsed
            ? "bg-gold/10 border-gold/30 text-gold" 
            : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
        )}
        title={collapsed ? "Ciorne" : undefined}
      >
        {collapsed ? (
          <div className="relative">
            <FileText className="h-4 w-4" />
            {drafts && drafts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white/20 text-[9px] font-bold rounded-full flex items-center justify-center">
                {drafts.length}
              </span>
            )}
          </div>
        ) : (
          <>
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ciorne
            </span>
            {drafts && drafts.length > 0 && (
              <Badge variant="secondary" className="bg-white/10 text-xs">
                {drafts.length}
              </Badge>
            )}
          </>
        )}
      </button>

      {/* Drafts List */}
      <AnimatePresence>
        {showDrafts && !collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden max-h-48 overflow-y-auto">
              {!drafts || drafts.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nu ai ciorne salvate
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      onClick={() => onLoadDraft(draft)}
                      className="p-3 cursor-pointer hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-gold transition-colors">
                            {draft.subject || '(Fără subiect)'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {draft.recipient || '(niciun destinatar)'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                          onClick={(e) => onDeleteDraft(e, draft.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
