import { motion } from "framer-motion";
import { Star, StarOff, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface Email {
  id: string;
  sender: string;
  subject: string | null;
  is_read: boolean;
  is_starred: boolean;
  attachments: any[];
  received_at: string;
}

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
  extractSenderName: (sender: string) => string;
  extractSenderInitials: (sender: string) => string;
  formatEmailDate: (date: string) => string;
}

export const EmailListItem = ({
  email,
  isSelected,
  onSelect,
  onToggleStar,
  extractSenderName,
  extractSenderInitials,
  formatEmailDate,
}: EmailListItemProps) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
      }}
      onClick={onSelect}
      className={cn(
        "p-3 cursor-pointer transition-all relative group",
        isSelected 
          ? "bg-gradient-to-r from-gold/10 to-transparent" 
          : "hover:bg-white/[0.03]",
        !email.is_read && "bg-white/[0.02]"
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gold" />
      )}
      
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
          !email.is_read 
            ? "bg-gradient-to-br from-gold/30 to-gold/10 text-gold" 
            : "bg-white/10 text-muted-foreground"
        )}>
          {extractSenderInitials(email.sender)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "font-medium text-sm truncate",
              !email.is_read ? "text-foreground" : "text-muted-foreground"
            )}>
              {extractSenderName(email.sender)}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatEmailDate(email.received_at)}
            </span>
          </div>
          
          <p className={cn(
            "text-sm truncate mt-0.5",
            !email.is_read ? "text-foreground/80 font-medium" : "text-muted-foreground"
          )}>
            {email.subject || '(Fără subiect)'}
          </p>
          
          <div className="flex items-center gap-2 mt-1.5">
            {!email.is_read && (
              <div className="w-2 h-2 rounded-full bg-gold" />
            )}
            {email.is_starred && (
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            )}
            {email.attachments && email.attachments.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" />
                {email.attachments.length}
              </span>
            )}
          </div>
        </div>
        
        {/* Quick star action */}
        <button
          onClick={onToggleStar}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg"
        >
          {email.is_starred ? (
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          ) : (
            <StarOff className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </motion.div>
  );
};
