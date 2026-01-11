import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { 
  Mail, 
  Star, 
  StarOff, 
  Trash2, 
  Archive, 
  ChevronLeft,
  Paperclip,
  Reply,
  Download,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onToggleStar: () => void;
  onArchive: () => void;
  onDelete: () => void;
  extractSenderName: (sender: string) => string;
  extractSenderInitials: (sender: string) => string;
}

export const EmailDetail = ({
  email,
  onClose,
  onReply,
  onToggleStar,
  onArchive,
  onDelete,
  extractSenderName,
  extractSenderInitials,
}: EmailDetailProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden flex flex-col min-w-0"
    >
      <AnimatePresence mode="wait">
        {email ? (
          <motion.div
            key={email.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden shrink-0 h-8 w-8"
                    onClick={onClose}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center text-gold font-semibold shrink-0">
                    {extractSenderInitials(email.sender)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate text-lg">
                      {email.subject || '(Fără subiect)'}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {extractSenderName(email.sender)}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {format(new Date(email.received_at), 'EEEE, dd MMMM yyyy, HH:mm', { locale: ro })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    onClick={onReply}
                    className="bg-gradient-to-r from-gold to-gold-light text-black"
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Răspunde</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-white/10">
                      <DropdownMenuItem onClick={onToggleStar}>
                        {email.is_starred ? (
                          <>
                            <StarOff className="h-4 w-4 mr-2" />
                            Elimină steaua
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Adaugă stea
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onArchive}>
                        <Archive className="h-4 w-4 mr-2" />
                        Arhivează
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={onDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Șterge
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 flex-wrap">
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  {email.attachments.map((att: any, idx: number) => (
                    att.url ? (
                      <a 
                        key={idx} 
                        href={att.url} 
                        download={att.name}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg text-xs transition-colors border border-gold/20"
                      >
                        <Download className="h-3 w-3" />
                        {att.name}
                      </a>
                    ) : (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 text-muted-foreground rounded-lg text-xs">
                        {att.name} - nedisponibil
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Body */}
            <ScrollArea className="flex-1 p-4">
              {email.body_html ? (
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/80 prose-a:text-gold"
                  dangerouslySetInnerHTML={{ __html: email.body_html }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/80 leading-relaxed">
                  {email.body_plain || email.stripped_text || 'Nu există conținut'}
                </pre>
              )}
            </ScrollArea>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/30 to-gold/5 rounded-3xl blur-2xl" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mx-auto border border-white/10">
                  <Mail className="h-10 w-10 text-muted-foreground/30" />
                </div>
              </div>
              <p className="mt-4 font-medium text-muted-foreground">Selectează un email</p>
              <p className="text-sm text-muted-foreground/60">pentru a-l vizualiza</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
