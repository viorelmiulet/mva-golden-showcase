import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Calculate opacity based on scroll position (fade out over first 15% of viewport)
      const fadeThreshold = windowHeight * 0.15;
      const newOpacity = Math.max(0, 1 - (scrollTop / fadeThreshold));
      setOpacity(newOpacity);
      
      // Hide completely after threshold
      if (scrollTop > fadeThreshold) {
        setIsVisible(false);
      } else {
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

  if (!isVisible) return null;

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
