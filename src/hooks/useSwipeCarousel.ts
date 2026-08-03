import { useEffect, useRef, useState } from "react";

export interface SwipeCarouselOptions {
  onNext: () => void;
  onPrev: () => void;
  /** Optional: triggered by a downward swipe (used by the lightbox). */
  onDismiss?: () => void;
  /** Fraction of the element width required to commit a swipe. */
  threshold?: number;
  enabled?: boolean;
}

export interface SwipeCarouselState {
  /** Horizontal offset in px while the finger is down. */
  dx: number;
  /** Vertical offset in px (only when a dismiss gesture is allowed). */
  dy: number;
  /** True while a horizontal (or dismiss) gesture is being tracked. */
  dragging: boolean;
}

const AXIS_SLOP = 10; // px before the direction is decided
const FLICK_VELOCITY = 0.5; // px per ms

/**
 * Touch-only swipe tracking for a carousel.
 * - Direction is locked after ~10px: horizontal gestures preventDefault (no page
 *   scroll), vertical gestures are ignored so the page scrolls normally.
 * - Nothing is blocked before the axis is known.
 */
export function useSwipeCarousel<T extends HTMLElement>({
  onNext,
  onPrev,
  onDismiss,
  threshold = 0.25,
  enabled = true,
}: SwipeCarouselOptions) {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState<SwipeCarouselState>({ dx: 0, dy: 0, dragging: false });
  const cb = useRef({ onNext, onPrev, onDismiss, threshold });
  cb.current = { onNext, onPrev, onDismiss, threshold };

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let axis: "none" | "x" | "y" = "none";
    let active = false;

    const reset = () => {
      active = false;
      axis = "none";
      setState({ dx: 0, dy: 0, dragging: false });
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      active = true;
      axis = "none";
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = Date.now();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      if (axis === "none") {
        if (Math.abs(dx) < AXIS_SLOP && Math.abs(dy) < AXIS_SLOP) return;
        const horizontal = Math.abs(dx) > Math.abs(dy);
        if (horizontal) axis = "x";
        else if (cb.current.onDismiss && dy > 0) axis = "x"; // swipe-down to dismiss
        else {
          axis = "y";
          active = false;
          setState({ dx: 0, dy: 0, dragging: false });
          return;
        }
      }

      if (axis !== "x") return;
      // Direction is locked to the gesture: stop the page from scrolling.
      if (e.cancelable) e.preventDefault();
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      setState({
        dx: horizontal ? dx : 0,
        dy: !horizontal && cb.current.onDismiss ? Math.max(0, dy) : 0,
        dragging: true,
      });
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active) return reset();
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Math.max(1, Date.now() - startT);
      const width = el.clientWidth || 1;
      const horizontal = Math.abs(dx) >= Math.abs(dy);

      if (!horizontal && cb.current.onDismiss) {
        if (dy > 90 || dy / dt > FLICK_VELOCITY) {
          reset();
          cb.current.onDismiss();
          return;
        }
      } else {
        const passed = Math.abs(dx) > width * cb.current.threshold;
        const flick = Math.abs(dx) / dt > FLICK_VELOCITY && Math.abs(dx) > 30;
        if (passed || flick) {
          if (dx < 0) cb.current.onNext();
          else cb.current.onPrev();
        }
      }
      reset();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", reset, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", reset);
    };
  }, [enabled]);

  return { ref, ...state };
}

/** True when the user asked for reduced motion. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
