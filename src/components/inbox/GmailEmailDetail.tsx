import { motion } from "framer-motion";
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

interface Email {
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
  if (!email) {
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

      {/* Email Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6">
          {/* Subject */}
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-2xl font-normal text-foreground pr-4">
              {email.subject || '(Fără subiect)'}
            </h1>
            <button onClick={onToggleStar} className="shrink-0 p-1">
              <Star 
                className={cn(
                  "h-6 w-6 transition-colors",
                  email.is_starred 
                    ? "fill-gold text-gold"
                    : "text-muted-foreground hover:text-gold"
                )} 
              />
            </button>
          </div>

          {/* Sender info */}
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                {extractSenderInitials(email.sender)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">
                  {extractSenderName(email.sender)}
                </span>
                <span className="text-sm text-muted-foreground">
                  &lt;{extractEmail(email.sender)}&gt;
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>către mine</span>
                <button className="hover:text-foreground">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-muted-foreground">
                {format(new Date(email.received_at), "d MMM yyyy, HH:mm", { locale: ro })}
              </span>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onReply}
                      className="h-9 w-9"
                    >
                      <Reply className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Răspunde</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onReply}>
                    <Reply className="h-4 w-4 mr-2" />
                    Răspunde
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onForward}>
                    <Forward className="h-4 w-4 mr-2" />
                    Redirecționează
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Șterge
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Email body */}
          <div className="mb-8">
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
          </div>

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="border-t border-border/30 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {email.attachments.length} atașament{email.attachments.length > 1 ? 'e' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {email.attachments.map((attachment, idx) => {
                  const FileIcon = getFileIcon(attachment.filename || attachment.name);
                  return (
                    <a
                      key={idx}
                      href={attachment.url}
                      download={attachment.filename || attachment.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[150px]">
                          {attachment.filename || attachment.name}
                        </p>
                        {attachment.size && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </p>
                        )}
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reply box */}
          <div className="mt-8 border border-border/50 rounded-2xl p-4">
            <button 
              onClick={onReply}
              className="w-full text-left text-muted-foreground hover:text-foreground transition-colors"
            >
              Click aici pentru a răspunde...
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onReply}
              className="gap-2"
            >
              <Reply className="h-4 w-4" />
              Răspunde
            </Button>
            <Button
              variant="outline"
              onClick={onForward}
              className="gap-2"
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
