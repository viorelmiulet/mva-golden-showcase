import { Phone, Mail, MapPin, Clock } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import UniversalContactForm from "@/components/contact/UniversalContactForm";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const HomeContactBand = () => {
  const { data: settings } = useSiteSettings();
  const phoneNumber = settings?.phone?.replace(/\s/g, "") || "0767941512";
  const phoneDisplay = settings?.phone || "0767 941 512";
  const emailAddress = settings?.email || "mvaperfectbusiness@gmail.com";
  const address =
    settings?.address || "jud. Ilfov, com. Chiajna, str. Tineretului nr. 17, bl. 2, parter, ap. 24";
  const waHref = `https://wa.me/${phoneNumber.replace(/^0/, "40")}`;

  return (
    <section id="contact" className="border-t border-stone bg-background py-14 sm:py-20">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="text-spec text-brass mb-2">CONTACT</p>
            <h2 className="text-display-md text-foreground">Spune-ne ce cauți</h2>
            <p className="text-body text-muted-foreground mt-3">
              Un singur formular pentru orice solicitare: cumpărare, închiriere, vânzare, vizionare
              sau colaborare. Îți răspundem în aceeași zi lucrătoare.
            </p>

            <div className="mt-8 space-y-3">
              <a href={`tel:${phoneNumber}`} className="flex items-center gap-3 rounded-sm border border-stone px-4 py-4 transition-colors duration-200 hover:border-brass">
                <Phone className="h-5 w-5 shrink-0 text-brass" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-spec text-muted-foreground">TELEFON</span>
                  <span className="block text-title tabular-nums text-foreground">{phoneDisplay}</span>
                </span>
              </a>
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-sm border border-stone px-4 py-4 transition-colors duration-200 hover:border-brass">
                <WhatsAppIcon className="h-5 w-5 shrink-0 text-brass" />
                <span className="min-w-0">
                  <span className="block text-spec text-muted-foreground">WHATSAPP</span>
                  <span className="block text-title text-foreground">Scrie-ne pe WhatsApp</span>
                </span>
              </a>
              <a href={`mailto:${emailAddress}`} className="flex items-center gap-3 rounded-sm border border-stone px-4 py-4 transition-colors duration-200 hover:border-brass">
                <Mail className="h-5 w-5 shrink-0 text-brass" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-spec text-muted-foreground">EMAIL</span>
                  <span className="block break-all text-title text-foreground">{emailAddress}</span>
                </span>
              </a>
            </div>

            <div className="mt-6 space-y-2 text-small text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {address}
              </p>
              <p className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                L–V 10:00–18:00 · S 10:00–15:00
              </p>
            </div>
          </div>

          <div className="rounded-sm border border-stone bg-card p-6 sm:p-8">
            <UniversalContactForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeContactBand;
