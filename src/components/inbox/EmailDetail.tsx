import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { 
  Mail, 
  Star, 
  StarOff, 
  Trash2, 
  Archive, 
  ArchiveRestore,
  ArrowLeft,
  Paperclip,
  Reply,
  Forward,
  Download,
  MoreVertical,
  Clock,
  FileText,
  Image as ImageIcon,
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Email {
  id: string;
  sender: string;
  subject: string | null;
  body_html: string | null;
  body_plain: string | null;
  stripped_text: string | null;
  is_read: boolean;
  is_starred: boolean;
  attachments: any[];
  received_at: string;
  message_id: string | null;
}

interface EmailDetailProps {
  email: Email | null;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onToggleStar: () => void;
  onArchive: () => void;
  onUnarchive?: () => void;
  onDelete: () => void;
  isArchived?: boolean;
  extractSenderName: (sender: string) => string;
  extractSenderInitials: (sender: string) => string;
}

// Helper to get file icon based on extension
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return ImageIcon;
  }
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
    return FileText;
  }
  return File;
};

// Helper to format file size
const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const EmailDetail = ({
  email,
  onClose,
  onReply,
  onForward,
  onToggleStar,
  onArchive,
  onUnarchive,
  onDelete,
  isArchived = false,
  extractSenderName,
  extractSenderInitials,
}: EmailDetailProps) => {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20 rounded-2xl overflow-hidden border border-white/5">
      <AnimatePresence mode="wait">
        {email ? (
          <motion.div
            key={email.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col h-full"
          >
            {/* Floating Header Bar */}
            <motion.header 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-white/5"
            >
              <div className="flex items-center justify-between px-4 py-3">
                {/* Left: Back + Actions */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose}
                    className="h-9 w-9 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  
                  <div className="hidden sm:flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onToggleStar}
                      className={cn(
                        "h-9 w-9 rounded-xl transition-all duration-200",
                        email.is_starred 
                          ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10" 
                          : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                      )}
                    >
                      {email.is_starred ? (
                        <Star className="h-5 w-5 fill-current" />
                      ) : (
                        <Star className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={isArchived ? onUnarchive : onArchive}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                    >
                      {isArchived ? (
                        <ArchiveRestore className="h-5 w-5" />
                      ) : (
                        <Archive className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDelete}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Right: Primary Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={onReply}
                    size="sm"
                    className="h-9 px-4 rounded-xl bg-gradient-to-r from-gold to-gold-light text-black font-medium shadow-lg shadow-gold/20 hover:shadow-gold/30 hover:scale-[1.02] transition-all duration-200"
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Răspunde</span>
                  </Button>
                  
                  <Button
                    onClick={onForward}
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200"
                  >
                    <Forward className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Redirecționează</span>
                  </Button>
                  
                  {/* Mobile Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl sm:hidden hover:bg-white/10"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-48 bg-card/95 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl"
                    >
                      <DropdownMenuItem onClick={onToggleStar} className="rounded-lg">
                        {email.is_starred ? (
                          <>
                            <StarOff className="h-4 w-4 mr-2 text-amber-400" />
                            Elimină steaua
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Marchează cu stea
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={isArchived ? onUnarchive : onArchive}
                        className="rounded-lg"
                      >
                        {isArchived ? (
                          <>
                            <ArchiveRestore className="h-4 w-4 mr-2" />
                            Restaurează
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4 mr-2" />
                            Arhivează
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem 
                        onClick={onDelete}
                        className="rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Șterge
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.header>

            {/* Email Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 sm:p-6 space-y-6">
                {/* Subject */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground leading-tight">
                    {email.subject || '(Fără subiect)'}
                  </h1>
                </motion.div>

                {/* Sender Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-gold/30 via-gold/20 to-gold/10 flex items-center justify-center shadow-lg shadow-gold/10">
                      <span className="text-gold font-bold text-lg sm:text-xl">
                        {extractSenderInitials(email.sender)}
                      </span>
                    </div>
                    {email.is_starred && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/30">
                        <Star className="h-3 w-3 text-black fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Sender Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {extractSenderName(email.sender)}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {email.sender}
                        </p>
                      </div>
                    </div>
                    
                    {/* Time Badge */}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <time dateTime={email.received_at}>
                        {format(new Date(email.received_at), "EEEE, d MMMM yyyy 'la' HH:mm", { locale: ro })}
                      </time>
                    </div>
                  </div>
                </motion.div>

                {/* Attachments */}
                {email.attachments && email.attachments.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Paperclip className="h-4 w-4" />
                      <span>{email.attachments.length} atașament{email.attachments.length !== 1 ? 'e' : ''}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {email.attachments.map((att: any, idx: number) => {
                        const FileIcon = getFileIcon(att.name || 'file');
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + idx * 0.05 }}
                          >
                            {att.url ? (
                              <a 
                                href={att.url} 
                                download={att.name}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/5 hover:border-gold/30 hover:bg-gold/5 transition-all duration-200"
                              >
                                <div className="shrink-0 w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                  <FileIcon className="h-5 w-5 text-gold" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-foreground">
                                    {att.name}
                                  </p>
                                  {att.size && (
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(att.size)}
                                    </p>
                                  )}
                                </div>
                                <Download className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
                              </a>
                            ) : (
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 opacity-50">
                                <div className="shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-muted-foreground">
                                    {att.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground/60">
                                    Nedisponibil
                                  </p>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Email Body */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 overflow-hidden"
                >
                  <div className="p-4 sm:p-6">
                    {email.body_html ? (
                      <div 
                        className="prose prose-sm sm:prose-base max-w-none 
                          dark:prose-invert 
                          prose-headings:text-foreground prose-headings:font-semibold
                          prose-p:text-foreground/80 prose-p:leading-relaxed
                          prose-a:text-gold prose-a:no-underline hover:prose-a:underline
                          prose-strong:text-foreground
                          prose-blockquote:border-l-gold prose-blockquote:text-muted-foreground
                          prose-code:text-gold prose-code:bg-gold/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                          prose-pre:bg-black/20 prose-pre:border prose-pre:border-white/10"
                        dangerouslySetInnerHTML={{ __html: email.body_html }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base text-foreground/80 leading-relaxed">
                        {email.body_plain || email.stripped_text || 'Nu există conținut'}
                      </pre>
                    )}
                  </div>
                </motion.div>

                {/* Bottom Action Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center justify-center gap-3 py-4"
                >
                  <Button
                    onClick={onReply}
                    className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-gradient-to-r from-gold to-gold-light text-black font-medium shadow-lg shadow-gold/20 hover:shadow-gold/30 hover:scale-[1.02] transition-all duration-200"
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Răspunde
                  </Button>
                  
                  <Button
                    onClick={onForward}
                    variant="outline"
                    className="flex-1 sm:flex-none h-11 px-6 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200"
                  >
                    <Forward className="h-4 w-4 mr-2" />
                    Redirecționează
                  </Button>
                </motion.div>
              </div>
            </ScrollArea>
          </motion.div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center p-8"
          >
            <div className="text-center max-w-xs">
              {/* Animated Icon */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="relative inline-block mb-6"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent rounded-3xl blur-2xl scale-150" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                  <Mail className="h-10 w-10 text-muted-foreground/40" />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Niciun email selectat
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Selectează un email din listă pentru a-l vizualiza aici
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
