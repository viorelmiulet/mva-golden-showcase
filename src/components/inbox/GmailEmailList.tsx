import { motion } from "framer-motion";
import { 
  Star, 
  Paperclip, 
  Square,
  CheckSquare,
  Trash2,
  Archive,
  MailOpen,
  Clock,
  Tag,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="h-12 border-b border-border/30 flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-1">
          {/* Select all checkbox */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => allSelected ? onDeselectAll() : onSelectAll()}
                  className="p-2 hover:bg-muted/50 rounded-sm"
                >
                  {allSelected ? (
                    <CheckSquare className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{allSelected ? "Deselectează tot" : "Selectează tot"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {someSelected ? (
            <>
              {/* Bulk actions when items selected */}
              {!isTrashView && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onBulkArchive}
                          className="h-9 w-9"
                        >
                          <Archive className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Arhivează</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onBulkDelete}
                          className="h-9 w-9"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Șterge</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onBulkMarkRead}
                          className="h-9 w-9"
                        >
                          <MailOpen className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Marchează ca citit</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              {isTrashView && onBulkRestore && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onBulkRestore}
                          className="h-9 w-9"
                        >
                          <RotateCcw className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Restaurează</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onBulkDelete}
                          className="h-9 w-9"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Șterge definitiv</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              <div className="h-5 w-px bg-border mx-2" />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selectate
              </span>
            </>
          ) : (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onRefresh}
                      className="h-9 w-9"
                    >
                      <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reîmprospătează</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mai multe</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>

        {/* Pagination info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>1-{emails.length} din {totalCount}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-24 h-24 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Archive className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium">Nu există email-uri</p>
            <p className="text-sm">Inbox-ul tău este gol</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.02 } }
            }}
          >
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
          </motion.div>
        )}
      </div>
    </div>
  );
};

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
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 5 },
        visible: { opacity: 1, y: 0 }
      }}
      className={cn(
        "group flex items-center h-10 px-2 border-b border-border/20 cursor-pointer transition-colors",
        isSelected && "bg-[hsl(210,100%,95%)]",
        isChecked && "bg-[hsl(210,100%,95%)]",
        !isSelected && !isChecked && "hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]",
        !email.is_read && "bg-background font-semibold"
      )}
    >
      {/* Checkbox & Star */}
      <div className="flex items-center shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCheck(); }}
          className="p-2 hover:bg-muted/50 rounded-sm"
        >
          {isChecked ? (
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Square className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
        
        <button
          onClick={onToggleStar}
          className="p-2 hover:bg-muted/50 rounded-sm"
        >
        <Star 
            className={cn(
              "h-5 w-5 transition-colors",
              email.is_starred 
                ? "fill-gold text-gold"
                : "text-muted-foreground opacity-0 group-hover:opacity-100"
            )} 
          />
        </button>
      </div>

      {/* Email content */}
      <div 
        className="flex-1 flex items-center gap-4 min-w-0 cursor-pointer"
        onClick={onSelect}
      >
        {/* Sender */}
        <span className={cn(
          "w-[200px] shrink-0 truncate text-sm",
          !email.is_read ? "font-semibold text-foreground" : "text-muted-foreground"
        )}>
          {extractSenderName(email.sender)}
        </span>

        {/* Subject & Preview */}
        <div className="flex-1 flex items-center gap-1 min-w-0">
          <span className={cn(
            "truncate text-sm",
            !email.is_read ? "font-semibold text-foreground" : "text-foreground"
          )}>
            {email.subject || '(Fără subiect)'}
          </span>
          {email.body_plain && (
            <>
              <span className="text-muted-foreground text-sm shrink-0"> - </span>
              <span className="text-muted-foreground text-sm truncate">
                {email.body_plain.substring(0, 100)}
              </span>
            </>
          )}
        </div>

        {/* Attachment indicator */}
        {email.attachments && email.attachments.length > 0 && (
          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        {/* Date */}
        <span className={cn(
          "text-xs shrink-0 ml-2",
          !email.is_read ? "font-semibold text-foreground" : "text-muted-foreground"
        )}>
          {formatEmailDate(email.received_at)}
        </span>
      </div>

      {/* Hover actions */}
      <div className="hidden group-hover:flex items-center gap-1 ml-2 shrink-0">
        {isTrashView && onRestore ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onRestore(); }}
                  className="h-8 w-8"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restaurează</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onArchive(); }}
                  className="h-8 w-8"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Arhivează</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isTrashView ? "Șterge definitiv" : "Șterge"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
};
