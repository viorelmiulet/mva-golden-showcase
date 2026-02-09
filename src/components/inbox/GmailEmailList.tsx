import { motion } from "framer-motion";
import { 
  Star, 
  Paperclip, 
  Square,
  CheckSquare,
  Trash2,
  Archive,
  MailOpen,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Email {
  id: string;
  sender: string;
  subject: string | null;
  body_plain: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_deleted?: boolean;
  attachments: any[];
  received_at: string;
}

interface GmailEmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (email: Email) => void;
  onToggleStar: (e: React.MouseEvent, email: Email) => void;
  onDelete: (email: Email) => void;
  onArchive: (email: Email) => void;
  onRestore?: (email: Email) => void;
  extractSenderName: (sender: string) => string;
  formatEmailDate: (date: string) => string;
  isLoading?: boolean;
  isTrashView?: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  totalCount: number;
  onRefresh: () => void;
  onBulkDelete: () => void;
  onBulkArchive: () => void;
  onBulkMarkRead: () => void;
  onBulkRestore?: () => void;
}

export const GmailEmailList = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  onToggleStar,
  onDelete,
  onArchive,
  onRestore,
  extractSenderName,
  formatEmailDate,
  isLoading = false,
  isTrashView = false,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  totalCount,
  onRefresh,
  onBulkDelete,
  onBulkArchive,
  onBulkMarkRead,
  onBulkRestore,
}: GmailEmailListProps) => {
  const allSelected = emails.length > 0 && selectedIds.size === emails.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="h-10 border-b border-border/10 flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => allSelected ? onDeselectAll() : onSelectAll()}
                  className="p-1.5 hover:bg-muted/40 rounded-md transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{allSelected ? "Deselectează" : "Selectează tot"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {someSelected ? (
            <div className="flex items-center gap-0.5 animate-in fade-in duration-150">
              {!isTrashView && (
                <>
                  <ActionBtn icon={Archive} tooltip="Arhivează" onClick={onBulkArchive} />
                  <ActionBtn icon={Trash2} tooltip="Șterge" onClick={onBulkDelete} destructive />
                  <ActionBtn icon={MailOpen} tooltip="Marchează citit" onClick={onBulkMarkRead} />
                </>
              )}
              {isTrashView && onBulkRestore && (
                <>
                  <ActionBtn icon={RotateCcw} tooltip="Restaurează" onClick={onBulkRestore} />
                  <ActionBtn icon={Trash2} tooltip="Șterge definitiv" onClick={onBulkDelete} destructive />
                </>
              )}
              <span className="text-xs text-muted-foreground ml-1.5 tabular-nums">{selectedIds.size} sel.</span>
            </div>
          ) : (
            <>
              <ActionBtn icon={RefreshCw} tooltip="Reîmprospătează" onClick={onRefresh} spinning={isLoading} />
            </>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
          <span className="tabular-nums">1–{emails.length} din {totalCount}</span>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
            <div className="w-20 h-20 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
              <Archive className="h-10 w-10 text-muted-foreground/20" />
            </div>
            <p className="text-base font-medium mb-1">Nu există email-uri</p>
            <p className="text-xs text-muted-foreground/50">Inbox-ul tău este gol</p>
          </div>
        ) : (
          <div className="divide-y divide-border/5">
            {emails.map((email) => (
              <GmailEmailRow
                key={email.id}
                email={email}
                isSelected={selectedEmailId === email.id}
                isChecked={selectedIds.has(email.id)}
                onSelect={() => onSelectEmail(email)}
                onToggleCheck={() => onToggleSelect(email.id)}
                onToggleStar={(e) => onToggleStar(e, email)}
                onDelete={() => onDelete(email)}
                onArchive={() => onArchive(email)}
                onRestore={onRestore ? () => onRestore(email) : undefined}
                extractSenderName={extractSenderName}
                formatEmailDate={formatEmailDate}
                isTrashView={isTrashView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Small action button helper
const ActionBtn = ({ icon: Icon, tooltip, onClick, destructive, spinning }: {
  icon: any; tooltip: string; onClick: () => void; destructive?: boolean; spinning?: boolean;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn(
            "h-7 w-7 rounded-md transition-colors",
            destructive ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted/50"
          )}
        >
          <Icon className={cn("h-4 w-4", spinning && "animate-spin")} />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface GmailEmailRowProps {
  email: Email;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: () => void;
  onToggleCheck: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onArchive: () => void;
  onRestore?: () => void;
  extractSenderName: (sender: string) => string;
  formatEmailDate: (date: string) => string;
  isTrashView: boolean;
}

const GmailEmailRow = ({
  email,
  isSelected,
  isChecked,
  onSelect,
  onToggleCheck,
  onToggleStar,
  onDelete,
  onArchive,
  onRestore,
  extractSenderName,
  formatEmailDate,
  isTrashView,
}: GmailEmailRowProps) => {
  return (
    <div
      className={cn(
        "group flex items-center h-10 px-2 cursor-pointer transition-colors duration-100",
        "hover:bg-muted/25",
        isSelected && "bg-primary/8 border-l-2 border-l-primary",
        isChecked && "bg-primary/6",
        !email.is_read && "bg-muted/15"
      )}
    >
      {/* Checkbox & Star */}
      <div className="flex items-center shrink-0 gap-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCheck(); }}
          className="p-1.5 rounded-md hover:bg-muted/40 transition-colors"
        >
          {isChecked ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
          )}
        </button>
        
        <button onClick={onToggleStar} className="p-1 rounded-md hover:bg-muted/40 transition-colors">
          <Star className={cn(
            "h-4 w-4 transition-colors",
            email.is_starred 
              ? "fill-gold text-gold"
              : "text-muted-foreground/30 group-hover:text-muted-foreground/60 hover:text-gold"
          )} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center gap-3 min-w-0 py-1" onClick={onSelect}>
        <span className={cn(
          "w-40 shrink-0 truncate text-[13px]",
          !email.is_read ? "font-semibold text-foreground" : "text-muted-foreground"
        )}>
          {extractSenderName(email.sender)}
        </span>

        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <span className={cn(
            "truncate text-[13px]",
            !email.is_read ? "font-medium text-foreground" : "text-foreground/70"
          )}>
            {email.subject || '(Fără subiect)'}
          </span>
          {email.body_plain && (
            <>
              <span className="text-muted-foreground/30 text-[13px] shrink-0">—</span>
              <span className="text-muted-foreground/50 text-[13px] truncate">
                {email.body_plain.substring(0, 60)}
              </span>
            </>
          )}
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        )}

        <span className={cn(
          "text-[11px] shrink-0 tabular-nums",
          !email.is_read ? "font-semibold text-foreground" : "text-muted-foreground/60"
        )}>
          {formatEmailDate(email.received_at)}
        </span>
      </div>

      {/* Hover actions */}
      <div className="hidden group-hover:flex items-center gap-0.5 ml-1 shrink-0">
        {isTrashView && onRestore ? (
          <ActionBtn icon={RotateCcw} tooltip="Restaurează" onClick={() => { onRestore(); }} />
        ) : (
          <ActionBtn icon={Archive} tooltip="Arhivează" onClick={() => { onArchive(); }} />
        )}
        <ActionBtn icon={Trash2} tooltip={isTrashView ? "Șterge definitiv" : "Șterge"} onClick={() => { onDelete(); }} destructive />
      </div>
    </div>
  );
};
