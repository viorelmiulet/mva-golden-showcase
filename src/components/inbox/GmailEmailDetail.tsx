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
import { downloadEmailAttachment, getAttachmentName, getAttachmentUrl } from "./attachment-download";

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
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-24 h-24 rounded-2xl bg-muted/15 flex items-center justify-center mb-5">
          <svg className="w-12 h-12 text-muted-foreground/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="M22 7l-10 6L2 7" />
          </svg>
        </div>
        <p className="text-lg font-medium text-foreground/70 mb-1">Selectează un email</p>
        <p className="text-sm text-muted-foreground/40">Alege un mesaj din listă</p>
      </div>
    );
  }

  const extractEmail = (sender: string) => {
    const match = sender.match(/<([^>]+)>/);
    return match ? match[1] : sender;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return ImageIcon;
    if (['pdf'].includes(ext || '')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-10 border-b border-border/10 flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted/50">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Înapoi</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-4 w-px bg-border/20 mx-0.5" />

          {isTrashView && onRestore ? (
            <ToolbarBtn icon={RotateCcw} tooltip="Restaurează" onClick={onRestore} />
          ) : (
            <ToolbarBtn icon={Archive} tooltip={isArchived ? "Dezarhivează" : "Arhivează"} onClick={isArchived ? onUnarchive! : onArchive} />
          )}
          <ToolbarBtn icon={Trash2} tooltip={isTrashView ? "Șterge definitiv" : "Șterge"} onClick={onDelete} destructive />
        </div>

        <div className="flex items-center gap-0.5">
          <ToolbarBtn icon={Printer} tooltip="Printează" onClick={() => {}} />
          <ToolbarBtn icon={ExternalLink} tooltip="Deschide separat" onClick={() => {}} />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* Subject */}
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-xl font-semibold text-foreground pr-4 leading-snug">
              {email.subject || '(Fără subiect)'}
            </h1>
            <button onClick={onToggleStar} className="shrink-0 p-1.5 rounded-lg hover:bg-muted/40 transition-colors">
              <Star className={cn(
                "h-5 w-5 transition-colors",
                email.is_starred ? "fill-gold text-gold" : "text-muted-foreground/30 hover:text-gold"
              )} />
            </button>
          </div>

          {/* Sender info */}
          <div className="flex items-start gap-3 mb-6 p-3 rounded-xl bg-muted/10 border border-border/8">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-primary/60 to-primary text-primary-foreground text-xs font-semibold">
                {extractSenderInitials(email.sender)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-semibold text-sm text-foreground">
                  {extractSenderName(email.sender)}
                </span>
                <span className="text-xs text-muted-foreground/50">
                  &lt;{extractEmail(email.sender)}&gt;
                </span>
              </div>
              
              <Collapsible open={showEmailDetails} onOpenChange={setShowEmailDetails}>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">
                  <span>către {email.recipient ? extractEmail(email.recipient) : 'mine'}</span>
                  {showEmailDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <AnimatePresence>
                    {showEmailDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="mt-2 p-2.5 rounded-lg bg-background/60 border border-border/15 space-y-1.5 text-xs"
                      >
                        <DetailRow label="de la" value={email.sender} />
                        <DetailRow label="către" value={email.recipient || 'contact@mvaimobiliare.ro'} />
                        {email.cc && <DetailRow label="cc" value={email.cc} />}
                        {email.bcc && <DetailRow label="bcc" value={email.bcc} />}
                        <DetailRow label="dată" value={format(new Date(email.received_at), "EEEE, d MMMM yyyy 'la' HH:mm", { locale: ro })} />
                        <DetailRow label="subiect" value={email.subject || '(Fără subiect)'} />
                        {email.message_id && (
                          <DetailRow label="id" value={email.message_id.replace(/<|>/g, '')} mono />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground/50 tabular-nums">
                {format(new Date(email.received_at), "d MMM, HH:mm", { locale: ro })}
              </span>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onReply} className="h-8 w-8 rounded-lg hover:bg-primary/10">
                      <Reply className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Răspunde</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/50">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 bg-popover border-border/40 rounded-lg">
                  <DropdownMenuItem onClick={onReply} className="text-sm">
                    <Reply className="h-4 w-4 mr-2" /> Răspunde
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onForward} className="text-sm">
                    <Forward className="h-4 w-4 mr-2" /> Redirecționează
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-sm text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Șterge
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Body */}
          <div className="mb-8">
            {email.body_html ? (
              <div 
                className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: email.body_html }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm text-foreground/85 leading-relaxed">
                {email.body_plain || email.stripped_text || 'Nu există conținut'}
              </div>
            )}
          </div>

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="border-t border-border/10 pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-xs font-medium text-muted-foreground/70">
                  {email.attachments.length} atașament{email.attachments.length > 1 ? 'e' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      className="flex items-center gap-3 p-3 bg-muted/10 border border-border/10 rounded-lg hover:bg-muted/25 transition-colors group"
                    >
                      <div className="p-2 bg-background rounded-md">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                          {attachmentName}
                        </p>
                        {attachment.size && (
                          <p className="text-[10px] text-muted-foreground/50">{formatFileSize(attachment.size)}</p>
                        )}
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reply prompt */}
          <div className="mt-8 p-3.5 border border-border/10 rounded-lg bg-muted/8 hover:bg-muted/15 transition-colors cursor-pointer" onClick={onReply}>
            <p className="text-sm text-muted-foreground/40">Click aici pentru a răspunde...</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-5">
            <Button variant="outline" onClick={onReply} className="gap-1.5 rounded-lg px-4 h-9 text-sm border-border/20 hover:bg-primary/8 hover:text-primary hover:border-primary/20">
              <Reply className="h-3.5 w-3.5" /> Răspunde
            </Button>
            <Button variant="outline" onClick={onForward} className="gap-1.5 rounded-lg px-4 h-9 text-sm border-border/20 hover:bg-primary/8 hover:text-primary hover:border-primary/20">
              <Forward className="h-3.5 w-3.5" /> Redirecționează
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

// Helper components
const ToolbarBtn = ({ icon: Icon, tooltip, onClick, destructive }: {
  icon: any; tooltip: string; onClick: () => void; destructive?: boolean;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={onClick} className={cn(
          "h-8 w-8 rounded-lg transition-colors",
          destructive ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted/50"
        )}>
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const DetailRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="grid grid-cols-[60px_1fr] gap-1.5">
    <span className="text-muted-foreground/60">{label}:</span>
    <span className={cn("text-foreground/80 break-all", mono && "font-mono text-[10px] text-foreground/50")}>{value}</span>
  </div>
);
