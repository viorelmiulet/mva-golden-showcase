import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { submitContactForm } from "@/lib/publicForms.functions";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePlausible } from "@/hooks/usePlausible";
import { useGA4 } from "@/hooks/useGA4";
import { trackConversion, CONVERSION_EVENTS } from "@/lib/analytics/conversions";

import { Phone, Mail, MapPin, Clock } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

const Contact = () => {
  const { data: settings } = useSiteSettings();
  const { trackContact } = usePlausible();
  const { trackContact: trackGA4Contact } = useGA4();
  const [formData, setFormData] = useState({ nume: "", telefon: "", email: "", mesaj: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const phoneNumber = settings?.phone?.replace(/\s/g, "") || "0767941512";
  const phoneDisplay = settings?.phone || "0767 941 512";
  const emailAddress = settings?.email || "mvaperfectbusiness@gmail.com";
  const address = settings?.address || "jud. Ilfov, com. Chiajna, str. Tineretului nr. 17, bl. 2, parter, ap. 24";
  const waHref = `https://wa.me/${phoneNumber.replace(/^0/, "40")}?text=${encodeURIComponent("Salut! Sunt interesat de o proprietate.")}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.nume || !formData.telefon || !formData.email || !formData.mesaj) {
        throw new Error("Completează toate câmpurile.");
      }
      await submitContactForm({ data: { ...formData, prenume: "" } });
      trackContact("form", "contact_page");
      trackGA4Contact("form");
      trackConversion(CONVERSION_EVENTS.contactFormSubmit, { source: "contact_page" });

      toast({ title: "Mesaj trimis", description: "Te contactăm în cel mai scurt timp." });
      setFormData({ nume: "", telefon: "", email: "", mesaj: "" });
    } catch (error: unknown) {
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClass = "h-12 rounded-sm border-stone bg-paper text-base";

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

          {/* Fallback form */}
          <div className="mt-12 border-t border-stone pt-10">
            <p className="text-spec text-slate mb-2">SAU TRIMITE UN MESAJ</p>
            <h2 className="text-display-md mb-6">Îți răspundem în aceeași zi</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nume" className="text-spec text-slate mb-1.5 block">NUME</label>
                <Input id="nume" name="nume" autoComplete="name" value={formData.nume} onChange={handleChange} className={inputClass} required />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="telefon" className="text-spec text-slate mb-1.5 block">TELEFON</label>
                  <Input id="telefon" name="telefon" type="tel" autoComplete="tel" value={formData.telefon} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label htmlFor="email" className="text-spec text-slate mb-1.5 block">EMAIL</label>
                  <Input id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} className={inputClass} required />
                </div>
              </div>
              <div>
                <label htmlFor="mesaj" className="text-spec text-slate mb-1.5 block">MESAJ</label>
                <Textarea id="mesaj" name="mesaj" value={formData.mesaj} onChange={handleChange} rows={5} className="rounded-sm border-stone bg-paper text-base resize-none" required />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-8 rounded-sm bg-brass text-paper hover:bg-brass-dark font-semibold"
              >
                {isSubmitting ? "Se trimite…" : "Trimite mesajul"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
