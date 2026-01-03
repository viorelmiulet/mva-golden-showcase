import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Heart, Search, Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface MobileOnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Home,
    titleRo: "Bine ai venit la MVA",
    titleEn: "Welcome to MVA",
    descriptionRo: "Descoperă cele mai bune proprietăți și complexe rezidențiale din Cluj-Napoca",
    descriptionEn: "Discover the best properties and residential complexes in Cluj-Napoca",
    color: "from-primary/20 to-primary/5",
  },
  {
    icon: Search,
    titleRo: "Caută Simplu",
    titleEn: "Search Easily",
    descriptionRo: "Filtrează după preț, camere și tip de tranzacție pentru a găsi exact ce cauți",
    descriptionEn: "Filter by price, rooms and transaction type to find exactly what you're looking for",
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    icon: Heart,
    titleRo: "Salvează Favoritele",
    titleEn: "Save Favorites",
    descriptionRo: "Marchează proprietățile preferate și revino oricând să le revezi",
    descriptionEn: "Mark your favorite properties and come back anytime to review them",
    color: "from-red-500/20 to-red-500/5",
  },
  {
    icon: Bell,
    titleRo: "Fii Primul",
    titleEn: "Be First",
    descriptionRo: "Primește notificări când apar proprietăți noi care se potrivesc criteriilor tale",
    descriptionEn: "Get notifications when new properties matching your criteria appear",
    color: "from-amber-500/20 to-amber-500/5",
  },
];

const MobileOnboarding = ({ onComplete }: MobileOnboardingProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { language } = useLanguage();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;
  const isLast = currentSlide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-muted-foreground"
        >
          {language === "ro" ? "Sări" : "Skip"}
        </Button>
      </div>

      {/* Slides */}
      <div className="flex-1 flex items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon */}
            <div className={`w-32 h-32 rounded-full bg-gradient-to-b ${slide.color} flex items-center justify-center mb-8`}>
              <Icon className="w-16 h-16 text-primary" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {language === "ro" ? slide.titleRo : slide.titleEn}
            </h1>

            {/* Description */}
            <p className="text-muted-foreground text-base leading-relaxed max-w-xs">
              {language === "ro" ? slide.descriptionRo : slide.descriptionEn}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="px-8 pb-12 space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Next button */}
        <Button
          onClick={handleNext}
          className="w-full h-14 text-base font-medium"
          size="lg"
        >
          {isLast
            ? language === "ro"
              ? "Începe"
              : "Get Started"
            : language === "ro"
            ? "Continuă"
            : "Continue"}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default MobileOnboarding;
