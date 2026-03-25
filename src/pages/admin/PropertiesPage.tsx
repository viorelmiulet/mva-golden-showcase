import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Upload, Check, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, PanInfo, useReducedMotion } from "framer-motion";
import { AnimatedSkeleton } from "@/components/ui/skeleton";

// Lazy load the pages
const PropertiesAdmin = lazy(() => import("./PropertiesAdmin"));
const XmlImportPage = lazy(() => import("./XmlImportPage"));
const ImmofluxPropertiesAdmin = lazy(() => import("./ImmofluxPropertiesAdmin"));

type SectionType = "selection" | "proprietati" | "import-xml" | "immoflux";

const sectionTypes = [
  {
    id: "proprietati" as const,
    title: "Gestionare Proprietăți",
    shortTitle: "Proprietăți",
    description: "Adaugă, editează și gestionează proprietățile din catalog",
    icon: Home,
    features: [
      "Adăugare rapidă via ID",
      "Editare detalii",
      "Gestionare imagini",
      "Ștergere în masă",
    ],
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    id: "import-xml" as const,
    title: "Import XML",
    shortTitle: "Import XML",
    description: "Importă proprietăți din feed-uri XML externe",
    icon: Upload,
    features: [
      "Feed-uri XML",
      "Mapare câmpuri",
      "Import automat",
      "Surse multiple",
    ],
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    id: "immoflux" as const,
    title: "Proprietăți IMMOFLUX",
    shortTitle: "IMMOFLUX",
    description: "Vizualizează proprietățile sincronizate din IMMOFLUX CRM",
    icon: Building2,
    features: [
      "Sincronizare CRM",
      "Proprietăți live",
      "Paginare automată",
      "Link-uri directe",
    ],
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
];

const PropertiesPage = () => {
  const [selectedSection, setSelectedSection] = useState<SectionType>("selection");
  const [mobileCardIndex, setMobileCardIndex] = useState(0);
  const [[page, direction], setPage] = useState([0, 0]);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  
  const shouldAnimate = !isMobile && !prefersReducedMotion;

  const cardVariants = shouldAnimate ? {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
  } : {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const cardTransition = shouldAnimate ? {
    x: { type: "tween" as const, duration: 0.2 },
    opacity: { duration: 0.15 },
    scale: { duration: 0.15 },
  } : {
    opacity: { duration: 0.1 },
  };

  const paginate = (newDirection: number) => {
    const newIndex = mobileCardIndex + newDirection;
    if (newIndex >= 0 && newIndex < sectionTypes.length) {
      setPage([newIndex, newDirection]);
      setMobileCardIndex(newIndex);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset < -threshold || velocity < -500) {
      paginate(1);
    } else if (offset > threshold || velocity > 500) {
      paginate(-1);
    }
  };

  const goToIndex = (index: number) => {
    const direction = index > mobileCardIndex ? 1 : -1;
    setPage([index, direction]);
    setMobileCardIndex(index);
  };

  const currentSection = sectionTypes[mobileCardIndex];

  if (selectedSection !== "selection") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedSection("selection")}
          className="mb-2 hover:bg-gold/10 hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Înapoi la selecție
        </Button>
        
        <Suspense
          fallback={
            <motion.div 
              className="space-y-6 py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <AnimatedSkeleton className="h-4 w-24" />
                    <AnimatedSkeleton className="h-10 w-full rounded-md" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          }
        >
          {selectedSection === "proprietati" && <PropertiesAdmin />}
          {selectedSection === "import-xml" && <XmlImportPage />}
          {selectedSection === "immoflux" && <ImmofluxPropertiesAdmin />}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 admin-glow">
          <Home className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Proprietăți
          </h1>
          <p className="text-sm text-muted-foreground">
            {isMobile ? "Swipe pentru a naviga între secțiuni" : "Selectează secțiunea dorită"}
          </p>
        </div>
      </div>

      {/* Mobile Swipeable Cards */}
      {isMobile ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden min-h-[280px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={mobileCardIndex}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={cardTransition}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="cursor-grab active:cursor-grabbing"
              >
                <div
                  className="admin-glass-card rounded-2xl overflow-hidden group cursor-pointer hover:border-gold/30 transition-all duration-300"
                  onClick={() => setSelectedSection(currentSection.id)}
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${currentSection.iconBg} group-hover:scale-110 transition-transform`}>
                        <currentSection.icon className={`h-5 w-5 ${currentSection.iconColor}`} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-gold transition-colors">
                        {currentSection.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {currentSection.description}
                      </p>
                    </div>

                    <ul className="space-y-2">
                      {currentSection.features.map((feature, index) => (
                        <li 
                          key={index} 
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center">
                            <Check className="h-3 w-3 text-gold" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold rounded-xl"
                    >
                      Deschide →
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {mobileCardIndex > 0 && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                <ChevronLeft className="h-6 w-6" />
              </div>
            )}
            {mobileCardIndex < sectionTypes.length - 1 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                <ChevronRight className="h-6 w-6" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => paginate(-1)}
              disabled={mobileCardIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-2">
              {sectionTypes.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => goToIndex(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-200",
                    index === mobileCardIndex
                      ? "bg-gold w-6"
                      : "bg-muted-foreground/30 w-2"
                  )}
                  aria-label={`Go to ${section.shortTitle}`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => paginate(1)}
              disabled={mobileCardIndex === sectionTypes.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {sectionTypes.map((section, index) => (
              <Button
                key={section.id}
                variant={index === mobileCardIndex ? "default" : "outline"}
                size="sm"
                onClick={() => goToIndex(index)}
                className={cn(
                  "shrink-0 text-xs transition-all duration-200 active:scale-95",
                  index === mobileCardIndex && "bg-gold text-gold-foreground hover:bg-gold/90"
                )}
              >
                <section.icon className="h-3 w-3 mr-1" />
                {section.shortTitle}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        /* Desktop Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {sectionTypes.map((section) => (
            <div
              key={section.id}
              className="admin-glass-card rounded-2xl overflow-hidden group cursor-pointer hover:border-gold/30 transition-all duration-300 active:scale-[0.98]"
              onClick={() => setSelectedSection(section.id)}
            >
              <div className="p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 md:p-3 rounded-xl ${section.iconBg} group-hover:scale-110 transition-transform`}>
                    <section.icon className={`h-5 w-5 md:h-6 md:w-6 ${section.iconColor}`} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-gold transition-colors">
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {section.description}
                  </p>
                </div>

                <ul className="space-y-2">
                  {section.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-gold" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant="link"
                  className="p-0 h-auto text-gold hover:text-gold/80 group-hover:translate-x-1 transition-transform text-sm"
                >
                  Deschide →
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertiesPage;
