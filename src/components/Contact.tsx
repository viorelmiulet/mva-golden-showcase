import UniversalContactForm from "@/components/contact/UniversalContactForm";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePlausible } from "@/hooks/usePlausible";
import { useGA4 } from "@/hooks/useGA4";

import { Phone, Mail, MapPin, Clock } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

const Contact = () => {
  const { data: settings } = useSiteSettings();
  const { trackContact } = usePlausible();
  const { trackContact: trackGA4Contact } = useGA4();

  const phoneNumber = settings?.phone?.replace(/\s/g, "") || "0767941512";
  const phoneDisplay = settings?.phone || "0767 941 512";
  const emailAddress = settings?.email || "mvaperfectbusiness@gmail.com";
  const address = settings?.address || "jud. Ilfov, com. Chiajna, str. Tineretului nr. 17, bl. 2, parter, ap. 24";
  const waHref = `https://wa.me/${phoneNumber.replace(/^0/, "40")}?text=${encodeURIComponent("Salut! Sunt interesat de o proprietate.")}`;


  return (
    <section id="contact" className="py-12 sm:py-16">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Primary contact paths */}
          <div className="space-y-3">
            <a
              href={`tel:${phoneNumber}`}
              onClick={() => { trackContact("phone", "contact_page"); trackGA4Contact("phone"); }}
              className="flex items-center gap-4 border border-stone rounded-sm px-5 py-5 hover:border-brass transition-colors"
            >
              <Phone className="w-6 h-6 text-brass flex-shrink-0" />
              <span>
                <span className="block text-spec text-slate">TELEFON</span>
                <span className="block text-2xl sm:text-3xl font-semibold tabular-nums text-ink">{phoneDisplay}</span>
              </span>
            </a>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { trackContact("whatsapp", "contact_page"); trackGA4Contact("whatsapp"); }}
              className="flex items-center gap-4 border border-stone rounded-sm px-5 py-5 hover:border-pine transition-colors"
            >
              <WhatsAppIcon className="w-6 h-6 text-pine flex-shrink-0" />
              <span>
                <span className="block text-spec text-slate">WHATSAPP</span>
                <span className="block text-xl sm:text-2xl font-semibold text-ink">Scrie-ne pe WhatsApp</span>
              </span>
            </a>

            <a
              href={`mailto:${emailAddress}`}
              onClick={() => { trackContact("email", "contact_page"); trackGA4Contact("email"); }}
              className="flex items-center gap-4 border border-stone rounded-sm px-5 py-5 hover:border-brass transition-colors"
            >
              <Mail className="w-6 h-6 text-brass flex-shrink-0" />
              <span className="min-w-0">
                <span className="block text-spec text-slate">EMAIL</span>
                <span className="block text-lg sm:text-xl font-semibold text-ink break-all">{emailAddress}</span>
              </span>
            </a>
          </div>

          {/* Secondary details */}
          <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm text-slate">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-slate flex-shrink-0" />
              {address}
            </p>
            <p className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 text-slate flex-shrink-0" />
              L–V 10:00–18:00 · S 10:00–15:00
            </p>
          </div>

          {/* Universal enquiry form */}
          <div className="mt-12 border-t border-stone pt-10">
            <p className="text-spec text-slate mb-2">SAU TRIMITE O SOLICITARE</p>
            <h2 className="text-display-md mb-6">Îți răspundem în aceeași zi</h2>
            <div className="rounded-sm border border-stone bg-card p-5 sm:p-7">
              <UniversalContactForm />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Contact;
