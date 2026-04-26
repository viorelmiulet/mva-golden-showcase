import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Reply,
  Forward,
  Archive,
  Trash2,
  Printer,
  ExternalLink,
  Paperclip,
  RotateCcw,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  File,
  Send as SendIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { downloadEmailAttachment, getAttachmentName, getAttachmentUrl } from "./attachment-download";

interface ThreadEmail {
  id: string;
  sender: string;
  recipient?: string | null;
  subject: string | null;
  body_plain: string | null;
  body_html: string | null;
  stripped_text?: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_archived?: boolean;
  attachments: any[];
  received_at: string;
  type: 'sent' | 'received';
}

interface EmailThreadViewProps {
  thread: ThreadEmail[];
  subject: string;
  onClose: () => void;
  onReply: (email: ThreadEmail) => void;
  onForward: (email: ThreadEmail) => void;
  onToggleStar: (email: ThreadEmail) => void;
  onArchive: () => void;
  onUnarchive?: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  isArchived?: boolean;
  isTrashView?: boolean;
  extractSenderName: (sender: string) => string;
  extractSenderInitials: (sender: string) => string;
}

export const EmailThreadView = ({
  thread,
  subject,
  onClose,
  onReply,
  onForward,
  onToggleStar,
  onArchive,
  onUnarchive,
  onDelete,
  onRestore,
  isArchived = false,
  isTrashView = false,
  extractSenderName,
  extractSenderInitials,
}: EmailThreadViewProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    if (thread.length > 0) {
      set.add(thread[thread.length - 1].id);
    }
    return set;
  });

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => setExpandedIds(new Set(thread.map((e) => e.id)));
  const collapseAll = () => {
    const lastEmail = thread[thread.length - 1];
    setExpandedIds(new Set([lastEmail?.id].filter(Boolean)));
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return ImageIcon;
    if (["pdf"].includes(ext || "")) return FileText;
    return File;
  };

  if (thread.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background text-muted-foreground">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-border/20 bg-muted/10">
          <svg className="h-12 w-12 text-muted-foreground/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
        </div>
        <p className="mb-2 text-xl font-medium">Selectează un email pentru a-l citi</p>
        <p className="text-sm text-muted-foreground/60">Alege un mesaj din listă</p>
      </div>
    );
  }

  const isStarred = thread.some((e) => e.is_starred);
  const lastEmail = thread[thread.length - 1];

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-14 items-center justify-between border-b border-border/20 bg-muted/15 px-3 shrink-0">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-xl hover:bg-muted">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Înapoi</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isTrashView && onRestore ? (
            <ToolbarBtn icon={RotateCcw} tooltip="Restaurează" onClick={onRestore} />
          ) : (
            <ToolbarBtn icon={Archive} tooltip={isArchived ? "Dezarhivează" : "Arhivează"} onClick={isArchived ? onUnarchive! : onArchive} />
          )}
          <ToolbarBtn icon={Trash2} tooltip={isTrashView ? "Șterge definitiv" : "Șterge"} onClick={onDelete} />

          <div className="mx-1 h-4 w-px bg-border/30" />
          <ToolbarBtn icon={Clock} tooltip="Amână" onClick={() => {}} />
          <ToolbarBtn icon={Tag} tooltip="Etichete" onClick={() => {}} />
        </div>

        <div className="flex items-center gap-1">
          <ToolbarBtn icon={Printer} tooltip="Printează" onClick={() => {}} />
          <ToolbarBtn icon={ExternalLink} tooltip="Deschide în fereastră nouă" onClick={() => {}} />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-5xl p-6">
          <div className="mb-5 flex items-start justify-between rounded-3xl border border-border/20 bg-muted/15 p-6">
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full border border-border/30 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Conversație
                </span>
                {thread.length > 1 && (
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    {thread.length} mesaje
                  </span>
                )}
              </div>
              <h1 className="pr-4 text-2xl font-semibold text-foreground">{subject || '(Fără subiect)'}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {thread.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={expandedIds.size === thread.length ? collapseAll : expandAll}
                  className="rounded-xl border border-border/30 bg-background text-xs hover:bg-muted"
                >
                  {expandedIds.size === thread.length ? "Restrânge tot" : "Extinde tot"}
                </Button>
              )}
              <button onClick={() => onToggleStar(lastEmail)} className="rounded-2xl border border-border/30 bg-background p-3 transition-colors hover:bg-muted">
                <Star className={cn("h-5 w-5 transition-colors", isStarred ? "fill-primary text-primary" : "text-muted-foreground/50 hover:text-primary")} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {thread.map((email, index) => {
              const isExpanded = expandedIds.has(email.id);
              const isSent = email.type === 'sent';
              return (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "overflow-hidden rounded-3xl border transition-colors",
                    isExpanded ? "border-border/30 bg-background shadow-sm" : "border-border/20 bg-muted/15 hover:bg-muted/25",
                  )}
                >
                  <div className="flex cursor-pointer items-center gap-3 p-4" onClick={() => toggleExpanded(email.id)}>
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className={cn(
                        "text-sm font-medium",
                        isSent ? "bg-primary/15 text-primary" : "bg-secondary text-foreground",
                      )}>
                        {isSent ? "EU" : extractSenderInitials(email.sender)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{isSent ? "Eu" : extractSenderName(email.sender)}</span>
                        {isSent && (
                          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            <SendIcon className="h-3 w-3" />
                            Trimis
                          </span>
                        )}
                        {email.is_starred && <Star className="h-4 w-4 fill-primary text-primary" />}
                      </div>
                      {!isExpanded && (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {email.body_plain?.substring(0, 100) || '(Fără conținut)'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{format(new Date(email.received_at), "d MMM, HH:mm", { locale: ro })}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0">
                          <div className="mb-4 flex items-center gap-2 pl-[52px] text-sm text-muted-foreground">
                            {isSent ? <span>către {email.recipient || 'destinatar necunoscut'}</span> : <span>către mine</span>}
                          </div>

                          <div className="overflow-hidden pl-[52px]">
                            {email.body_html ? (
                              <div className="email-message-content prose prose-sm max-w-none overflow-x-auto break-words rounded-xl bg-email-preview-background p-4 text-email-preview-foreground prose-p:my-2 prose-p:text-email-preview-foreground prose-headings:my-3 prose-headings:text-email-preview-foreground prose-strong:text-email-preview-foreground prose-li:text-email-preview-foreground prose-a:text-email-preview-link [&_img]:max-w-full [&_img]:h-auto [&_table]:max-w-full [&_table]:table-auto [&_table]:w-full [&_td]:break-words [&_th]:break-words [&_iframe]:max-w-full" dangerouslySetInnerHTML={{ __html: email.body_html }} />
                            ) : (
                              <div className="email-message-content whitespace-pre-wrap rounded-xl bg-email-preview-background p-4 text-sm leading-relaxed text-email-preview-foreground">
                                {email.body_plain || email.stripped_text || 'Nu există conținut'}
                              </div>
                            )}

                            {email.attachments && email.attachments.length > 0 && (
                              <div className="mt-4 border-t border-border/20 pt-4">
                                <div className="mb-3 flex items-center gap-2">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {email.attachments.length} atașament{email.attachments.length > 1 ? 'e' : ''}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {email.attachments.map((attachment, idx) => {
                                    const attachmentName = getAttachmentName(attachment);
                                    const attachmentUrl = getAttachmentUrl(attachment);
                                    const FileIcon = getFileIcon(attachmentName);
                                    return (
                                      <button
                                        type="button"
                                        key={idx}
                                        onClick={() => void downloadEmailAttachment(attachment)}
                                        disabled={!attachmentUrl}
                                        className="flex items-center gap-2 rounded-2xl border border-border/20 bg-muted/10 px-3 py-2 text-sm transition-colors hover:bg-muted/30"
                                      >
                                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                                        <span className="max-w-[120px] truncate">{attachmentName}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="mt-4 flex items-center gap-2">
                              <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); onReply(email); }} className="gap-1.5 rounded-xl">
                                <Reply className="h-4 w-4" />
                                Răspunde
                              </Button>
                              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onForward(email); }} className="gap-1.5 rounded-xl border-border/30 hover:bg-muted">
                                <Forward className="h-4 w-4" />
                                Redirecționează
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl border border-border/20 bg-background p-4">
            <button onClick={() => onReply(lastEmail)} className="w-full rounded-2xl border border-border/20 bg-muted/10 px-4 py-4 text-left text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground">
              Click aici pentru a răspunde...
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

const ToolbarBtn = ({ icon: Icon, tooltip, onClick }: { icon: any; tooltip: string; onClick: () => void }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={onClick} className="h-9 w-9 rounded-xl hover:bg-muted">
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
