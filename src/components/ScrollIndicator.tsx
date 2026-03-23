import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const ScrollIndicator = () => {
  const [canScroll, setCanScroll] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    let ticking = false;

    const updateScrollability = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      setCanScroll(documentHeight > windowHeight * 1.5);
    };

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const fadeThreshold = window.innerHeight * 0.15;
        setOpacity(Math.max(0, 1 - scrollTop / fadeThreshold));
        ticking = false;
      });
    };

    const handleResize = () => {
      updateScrollability();
      const scrollTop = window.scrollY;
      const fadeThreshold = windowHeight * 0.15;
      setOpacity(Math.max(0, 1 - scrollTop / fadeThreshold));
    };

    updateScrollability();
    handleScroll();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const scrollDown = () => {
    window.scrollBy({
      top: window.innerHeight * 0.8,
      behavior: "smooth"
    });
  };

  if (!canScroll || opacity <= 0.02) return null;

  return (
    <button
      onClick={scrollDown}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 lg:hidden animate-fade-in touch-manipulation transition-opacity duration-150"
      style={{ opacity }}
      aria-label="Scroll pentru mai mult conținut"
    >
      <div className="animate-bounce">
        <ChevronDown className="w-6 h-6 text-gold/70" />
      </div>
    </button>
  );
};

export default ScrollIndicator;
