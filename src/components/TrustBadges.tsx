import ScrollReveal from "@/components/ScrollReveal"
import { useLanguage } from "@/contexts/LanguageContext"
import {
  Building2,
  CalendarDays,
  Handshake,
  Scale,
  ShieldCheck,
  Star,
} from "lucide-react"

const TrustBadges = () => {
  const { language } = useLanguage()

  const badges = language === "ro"
    ? [
        {
          icon: ShieldCheck,
          title: "Autorizat ANCPI",
          subtitle: "Agent imobiliar autorizat",
        },
        {
          icon: Scale,
          title: "Protecția Consumatorului",
          subtitle: "Conform legislației române",
          href: "https://anpc.ro",
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
        },
        {
          icon: CalendarDays,
          title: "15+ Ani Experiență",
          subtitle: "Pe piața imobiliară",
        },
        {
          icon: Handshake,
          title: "500+ Tranzacții",
          subtitle: "Finalizate cu succes",
        },
      ]
    : [
        {
          icon: ShieldCheck,
          title: "ANCPI Authorized",
          subtitle: "Licensed real estate agent",
        },
        {
          icon: Scale,
          title: "Consumer Protection",
          subtitle: "Compliant with Romanian law",
          href: "https://anpc.ro",
        },
        {
          icon: Building2,
          title: "Official Partner",
          subtitle: "Eurocasa, Orhideea, Renew",
        },
        {
          icon: Star,
          title: "4.9 ★ on Google",
          subtitle: "Verified reviews",
        },
        {
          icon: CalendarDays,
          title: "15+ Years Experience",
          subtitle: "In the real estate market",
        },
        {
          icon: Handshake,
          title: "500+ Transactions",
          subtitle: "Successfully completed",
        },
      ]

  return (
    <section
      aria-label={language === "ro" ? "Badge-uri de încredere" : "Trust badges"}
      className="border-y border-border/60 bg-background py-8 sm:py-10"
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-3 gap-x-4 gap-y-8 lg:grid-cols-6 lg:gap-x-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon
            const content = (
              <div className="flex h-full flex-col items-center justify-start text-center">
                <Icon
                  className={`mb-3 h-6 w-6 ${badge.icon === Star ? "fill-current" : ""} text-gold`}
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold leading-tight text-foreground sm:text-base">
                  {badge.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {badge.subtitle}
                </p>
              </div>
            )

            return (
              <ScrollReveal key={badge.title} delay={index * 0.05}>
                {badge.href ? (
                  <a
                    href={badge.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={badge.title}
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default TrustBadges