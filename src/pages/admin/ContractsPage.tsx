import { useState, lazy, Suspense, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Key, Building2, Users, FileText, Check, Loader2, Handshake, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

// Lazy load the contract generators
const ContractGeneratorPage = lazy(() => import("./ContractGeneratorPage"));
const ExclusiveRepresentationPage = lazy(() => import("./ExclusiveRepresentationPage"));
const GeneratedContractsPage = lazy(() => import("./GeneratedContractsPage"));
const ComodatContractPage = lazy(() => import("./ComodatContractPage"));
const IntermediationContractPage = lazy(() => import("./IntermediationContractPage"));

type ContractType = "selection" | "inchiriere" | "reprezentare-exclusiva" | "comodat" | "intermediere";

const contractTypes = [
  {
    id: "inchiriere" as const,
    title: "Contract Închiriere",
    shortTitle: "Închiriere",
    description: "Contract standard de închiriere pentru locuințe sau spații comerciale",
    icon: Home,
    secondaryIcon: Key,
    features: [
      "Generare automată PDF/DOCX",
      "Inventar bunuri",
      "Semnătură digitală",
      "Clauze personalizabile",
    ],
    gradient: "from-cyan-500/20 to-blue-600/20",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    id: "comodat" as const,
    title: "Contract Comodat",
    shortTitle: "Comodat",
    description: "Contract de împrumut de folosință gratuită pentru imobile",
    icon: Handshake,
    secondaryIcon: Home,
    features: [
      "Folosință gratuită",
      "Sediu social / locuință",
      "Generare PDF automată",
      "Obligații părți",
    ],
    gradient: "from-emerald-500/20 to-green-600/20",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    id: "intermediere" as const,
    title: "Contract Intermediere",
    shortTitle: "Intermediere",
    description: "Contract de intermediere pentru clienți căutători de imobile",
    icon: Search,
    secondaryIcon: Users,
    features: [
      "Criterii căutare",
      "Comision personalizabil",
      "Semnătură digitală",
      "Generare PDF automată",
    ],
    gradient: "from-orange-500/20 to-red-600/20",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    id: "reprezentare-exclusiva" as const,
    title: "Contract Reprezentare Exclusivă",
    shortTitle: "Exclusiv",
    description: "Contract de intermediere imobiliară cu reprezentare exclusivă",
    icon: Building2,
    secondaryIcon: Users,
    features: [
      "Comision personalizabil",
      "Perioadă exclusivitate",
      "Detalii proprietate",
      "Semnătură digitală",
    ],
    gradient: "from-purple-500/20 to-violet-600/20",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
];

const ContractsPage = () => {
  const [selectedType, setSelectedType] = useState<ContractType>("selection");
  const [mobileCardIndex, setMobileCardIndex] = useState(0);
  const [[page, direction], setPage] = useState([0, 0]);
  const isMobile = useIsMobile();

  // Animation variants for cards
  const cardVariants = {
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
  };

  const cardTransition = {
    x: { type: "spring" as const, stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 },
    scale: { duration: 0.2 },
  };

  // Swipe handlers for mobile card carousel
  const paginate = (newDirection: number) => {
    const newIndex = mobileCardIndex + newDirection;
    if (newIndex >= 0 && newIndex < contractTypes.length) {
      setPage([newIndex, newDirection]);
      setMobileCardIndex(newIndex);
    }
  };

  const handleSwipeLeft = () => paginate(1);
  const handleSwipeRight = () => paginate(-1);

  // Handle drag end for framer-motion
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset < -threshold || velocity < -500) {
      handleSwipeLeft();
    } else if (offset > threshold || velocity > 500) {
      handleSwipeRight();
    }
  };

  const goToIndex = (index: number) => {
    const direction = index > mobileCardIndex ? 1 : -1;
    setPage([index, direction]);
    setMobileCardIndex(index);
  };

  const swipeHandlers = useSwipeGesture({
    minSwipeDistance: 50,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  const currentContract = useMemo(() => contractTypes[mobileCardIndex], [mobileCardIndex]);

  if (selectedType !== "selection") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedType("selection")}
          className="mb-2 hover:bg-gold/10 hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Înapoi la selecție
        </Button>
        
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          }
        >
          {selectedType === "inchiriere" && <ContractGeneratorPage />}
          {selectedType === "comodat" && <ComodatContractPage />}
          {selectedType === "intermediere" && <IntermediationContractPage />}
          {selectedType === "reprezentare-exclusiva" && <ExclusiveRepresentationPage />}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 md:h-6 md:w-6" />
          Contracte
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {isMobile ? "Swipe pentru a naviga între tipuri" : "Selectează tipul de contract pe care dorești să îl creezi"}
        </p>
      </div>

      {/* Mobile Swipeable Card Carousel with Framer Motion */}
      {isMobile ? (
        <div className="space-y-3">
          {/* Swipeable Card Container */}
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
                <Card
                  className={`group relative overflow-hidden border-border/50 bg-gradient-to-br ${currentContract.gradient} hover:border-gold/30 transition-all duration-300`}
                  onClick={() => setSelectedType(currentContract.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Icons */}
                    <motion.div 
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className={`p-2 rounded-xl ${currentContract.iconBg}`}>
                        <currentContract.icon className={`h-5 w-5 ${currentContract.iconColor}`} />
                      </div>
                      <currentContract.secondaryIcon className="h-4 w-4 text-muted-foreground/50" />
                    </motion.div>

                    {/* Title & Description */}
                    <motion.div 
                      className="space-y-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-gold transition-colors">
                        {currentContract.title}
                      </h2>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentContract.description}
                      </p>
                    </motion.div>

                    {/* Features - show on mobile carousel */}
                    <motion.ul 
                      className="space-y-1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {currentContract.features.slice(0, 3).map((feature, index) => (
                        <motion.li 
                          key={index} 
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 + index * 0.05 }}
                        >
                          <Check className="h-3 w-3 text-gold shrink-0" />
                          {feature}
                        </motion.li>
                      ))}
                    </motion.ul>

                    {/* CTA */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
                      >
                        Deschide Contract →
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Swipe hint indicators */}
            {mobileCardIndex > 0 && (
              <motion.div 
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/30"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
              >
                <ChevronLeft className="h-6 w-6" />
              </motion.div>
            )}
            {mobileCardIndex < contractTypes.length - 1 && (
              <motion.div 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
              >
                <ChevronRight className="h-6 w-6" />
              </motion.div>
            )}
          </div>

          {/* Navigation Dots & Arrows */}
          <motion.div 
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
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
              {contractTypes.map((contract, index) => (
                <motion.button
                  key={contract.id}
                  onClick={() => goToIndex(index)}
                  className={cn(
                    "h-2 rounded-full transition-colors duration-300",
                    index === mobileCardIndex
                      ? "bg-gold"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  animate={{ 
                    width: index === mobileCardIndex ? 24 : 8,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  aria-label={`Go to ${contract.shortTitle}`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => paginate(1)}
              disabled={mobileCardIndex === contractTypes.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Quick Type Selector Pills */}
          <motion.div 
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {contractTypes.map((contract, index) => (
              <motion.div
                key={contract.id}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={index === mobileCardIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToIndex(index)}
                  className={cn(
                    "shrink-0 text-xs transition-all duration-200",
                    index === mobileCardIndex && "bg-gold text-gold-foreground hover:bg-gold/90"
                  )}
                >
                  <contract.icon className="h-3 w-3 mr-1" />
                  {contract.shortTitle}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ) : (
        /* Desktop Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
          {contractTypes.map((contract) => (
            <Card
              key={contract.id}
              className={`group relative overflow-hidden border-border/50 bg-gradient-to-br ${contract.gradient} hover:border-gold/30 transition-all duration-300 cursor-pointer active:scale-[0.98]`}
              onClick={() => setSelectedType(contract.id)}
            >
              <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                {/* Icons */}
                <div className="flex items-center gap-2">
                  <div className={`p-2 md:p-3 rounded-xl ${contract.iconBg}`}>
                    <contract.icon className={`h-5 w-5 md:h-6 md:w-6 ${contract.iconColor}`} />
                  </div>
                  <contract.secondaryIcon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground/50" />
                </div>

                {/* Title & Description */}
                <div className="space-y-1 md:space-y-2">
                  <h2 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-gold transition-colors">
                    {contract.title}
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {contract.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {contract.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-gold shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant="link"
                  className="p-0 h-auto text-gold hover:text-gold/80 group-hover:translate-x-1 transition-transform text-sm"
                >
                  Deschide →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generated Contracts List */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        }
      >
        <GeneratedContractsPage />
      </Suspense>
    </div>
  );
};

export default ContractsPage;
