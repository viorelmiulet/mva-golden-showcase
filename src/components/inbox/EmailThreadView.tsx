import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft,
  Star,
  Reply,
  Forward,
  MoreVertical,
  Archive,
  Trash2,
  Printer,
  ExternalLink,
  Download,
  Paperclip,
  RotateCcw,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  File,
  Send as SendIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  // Track which messages are expanded - last message is expanded by default
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    if (thread.length > 0) {
      set.add(thread[thread.length - 1].id);
    }
    return set;
  });

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(thread.map(e => e.id)));
  };

  const collapseAll = () => {
    const lastEmail = thread[thread.length - 1];
    setExpandedIds(new Set([lastEmail?.id].filter(Boolean)));
  };

  const extractEmail = (sender: string) => {
    const match = sender.match(/<([^>]+)>/);
    return match ? match[1] : sender;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return ImageIcon;
    }
    if (['pdf'].includes(ext || '')) {
      return FileText;
    }
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (thread.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-background">
        <div className="w-32 h-32 rounded-full bg-muted/10 flex items-center justify-center mb-6">
          <svg className="w-20 h-20 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
        </div>
        <p className="text-xl font-medium mb-2">Selectează un email pentru a-l citi</p>
        <p className="text-sm text-muted-foreground/60">Alege un mesaj din listă</p>
      </div>
    );
  }

  const isStarred = thread.some(e => e.is_starred);
  const lastEmail = thread[thread.length - 1];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header Toolbar */}
      <div className="h-12 border-b border-border/30 flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-9 w-9"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Înapoi</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isTrashView && onRestore ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRestore}
                    className="h-9 w-9"
                  >
                    <RotateCcw className="h-5 w-5" />
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
                    onClick={isArchived ? onUnarchive : onArchive}
                    className="h-9 w-9"
                  >
                    <Archive className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isArchived ? "Dezarhivează" : "Arhivează"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="h-9 w-9"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isTrashView ? "Șterge definitiv" : "Șterge"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-5 w-px bg-border mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                >
                  <Clock className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Amână</TooltipContent>
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
                  <Tag className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Etichete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                >
                  <Printer className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Printează</TooltipContent>
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
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deschide în fereastră nouă</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Thread Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6">
          {/* Subject */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-normal text-foreground pr-4">
                {subject || '(Fără subiect)'}
              </h1>
              {thread.length > 1 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {thread.length} mesaje în conversație
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {thread.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={expandedIds.size === thread.length ? collapseAll : expandAll}
                  className="text-xs"
                >
                  {expandedIds.size === thread.length ? "Restrânge tot" : "Extinde tot"}
                </Button>
              )}
              <button onClick={() => onToggleStar(lastEmail)} className="p-1">
                <Star 
                  className={cn(
                    "h-6 w-6 transition-colors",
                    isStarred 
                      ? "fill-gold text-gold"
                      : "text-muted-foreground hover:text-gold"
                  )} 
                />
              </button>
            </div>
          </div>

          {/* Thread messages */}
          <div className="space-y-2">
            {thread.map((email, index) => {
              const isExpanded = expandedIds.has(email.id);
              const isLast = index === thread.length - 1;
              const isSent = email.type === 'sent';

              return (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "border rounded-xl overflow-hidden transition-colors",
                    isExpanded ? "border-border bg-background" : "border-border/50 bg-muted/20 hover:bg-muted/30"
                  )}
                >
                  {/* Message header - always visible */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => toggleExpanded(email.id)}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className={cn(
                        "text-sm font-medium",
                        isSent 
                          ? "bg-primary/20 text-primary" 
                          : "bg-primary text-primary-foreground"
                      )}>
                        {isSent ? "EU" : extractSenderInitials(email.sender)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {isSent ? "Eu" : extractSenderName(email.sender)}
                        </span>
                        {isSent && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                            <SendIcon className="h-3 w-3" />
                            Trimis
                          </span>
                        )}
                        {email.is_starred && (
                          <Star className="h-4 w-4 fill-gold text-gold" />
                        )}
                      </div>
                      {!isExpanded && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {email.body_plain?.substring(0, 100) || '(Fără conținut)'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(email.received_at), "d MMM, HH:mm", { locale: ro })}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
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
                          {/* To/From details */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 pl-[52px]">
                            {isSent ? (
                              <span>către {email.recipient || 'destinatar necunoscut'}</span>
                            ) : (
                              <span>către mine</span>
                            )}
                          </div>

                          {/* Email body */}
                          <div className="pl-[52px]">
                            {email.body_html ? (
                              <div 
                                className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-headings:my-3"
                                dangerouslySetInnerHTML={{ __html: email.body_html }}
                              />
                            ) : (
                              <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                                {email.body_plain || email.stripped_text || 'Nu există conținut'}
                              </div>
                            )}

                            {/* Attachments */}
                            {email.attachments && email.attachments.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/30">
                                <div className="flex items-center gap-2 mb-3">
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
                                        className="flex items-center gap-2 px-3 py-2 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                                      >
                                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                                        <span className="truncate max-w-[120px]">
                                          {attachmentName}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Quick actions */}
                            <div className="flex items-center gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); onReply(email); }}
                                className="gap-1.5"
                              >
                                <Reply className="h-4 w-4" />
                                Răspunde
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); onForward(email); }}
                                className="gap-1.5"
                              >
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

          {/* Reply box at bottom */}
          <div className="mt-6 border border-border/50 rounded-2xl p-4">
            <button 
              onClick={() => onReply(lastEmail)}
              className="w-full text-left text-muted-foreground hover:text-foreground transition-colors"
            >
              Click aici pentru a răspunde...
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
