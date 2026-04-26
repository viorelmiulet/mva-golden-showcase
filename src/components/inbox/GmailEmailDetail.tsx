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
  File,
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
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border border-border/20 bg-muted/15">
          <svg className="h-12 w-12 text-muted-foreground/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="M22 7l-10 6L2 7" />
          </svg>
        </div>
        <p className="mb-1 text-lg font-medium text-foreground/70">Selectează un email</p>
        <p className="text-sm text-muted-foreground/50">Alege un mesaj din listă</p>
      </div>
    );
  }

  const extractEmail = (sender: string) => {
    const match = sender.match(/<([^>]+)>/);
    return match ? match[1] : sender;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return ImageIcon;
    if (["pdf"].includes(ext || "")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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

          <div className="mx-1 h-4 w-px bg-border/30" />

          {isTrashView && onRestore ? (
            <ToolbarBtn icon={RotateCcw} tooltip="Restaurează" onClick={onRestore} />
          ) : (
            <ToolbarBtn icon={Archive} tooltip={isArchived ? "Dezarhivează" : "Arhivează"} onClick={isArchived ? onUnarchive! : onArchive} />
          )}
          <ToolbarBtn icon={Trash2} tooltip={isTrashView ? "Șterge definitiv" : "Șterge"} onClick={onDelete} destructive />
        </div>

        <div className="flex items-center gap-1">
          <ToolbarBtn icon={Printer} tooltip="Printează" onClick={() => {}} />
          <ToolbarBtn icon={ExternalLink} tooltip="Deschide separat" onClick={() => {}} />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="mb-6 flex items-start justify-between gap-4 rounded-3xl border border-border/20 bg-muted/15 p-6">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full border border-border/30 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Mesaj
                </span>
                {isArchived && (
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">Arhivat</span>
                )}
              </div>
              <h1 className="pr-4 text-2xl font-semibold leading-snug text-foreground">
                {email.subject || '(Fără subiect)'}
              </h1>
            </div>

            <button onClick={onToggleStar} className="shrink-0 rounded-2xl border border-border/30 bg-background p-3 transition-colors hover:bg-muted">
              <Star className={cn(
                "h-5 w-5 transition-colors",
                email.is_starred ? "fill-primary text-primary" : "text-muted-foreground/40 hover:text-primary",
              )} />
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border/20 bg-background shadow-sm">
            <div className="border-b border-border/15 px-6 py-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                    {extractSenderInitials(email.sender)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-foreground">
                      {extractSenderName(email.sender)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      &lt;{extractEmail(email.sender)}&gt;
                    </span>
                  </div>

                  <Collapsible open={showEmailDetails} onOpenChange={setShowEmailDetails}>
                    <CollapsibleTrigger className="mt-1 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
                      <span>către {email.recipient ? extractEmail(email.recipient) : 'mine'}</span>
                      {showEmailDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <AnimatePresence>
                        {showEmailDetails && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="mt-3 space-y-1.5 rounded-2xl border border-border/20 bg-muted/15 p-4 text-xs"
                          >
                            <DetailRow label="de la" value={email.sender} />
                            <DetailRow label="către" value={email.recipient || 'contact@mvaimobiliare.ro'} />
                            {email.cc && <DetailRow label="cc" value={email.cc} />}
                            {email.bcc && <DetailRow label="bcc" value={email.bcc} />}
                            <DetailRow label="dată" value={format(new Date(email.received_at), "EEEE, d MMMM yyyy 'la' HH:mm", { locale: ro })} />
                            <DetailRow label="subiect" value={email.subject || '(Fără subiect)'} />
                            {email.message_id && <DetailRow label="id" value={email.message_id.replace(/<|>/g, '')} mono />}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <span className="mr-2 text-xs tabular-nums text-muted-foreground">
                    {format(new Date(email.received_at), "d MMM, HH:mm", { locale: ro })}
                  </span>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onReply} className="h-9 w-9 rounded-xl hover:bg-muted">
                          <Reply className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Răspunde</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/40 bg-popover">
                      <DropdownMenuItem onClick={onReply} className="text-sm">
                        <Reply className="mr-2 h-4 w-4" /> Răspunde
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onForward} className="text-sm">
                        <Forward className="mr-2 h-4 w-4" /> Redirecționează
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onDelete} className="text-sm text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Șterge
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="overflow-hidden bg-email-preview-background px-6 py-6 text-email-preview-foreground">
              {email.body_html ? (
                <div
                  className="prose prose-sm max-w-none overflow-x-auto break-words prose-p:my-2 prose-p:text-email-preview-foreground prose-headings:text-email-preview-foreground prose-strong:text-email-preview-foreground prose-li:text-email-preview-foreground prose-a:text-email-preview-link prose-a:no-underline hover:prose-a:underline [&_*]:!text-email-preview-foreground [&_a]:!text-email-preview-link [&_img]:max-w-full [&_img]:h-auto [&_table]:max-w-full [&_table]:table-auto [&_table]:w-full [&_td]:break-words [&_th]:break-words [&_iframe]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: email.body_html }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-email-preview-foreground">
                  {email.body_plain || email.stripped_text || 'Nu există conținut'}
                </div>
              )}
            </div>

            {email.attachments && email.attachments.length > 0 && (
              <div className="border-t border-border/15 px-6 py-5">
                <div className="mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground/60" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {email.attachments.length} atașament{email.attachments.length > 1 ? 'e' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                        className="group flex items-center gap-3 rounded-2xl border border-border/20 bg-muted/10 p-3 text-left transition-colors hover:bg-muted/30"
                      >
                        <div className="rounded-xl bg-background p-2.5">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium transition-colors group-hover:text-primary">
                            {attachmentName}
                          </p>
                          {attachment.size && (
                            <p className="text-[10px] text-muted-foreground/60">{formatFileSize(attachment.size)}</p>
                          )}
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-border/15 px-6 py-5">
              <div className="rounded-2xl border border-border/20 bg-muted/10 p-4 transition-colors hover:bg-muted/20" onClick={onReply}>
                <p className="text-sm text-muted-foreground">Click aici pentru a răspunde...</p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button variant="default" onClick={onReply} className="h-10 rounded-xl px-5 text-sm">
                  <Reply className="h-4 w-4" /> Răspunde
                </Button>
                <Button variant="outline" onClick={onForward} className="h-10 rounded-xl border-border/30 px-5 text-sm hover:bg-muted">
                  <Forward className="h-4 w-4" /> Redirecționează
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

const ToolbarBtn = ({ icon: Icon, tooltip, onClick, destructive }: {
  icon: any; tooltip: string; onClick: () => void; destructive?: boolean;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn(
            "h-9 w-9 rounded-xl transition-colors",
            destructive ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted",
          )}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const DetailRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="grid grid-cols-[60px_1fr] gap-1.5">
    <span className="text-muted-foreground/70">{label}:</span>
    <span className={cn("break-all text-foreground/80", mono && "font-mono text-[10px] text-muted-foreground")}>{value}</span>
  </div>
);
