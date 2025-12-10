import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-36 right-4 z-40 lg:bottom-24 flex items-center justify-center w-11 h-11 bg-background/80 hover:bg-background text-foreground border border-border/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 touch-manipulation animate-fade-in backdrop-blur-sm"
      aria-label="Înapoi sus"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default BackToTop;
