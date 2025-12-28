import { useState, lazy, Suspense, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Key, Building2, Users, FileText, Check, Loader2, Handshake, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  const isMobile = useIsMobile();

  // Swipe handlers for mobile card carousel
  const handleSwipeLeft = () => {
    if (mobileCardIndex < contractTypes.length - 1) {
      setMobileCardIndex((prev) => prev + 1);
    }
  };

  const handleSwipeRight = () => {
    if (mobileCardIndex > 0) {
      setMobileCardIndex((prev) => prev - 1);
    }
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

      {/* Mobile Swipeable Card Carousel */}
      {isMobile ? (
        <div className="space-y-3">
          {/* Swipeable Card Container */}
          <div
            className="relative overflow-hidden touch-pan-y"
            {...swipeHandlers}
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${mobileCardIndex * 100}%)` }}
            >
              {contractTypes.map((contract) => (
                <div key={contract.id} className="w-full flex-shrink-0 px-1">
                  <Card
                    className={`group relative overflow-hidden border-border/50 bg-gradient-to-br ${contract.gradient} hover:border-gold/30 transition-all duration-300 cursor-pointer active:scale-[0.98]`}
                    onClick={() => setSelectedType(contract.id)}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Icons */}
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${contract.iconBg}`}>
                          <contract.icon className={`h-5 w-5 ${contract.iconColor}`} />
                        </div>
                        <contract.secondaryIcon className="h-4 w-4 text-muted-foreground/50" />
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-foreground group-hover:text-gold transition-colors">
                          {contract.title}
                        </h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {contract.description}
                        </p>
                      </div>

                      {/* Features - show on mobile carousel */}
                      <ul className="space-y-1.5">
                        {contract.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-gold shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
                      >
                        Deschide Contract →
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Dots & Arrows */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSwipeRight}
              disabled={mobileCardIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-2">
              {contractTypes.map((contract, index) => (
                <button
                  key={contract.id}
                  onClick={() => setMobileCardIndex(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === mobileCardIndex
                      ? "w-6 bg-gold"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to ${contract.shortTitle}`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSwipeLeft}
              disabled={mobileCardIndex === contractTypes.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Type Selector Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {contractTypes.map((contract, index) => (
              <Button
                key={contract.id}
                variant={index === mobileCardIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setMobileCardIndex(index)}
                className={cn(
                  "shrink-0 text-xs",
                  index === mobileCardIndex && "bg-gold text-gold-foreground hover:bg-gold/90"
                )}
              >
                <contract.icon className="h-3 w-3 mr-1" />
                {contract.shortTitle}
              </Button>
            ))}
          </div>
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
