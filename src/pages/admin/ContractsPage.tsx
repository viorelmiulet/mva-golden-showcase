import { useState, lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Key, Building2, Users, FileText, Check, Loader2 } from "lucide-react";

// Lazy load the contract generators
const ContractGeneratorPage = lazy(() => import("./ContractGeneratorPage"));
const ExclusiveRepresentationPage = lazy(() => import("./ExclusiveRepresentationPage"));

type ContractType = "selection" | "inchiriere" | "reprezentare-exclusiva";

const contractTypes = [
  {
    id: "inchiriere" as const,
    title: "Contract Închiriere",
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
    id: "reprezentare-exclusiva" as const,
    title: "Contract Reprezentare Exclusivă",
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
          {selectedType === "reprezentare-exclusiva" && <ExclusiveRepresentationPage />}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Contracte
        </h1>
        <p className="text-muted-foreground">
          Selectează tipul de contract pe care dorești să îl creezi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contractTypes.map((contract) => (
          <Card
            key={contract.id}
            className={`group relative overflow-hidden border-border/50 bg-gradient-to-br ${contract.gradient} hover:border-gold/30 transition-all duration-300 cursor-pointer`}
            onClick={() => setSelectedType(contract.id)}
          >
            <CardContent className="p-6 space-y-4">
              {/* Icons */}
              <div className="flex items-center gap-2">
                <div className={`p-3 rounded-xl ${contract.iconBg}`}>
                  <contract.icon className={`h-6 w-6 ${contract.iconColor}`} />
                </div>
                <contract.secondaryIcon className="h-5 w-5 text-muted-foreground/50" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground group-hover:text-gold transition-colors">
                  {contract.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
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
                className="p-0 h-auto text-gold hover:text-gold/80 group-hover:translate-x-1 transition-transform"
              >
                Deschide →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContractsPage;
