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
    <div className="flex flex-col h-full bg-gradient-to-b from-muted/5 to-transparent">
      {/* Toolbar - Modern glass style */}
      <div className="h-14 border-b border-border/10 flex items-center justify-between px-3 shrink-0 backdrop-blur-sm bg-background/50">
        <div className="flex items-center gap-1">
          {/* Select all checkbox */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => allSelected ? onDeselectAll() : onSelectAll()}
                  className="p-2.5 hover:bg-muted/50 rounded-xl transition-all duration-200"
                >
                  {allSelected ? (
                    <CheckSquare className="h-5 w-5 text-primary" />
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
            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
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
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-all duration-200"
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
                          className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
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
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-all duration-200"
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
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-all duration-200"
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
                          className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Șterge definitiv</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              <div className="h-5 w-px bg-border/30 mx-2" />
              <span className="text-sm font-medium text-muted-foreground px-2 py-1 bg-muted/50 rounded-lg">
                {selectedIds.size} selectate
              </span>
            </div>
          ) : (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onRefresh}
                      className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-all duration-200"
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
                      className="h-9 w-9 rounded-xl hover:bg-muted/50 transition-all duration-200"
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
          <span className="font-medium">1-{emails.length} din {totalCount}</span>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                <Archive className="h-14 w-14 text-muted-foreground/30" />
              </div>
            </div>
            <p className="text-xl font-semibold mb-2">Nu există email-uri</p>
            <p className="text-sm text-muted-foreground/60">Inbox-ul tău este gol</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
            }}
            className="divide-y divide-border/5"
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
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 }
      }}
      className={cn(
        "group flex items-center h-14 px-3 cursor-pointer transition-all duration-200",
        "hover:bg-muted/30 hover:shadow-sm",
        isSelected && "bg-primary/5 border-l-2 border-l-primary",
        isChecked && "bg-primary/5",
        !email.is_read && "bg-muted/20"
      )}
    >
      {/* Checkbox & Star */}
      <div className="flex items-center shrink-0 gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCheck(); }}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          {isChecked ? (
            <CheckSquare className="h-5 w-5 text-primary" />
          ) : (
            <Square className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
        
        <button
          onClick={onToggleStar}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <Star 
            className={cn(
              "h-5 w-5 transition-all duration-200",
              email.is_starred 
                ? "fill-gold text-gold scale-110"
                : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-gold"
            )} 
          />
        </button>
      </div>

      {/* Email content */}
      <div 
        className="flex-1 flex items-center gap-4 min-w-0 cursor-pointer py-2"
        onClick={onSelect}
      >
        {/* Sender */}
        <span className={cn(
          "w-[180px] shrink-0 truncate text-sm",
          !email.is_read ? "font-semibold text-foreground" : "text-muted-foreground"
        )}>
          {extractSenderName(email.sender)}
        </span>

        {/* Subject & Preview */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className={cn(
            "truncate text-sm",
            !email.is_read ? "font-semibold text-foreground" : "text-foreground/80"
          )}>
            {email.subject || '(Fără subiect)'}
          </span>
          {email.body_plain && (
            <>
              <span className="text-muted-foreground/40 text-sm shrink-0">—</span>
              <span className="text-muted-foreground/60 text-sm truncate">
                {email.body_plain.substring(0, 80)}
              </span>
            </>
          )}
        </div>

        {/* Attachment indicator */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="shrink-0 p-1.5 bg-muted/50 rounded-lg">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Date */}
        <span className={cn(
          "text-xs shrink-0 px-2 py-1 rounded-lg",
          !email.is_read 
            ? "font-semibold text-foreground bg-muted/50" 
            : "text-muted-foreground"
        )}>
          {formatEmailDate(email.received_at)}
        </span>
      </div>

      {/* Hover actions - Modern floating style */}
      <div className="hidden group-hover:flex items-center gap-1 ml-2 shrink-0 animate-in fade-in slide-in-from-right-2 duration-200">
        {isTrashView && onRestore ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onRestore(); }}
                  className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-all duration-200"
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
                  className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-all duration-200"
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
                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
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
