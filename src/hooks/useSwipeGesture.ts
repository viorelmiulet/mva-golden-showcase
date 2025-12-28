import { useState, useCallback, TouchEvent } from "react";

interface SwipeConfig {
  minSwipeDistance?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const useSwipeGesture = ({
  minSwipeDistance = 50,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
}: SwipeConfig = {}) => {
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  const onTouchStart = useCallback((e: TouchEvent) => {
    setTouchState({
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      endX: e.touches[0].clientX,
      endY: e.touches[0].clientY,
    });
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    setTouchState((prev) => ({
      ...prev,
      endX: e.touches[0].clientX,
      endY: e.touches[0].clientY,
    }));
  }, []);

  const onTouchEnd = useCallback(() => {
    const { startX, startY, endX, endY } = touchState;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Only trigger if swipe distance is met
    if (absDeltaX < minSwipeDistance && absDeltaY < minSwipeDistance) {
      return;
    }

    // Determine horizontal vs vertical swipe
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
  }, [touchState, minSwipeDistance, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    touchState,
  };
};
