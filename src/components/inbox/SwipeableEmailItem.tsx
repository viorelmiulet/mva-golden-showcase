import { useState, useRef, TouchEvent } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Trash2, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailListItem } from "./EmailListItem";

interface Email {
  id: string;
  sender: string;
  subject: string | null;
  is_read: boolean;
  is_starred: boolean;
  attachments: any[];
  received_at: string;
}

interface SwipeableEmailItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onArchive: () => void;
  extractSenderName: (sender: string) => string;
  extractSenderInitials: (sender: string) => string;
  formatEmailDate: (date: string) => string;
}

const SWIPE_THRESHOLD = 80;
const MAX_SWIPE = 120;

export const SwipeableEmailItem = ({
  email,
  isSelected,
  onSelect,
  onToggleStar,
  onDelete,
  onArchive,
  extractSenderName,
  extractSenderInitials,
  formatEmailDate,
}: SwipeableEmailItemProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isVerticalScrollRef = useRef(false);

  // Background colors based on swipe direction
  const leftBgOpacity = useTransform(x, [-MAX_SWIPE, 0], [1, 0]);
  const rightBgOpacity = useTransform(x, [0, MAX_SWIPE], [0, 1]);
  
  // Icon scale for feedback
  const deleteIconScale = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD/2, 0], [1.2, 0.8, 0.6]);
  const archiveIconScale = useTransform(x, [0, SWIPE_THRESHOLD/2, SWIPE_THRESHOLD], [0.6, 0.8, 1.2]);

  const handleTouchStart = (e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = false;
    isVerticalScrollRef.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startXRef.current;
    const deltaY = currentY - startYRef.current;

    // Detect if this is a vertical scroll first
    if (!isDraggingRef.current && !isVerticalScrollRef.current) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        isVerticalScrollRef.current = true;
        return;
      }
      if (Math.abs(deltaX) > 10) {
        isDraggingRef.current = true;
        setIsDragging(true);
      }
    }

    if (isVerticalScrollRef.current) return;

    if (isDraggingRef.current) {
      // Clamp the value
      const clampedX = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
      x.set(clampedX);
    }
  };

  const handleTouchEnd = () => {
    if (isVerticalScrollRef.current) {
      isVerticalScrollRef.current = false;
      return;
    }

    const currentX = x.get();
    
    if (currentX < -SWIPE_THRESHOLD) {
      // Swiped left - Delete
      animate(x, -MAX_SWIPE * 2, { duration: 0.2 }).then(() => {
        onDelete();
      });
    } else if (currentX > SWIPE_THRESHOLD) {
      // Swiped right - Archive
      animate(x, MAX_SWIPE * 2, { duration: 0.2 }).then(() => {
        onArchive();
      });
    } else {
      // Reset position
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
    
    setIsDragging(false);
    isDraggingRef.current = false;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete background (left swipe) */}
      <motion.div 
        className="absolute inset-0 bg-red-500/90 flex items-center justify-end pr-6"
        style={{ opacity: leftBgOpacity }}
      >
        <motion.div style={{ scale: deleteIconScale }}>
          <Trash2 className="h-6 w-6 text-white" />
        </motion.div>
      </motion.div>

      {/* Archive background (right swipe) */}
      <motion.div 
        className="absolute inset-0 bg-blue-500/90 flex items-center justify-start pl-6"
        style={{ opacity: rightBgOpacity }}
      >
        <motion.div style={{ scale: archiveIconScale }}>
          <Archive className="h-6 w-6 text-white" />
        </motion.div>
      </motion.div>

      {/* Email item */}
      <motion.div
        style={{ x }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "relative bg-background",
          isDragging && "cursor-grabbing"
        )}
      >
        <EmailListItem
          email={email}
          isSelected={isSelected}
          onSelect={onSelect}
          onToggleStar={onToggleStar}
          onDelete={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          extractSenderName={extractSenderName}
          extractSenderInitials={extractSenderInitials}
          formatEmailDate={formatEmailDate}
        />
      </motion.div>
    </div>
  );
};
