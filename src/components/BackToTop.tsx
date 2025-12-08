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
      className="fixed bottom-20 right-4 z-40 lg:bottom-8 flex items-center justify-center w-11 h-11 bg-gold/90 hover:bg-gold text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 touch-manipulation animate-fade-in"
      aria-label="Înapoi sus"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default BackToTop;
