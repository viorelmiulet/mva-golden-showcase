import ScrollReveal from "@/components/ScrollReveal";
import { Building2, Clock3, Handshake, Scale, Star } from "lucide-react";

type TrustBadge = {
  icon: typeof Scale;
  title: string;
  subtitle: string;
  href?: string;
  external?: boolean;
  filled?: boolean;
};

const badges: TrustBadge[] = [
  {
    icon: Scale,
    title: "Protecția Consumatorului",
    subtitle: "Conform legislației române",
    href: "https://anpc.ro",
    external: true,
  },
  {
    icon: Building2,
    title: "Partener Oficial",
    subtitle: "Eurocasa, Orhideea, Renew",
  },
  {
    icon: Star,
    title: "4.9 ★ pe Google",
    subtitle: "Recenzii verificate",
    filled: true,
  },
  {
    icon: Clock3,
    title: "15+ Ani Experiență",
    subtitle: "Pe piața imobiliară",
  },
  {
    icon: Handshake,
    title: "500+ Tranzacții",
    subtitle: "Finalizate cu succes",
  },
];

const TrustBadges = () => {
  return (
    <section className="border-y border-border/50 bg-background py-10 sm:py-12" aria-label="Trust badges">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-3 gap-x-4 gap-y-8 lg:grid-cols-6 lg:gap-x-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            const content = (
              <div className="flex flex-col items-center text-center">
                <Icon
                  className={`mb-3 h-5 w-5 text-gold ${badge.filled ? "fill-current" : ""}`}
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                  {badge.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {badge.subtitle}
                </p>
              </div>
            );

            return (
              <ScrollReveal key={badge.title} delay={index * 0.05} direction="up">
                {badge.href ? (
                  <a
                    href={badge.href}
                    target={badge.external ? "_blank" : undefined}
                    rel={badge.external ? "noreferrer" : undefined}
                    className="block transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;