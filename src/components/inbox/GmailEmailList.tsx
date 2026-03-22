import {
  Star,
  Paperclip,
  Square,
  CheckSquare,
  Trash2,
  Archive,
  MailOpen,
  RefreshCw,
  RotateCcw,
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
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-14 items-center justify-between border-b border-border/20 bg-muted/15 px-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => allSelected ? onDeselectAll() : onSelectAll()}
                  className="rounded-xl p-2 transition-colors hover:bg-muted"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>{allSelected ? "Deselectează" : "Selectează tot"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {someSelected ? (
            <div className="flex items-center gap-1 animate-in fade-in duration-150">
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
              <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {selectedIds.size} selectate
              </span>
            </div>
          ) : (
            <ActionBtn icon={RefreshCw} tooltip="Reîmprospătează" onClick={onRefresh} spinning={isLoading} />
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden rounded-full border border-border/30 bg-background px-2.5 py-1 sm:inline-flex">Inbox</span>
          <span className="tabular-nums">1–{emails.length} din {totalCount}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-border/20 bg-muted/20">
              <Archive className="h-10 w-10 text-muted-foreground/20" />
            </div>
            <p className="mb-1 text-base font-medium">Nu există email-uri</p>
            <p className="text-xs text-muted-foreground/50">Inbox-ul tău este gol</p>
          </div>
        ) : (
          <div className="divide-y divide-border/10">
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
            "h-8 w-8 rounded-xl transition-colors",
            destructive ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted",
          )}
        >
          <Icon className={cn("h-4 w-4", spinning && "animate-spin")} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
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
      onClick={onSelect}
      className={cn(
        "group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-3 py-3 transition-colors duration-100",
        "hover:bg-muted/35",
        isSelected && "bg-secondary",
        isChecked && "bg-primary/8",
        !email.is_read && "bg-muted/20",
      )}
    >
      <div className="flex items-start gap-0.5 pt-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCheck(); }}
          className="rounded-lg p-1.5 transition-colors hover:bg-muted"
        >
          {isChecked ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
          )}
        </button>

        <button onClick={onToggleStar} className="rounded-lg p-1.5 transition-colors hover:bg-muted">
          <Star className={cn(
            "h-4 w-4 transition-colors",
            email.is_starred
              ? "fill-primary text-primary"
              : "text-muted-foreground/40 group-hover:text-muted-foreground",
          )} />
        </button>
      </div>

      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-3">
          <span className={cn(
            "min-w-0 max-w-[220px] truncate text-[13px]",
            !email.is_read ? "font-semibold text-foreground" : "text-foreground",
          )}>
            {extractSenderName(email.sender)}
          </span>

          {!email.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}

          {email.attachments && email.attachments.length > 0 && (
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          )}
        </div>

        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn(
            "truncate text-[13px]",
            !email.is_read ? "font-medium text-foreground" : "text-foreground/85",
          )}>
            {email.subject || '(Fără subiect)'}
          </span>
          {email.body_plain && (
            <>
              <span className="shrink-0 text-[13px] text-muted-foreground/40">—</span>
              <span className="truncate text-[12px] text-muted-foreground">
                {email.body_plain.substring(0, 90)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2">
        <span className={cn(
          "pt-1 text-[11px] tabular-nums text-muted-foreground",
          !email.is_read && "font-semibold text-foreground",
        )}>
          {formatEmailDate(email.received_at)}
        </span>

        <div className="hidden items-center gap-0.5 group-hover:flex">
          {isTrashView && onRestore ? (
            <ActionBtn icon={RotateCcw} tooltip="Restaurează" onClick={onRestore} />
          ) : (
            <ActionBtn icon={Archive} tooltip="Arhivează" onClick={onArchive} />
          )}
          <ActionBtn icon={Trash2} tooltip={isTrashView ? "Șterge definitiv" : "Șterge"} onClick={onDelete} destructive />
        </div>
      </div>
    </div>
  );
};
