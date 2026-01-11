import { motion } from "framer-motion";
import { Star, StarOff, Paperclip, Trash2, RotateCcw, Square, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface Email {
  id: string;
  sender: string;
  subject: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_deleted?: boolean;
  attachments: any[];
  received_at: string;
}

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onRestore?: (e: React.MouseEvent) => void;
  extractSenderName: (sender: string) => string;
  extractSenderInitials: (sender: string) => string;
  formatEmailDate: (date: string) => string;
  isTrashView?: boolean;
  // Multi-select props
  isMultiSelectMode?: boolean;
  isChecked?: boolean;
  onToggleCheck?: (e: React.MouseEvent) => void;
}

export const EmailListItem = ({
  email,
  isSelected,
  onSelect,
  onToggleStar,
  onDelete,
  onRestore,
  extractSenderName,
  extractSenderInitials,
  formatEmailDate,
  isTrashView = false,
  isMultiSelectMode = false,
  isChecked = false,
  onToggleCheck,
}: EmailListItemProps) => {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCheck?.(e);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
      }}
      onClick={isMultiSelectMode ? handleCheckboxClick : onSelect}
      className={cn(
        "p-2.5 md:p-3 cursor-pointer transition-all relative group active:bg-white/5",
        isSelected && !isMultiSelectMode
          ? "bg-gradient-to-r from-gold/10 to-transparent" 
          : "hover:bg-white/[0.03]",
        !email.is_read && "bg-gold/[0.04] border-l-2 border-gold",
        isChecked && "bg-gold/10"
      )}
    >
      {/* Selection indicator */}
      {isSelected && !isMultiSelectMode && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gold" />
      )}
      
      <div className="flex items-start gap-2.5 md:gap-3">
        {/* Checkbox or Avatar */}
        {isMultiSelectMode ? (
          <div 
            onClick={handleCheckboxClick}
            className={cn(
              "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer",
              isChecked 
                ? "bg-gold text-black" 
                : "bg-white/10 text-muted-foreground hover:bg-white/20"
            )}
          >
            {isChecked ? (
              <CheckSquare className="h-5 w-5" />
            ) : (
              <Square className="h-5 w-5" />
            )}
          </div>
        ) : (
          <div className={cn(
            "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold shrink-0",
            !email.is_read 
              ? "bg-gradient-to-br from-gold/30 to-gold/10 text-gold" 
              : "bg-white/10 text-muted-foreground"
          )}>
            {extractSenderInitials(email.sender)}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "font-medium text-xs md:text-sm truncate",
              !email.is_read ? "text-foreground" : "text-muted-foreground"
            )}>
              {extractSenderName(email.sender)}
            </span>
            <span className="text-[10px] md:text-xs text-muted-foreground shrink-0">
              {formatEmailDate(email.received_at)}
            </span>
          </div>
          
          <p className={cn(
            "text-xs md:text-sm truncate mt-0.5",
            !email.is_read ? "text-foreground/80 font-medium" : "text-muted-foreground"
          )}>
            {email.subject || '(Fără subiect)'}
          </p>
          
          <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-1.5">
            {!email.is_read && (
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gold" />
            )}
            {email.is_starred && (
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            )}
            {email.attachments && email.attachments.length > 0 && (
              <span className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs text-muted-foreground">
                <Paperclip className="h-2.5 w-2.5 md:h-3 md:w-3" />
                {email.attachments.length}
              </span>
            )}
          </div>
        </div>
        
        {/* Quick actions - hidden in multi-select mode */}
        {!isMultiSelectMode && (
          <div className="flex items-center gap-0.5 shrink-0">
            {isTrashView && onRestore && (
              <button
                onClick={onRestore}
                className="p-1 md:p-1.5 hover:bg-green-500/20 rounded-lg transition-colors"
                title="Restaurează"
              >
                <RotateCcw className="h-4 w-4 text-muted-foreground hover:text-green-400" />
              </button>
            )}
            <button
              onClick={onDelete}
              className="p-1 md:p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
              title={isTrashView ? "Șterge definitiv" : "Șterge"}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-400" />
            </button>
            {!isTrashView && (
              <button
                onClick={onToggleStar}
                className="p-1 md:p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title={email.is_starred ? "Elimină steluța" : "Adaugă steluță"}
              >
                {email.is_starred ? (
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                ) : (
                  <StarOff className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};