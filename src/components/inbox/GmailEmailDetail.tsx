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
  File
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

interface Email {
  id: string;
  sender: string;
  recipient?: string | null;
  cc?: string | null;
  bcc?: string | null;
  subject: string | null;
  body_plain: string | null;
  body_html: string | null;
  stripped_text?: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_archived?: boolean;
  attachments: any[];
  received_at: string;
  message_id?: string | null;
}

interface GmailEmailDetailProps {
  email: Email | null;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onToggleStar: () => void;
  onArchive: () => void;
  onUnarchive?: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  isArchived?: boolean;
  isTrashView?: boolean;
  extractSenderName: (sender: string) => string;
  extractSenderInitials: (sender: string) => string;
}

export const GmailEmailDetail = ({
  email,
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
}: GmailEmailDetailProps) => {
  const [showEmailDetails, setShowEmailDetails] = useState(false);

  if (!email) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-background via-background to-muted/5">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl scale-150" />
          <div className="relative w-36 h-36 rounded-3xl bg-gradient-to-br from-muted/20 to-muted/5 flex items-center justify-center border border-border/10 shadow-2xl shadow-black/5">
            <svg className="w-16 h-16 text-muted-foreground/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <path d="M22 7l-10 6L2 7" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-semibold mb-2 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          Selectează un email
        </p>
        <p className="text-sm text-muted-foreground/50">Alege un mesaj din listă pentru a-l citi</p>
      </div>
    );
  }

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

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/5">
      {/* Header Toolbar - Modern glass style */}
      <div className="h-14 border-b border-border/10 flex items-center justify-between px-3 shrink-0 backdrop-blur-sm bg-background/50">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-10 w-10 rounded-xl hover:bg-muted/50 transition-all duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Înapoi</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-6 w-px bg-border/30 mx-1" />

          {isTrashView && onRestore ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRestore}
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200"
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
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200"
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
                  className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isTrashView ? "Șterge definitiv" : "Șterge"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-6 w-px bg-border/30 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-muted/50 transition-all duration-200"
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
                  className="h-10 w-10 rounded-xl hover:bg-muted/50 transition-all duration-200"
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
                  className="h-10 w-10 rounded-xl hover:bg-muted/50 transition-all duration-200"
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
                  className="h-10 w-10 rounded-xl hover:bg-muted/50 transition-all duration-200"
                >
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deschide în fereastră nouă</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Email Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-8">
          {/* Subject - Modern typography */}
          <div className="flex items-start justify-between mb-8">
            <h1 className="text-2xl font-semibold text-foreground pr-4 leading-tight">
              {email.subject || '(Fără subiect)'}
            </h1>
            <button 
              onClick={onToggleStar} 
              className="shrink-0 p-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <Star 
                className={cn(
                  "h-6 w-6 transition-all duration-200",
                  email.is_starred 
                    ? "fill-gold text-gold scale-110"
                    : "text-muted-foreground hover:text-gold"
                )} 
              />
            </button>
          </div>

          <div className="flex items-start gap-4 mb-8 p-4 rounded-2xl bg-muted/20 border border-border/10">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-background shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-sm font-semibold">
                {extractSenderInitials(email.sender)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-foreground">
                  {extractSenderName(email.sender)}
                </span>
                <span className="text-sm text-muted-foreground/70">
                  &lt;{extractEmail(email.sender)}&gt;
                </span>
              </div>
              
              {/* Expandable recipient details */}
              <Collapsible open={showEmailDetails} onOpenChange={setShowEmailDetails}>
                <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
                  <span>către {email.recipient ? extractEmail(email.recipient) : 'mine'}</span>
                  {showEmailDetails ? (
                    <ChevronUp className="h-4 w-4 transition-transform" />
                  ) : (
                    <ChevronDown className="h-4 w-4 transition-transform" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <AnimatePresence>
                    {showEmailDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 p-3 rounded-xl bg-background/50 border border-border/20 space-y-2 text-sm"
                      >
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-muted-foreground">de la:</span>
                          <span className="text-foreground break-all">{email.sender}</span>
                        </div>
                        
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-muted-foreground">către:</span>
                          <span className="text-foreground break-all">{email.recipient || 'contact@mvaimobiliare.ro'}</span>
                        </div>
                        
                        {email.cc && (
                          <div className="grid grid-cols-[80px_1fr] gap-2">
                            <span className="text-muted-foreground">cc:</span>
                            <span className="text-foreground break-all">{email.cc}</span>
                          </div>
                        )}
                        
                        {email.bcc && (
                          <div className="grid grid-cols-[80px_1fr] gap-2">
                            <span className="text-muted-foreground">bcc:</span>
                            <span className="text-foreground break-all">{email.bcc}</span>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-muted-foreground">dată:</span>
                          <span className="text-foreground">
                            {format(new Date(email.received_at), "EEEE, d MMMM yyyy 'la' HH:mm", { locale: ro })}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-muted-foreground">subiect:</span>
                          <span className="text-foreground">{email.subject || '(Fără subiect)'}</span>
                        </div>
                        
                        {email.message_id && (
                          <div className="grid grid-cols-[80px_1fr] gap-2">
                            <span className="text-muted-foreground">mailed-by:</span>
                            <span className="text-foreground/70 text-xs break-all font-mono">
                              {email.message_id.replace(/<|>/g, '')}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-muted-foreground px-3 py-1.5 bg-background rounded-lg">
                {format(new Date(email.received_at), "d MMM yyyy, HH:mm", { locale: ro })}
              </span>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onReply}
                      className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all duration-200"
                    >
                      <Reply className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Răspunde</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted/50">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 backdrop-blur-xl bg-popover/95 border-border/50 rounded-xl">
                  <DropdownMenuItem onClick={onReply} className="rounded-lg focus:bg-primary/10">
                    <Reply className="h-4 w-4 mr-2" />
                    Răspunde
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onForward} className="rounded-lg focus:bg-primary/10">
                    <Forward className="h-4 w-4 mr-2" />
                    Redirecționează
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem onClick={onDelete} className="rounded-lg text-destructive focus:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Șterge
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Email body - Clean reading experience */}
          <div className="mb-10">
            {email.body_html ? (
              <div 
                className="prose prose-base max-w-none dark:prose-invert prose-p:my-3 prose-headings:my-4 prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: email.body_html }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-base text-foreground/90 leading-relaxed">
                {email.body_plain || email.stripped_text || 'Nu există conținut'}
              </div>
            )}
          </div>

          {/* Attachments - Modern card grid */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="border-t border-border/10 pt-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-muted/30 rounded-xl">
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  {email.attachments.length} atașament{email.attachments.length > 1 ? 'e' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {email.attachments.map((attachment, idx) => {
                  const FileIcon = getFileIcon(attachment.filename || attachment.name);
                  return (
                    <a
                      key={idx}
                      href={attachment.url}
                      download={attachment.filename || attachment.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-muted/20 border border-border/10 rounded-2xl hover:bg-muted/40 hover:border-border/30 transition-all duration-200 group"
                    >
                      <div className="p-3 bg-background rounded-xl shadow-sm">
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {attachment.filename || attachment.name}
                        </p>
                        {attachment.size && (
                          <p className="text-xs text-muted-foreground/60">
                            {formatFileSize(attachment.size)}
                          </p>
                        )}
                      </div>
                      <Download className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reply box - Modern input style */}
          <div className="mt-10 p-5 border border-border/10 rounded-2xl bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer" onClick={onReply}>
            <p className="text-muted-foreground/60">
              Click aici pentru a răspunde...
            </p>
          </div>

          {/* Action buttons - Pill style */}
          <div className="flex items-center gap-3 mt-8">
            <Button
              variant="outline"
              onClick={onReply}
              className="gap-2 rounded-xl px-5 border-border/30 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
            >
              <Reply className="h-4 w-4" />
              Răspunde
            </Button>
            <Button
              variant="outline"
              onClick={onForward}
              className="gap-2 rounded-xl px-5 border-border/30 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
            >
              <Forward className="h-4 w-4" />
              Redirecționează
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
