import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Phone } from "lucide-react"
import WhatsAppIcon from "@/components/icons/WhatsAppIcon"
import { Link, useLocation } from "react-router-dom"
import { usePrefetch } from "@/hooks/usePrefetch"

const PHONE_DISPLAY = "0767 941 512"
const PHONE_TEL = "tel:+40767941512"
const WHATSAPP_URL = "https://wa.me/40767941512"

const navItems = [
  { name: "Proprietăți", to: "/proprietati", prefetch: "properties" as const },
  { name: "Ansambluri", to: "/complexe", prefetch: "complexe" as const },
  { name: "Despre noi", to: "/despre-noi", prefetch: undefined },
  { name: "Contact", to: "/contact", prefetch: undefined },
]

const secondaryItems = [
  { name: "Calculator credit", to: "/calculator-credit" },
  { name: "De ce să ne alegi", to: "/de-ce-sa-ne-alegi" },
  { name: "Blog", to: "/blog" },
  { name: "Știri", to: "/news" },
  { name: "Întrebări frecvente", to: "/faq" },
]

const Header = () => {
  const location = useLocation()
  const { prefetchOnHover } = usePrefetch()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-ink text-paper border-b border-graphite">
      <div className="container mx-auto h-full px-4 lg:px-6">
        <div className="flex h-full items-center gap-6">
          {/* Logo */}
          <Link to="/" aria-label="MVA Imobiliare — acasă" className="flex items-center shrink-0">
            <img
              src="/mva-logo-3d.png?v=20260725"
              alt="MVA Imobiliare"
              width="48"
              height="48"
              className="h-11 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </Link>

          {/* Nav — center-left */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navigare principală">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 text-small transition-colors ${
                  location.pathname === item.to ? "text-brass" : "text-paper/80 hover:text-brass"
                }`}
                {...(item.prefetch ? prefetchOnHover(item.prefetch) : {})}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Right — desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <a href={PHONE_TEL} className="inline-flex">
              <span className="inline-flex h-9 items-center gap-2 rounded-sm border border-brass px-3 text-small font-medium text-brass transition-colors hover:bg-brass hover:text-ink">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {PHONE_DISPLAY}
              </span>
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Scrie-ne pe WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-graphite text-paper/80 transition-colors hover:border-brass hover:text-brass"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>

          {/* Right — mobile: phone + hamburger */}
          <div className="flex lg:hidden items-center gap-1">
            <a
              href={PHONE_TEL}
              aria-label={`Sună la ${PHONE_DISPLAY}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-brass text-brass"
            >
              <Phone className="h-4 w-4" />
            </a>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-paper" aria-label="Deschide meniul">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <nav className="mt-10 flex flex-col" aria-label="Navigare mobilă">
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="border-b border-border py-4 text-title text-foreground hover:text-brass"
                    >
                      {item.name}
                    </Link>
                  ))}
                  {secondaryItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="border-b border-border py-3 text-small text-muted-foreground hover:text-brass"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="mt-6 flex flex-col gap-2">
                  <a href={PHONE_TEL} className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-brass text-small font-medium text-brass">
                    <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
                  </a>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-pine text-small font-medium text-paper"
                  >
                    <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
