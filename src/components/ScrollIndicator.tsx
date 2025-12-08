import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasScrolledPast, setHasScrolledPast] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Hide if scrolled past 20% of the page or near the bottom
      if (scrollTop > windowHeight * 0.2) {
        setHasScrolledPast(true);
        setIsVisible(false);
      } else {
        setHasScrolledPast(false);
        // Only show if page is longer than viewport
        setIsVisible(documentHeight > windowHeight * 1.5);
      }
    };

    // Initial check
    handleScroll();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollDown = () => {
    window.scrollBy({
      top: window.innerHeight * 0.8,
      behavior: "smooth"
    });
  };

  if (!isVisible || hasScrolledPast) return null;

  return (
    <button
      onClick={scrollDown}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 lg:hidden flex flex-col items-center gap-1 text-muted-foreground animate-fade-in touch-manipulation"
      aria-label="Scroll pentru mai mult conținut"
    >
      <span className="text-[10px] font-medium bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border/50 shadow-sm">
        Scroll pentru mai mult
      </span>
      <div className="animate-bounce">
        <ChevronDown className="w-5 h-5 text-gold" />
      </div>
    </button>
  );
};

export default ScrollIndicator;
