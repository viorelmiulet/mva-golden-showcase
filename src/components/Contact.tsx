import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useSiteSettings } from "@/hooks/useSiteSettings"
import { usePlausible } from "@/hooks/usePlausible"
import { useGA4 } from "@/hooks/useGA4"
import { useLanguage } from "@/contexts/LanguageContext"
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react"
import WhatsAppIcon from "@/components/icons/WhatsAppIcon"
import ScrollReveal from "@/components/ScrollReveal"

const Contact = () => {
  const { data: settings } = useSiteSettings();
  const { trackContact } = usePlausible();
  const { trackContact: trackGA4Contact } = useGA4();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({ nume: '', prenume: '', email: '', telefon: '', mesaj: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.nume || !formData.prenume || !formData.email || !formData.telefon || !formData.mesaj) {
        throw new Error('Vă rugăm să completați toate câmpurile obligatorii');
      }
      const { data, error } = await supabase.functions.invoke('send-contact-email', { body: formData });
      if (error) throw new Error('Eroare la trimiterea email-ului.');
      trackContact('form', 'contact_page');
      trackGA4Contact('form');
      toast({ title: "Mesaj trimis cu succes!", description: "Vă vom contacta în cel mai scurt timp posibil." });
      setFormData({ nume: '', prenume: '', email: '', telefon: '', mesaj: '' });
    } catch (error: any) {
      toast({ title: "Eroare", description: error.message || "Vă rugăm să încercați din nou.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const phoneNumber = settings?.phone?.replace(/\s/g, '') || "0767941512";
  const phoneDisplay = settings?.phone || "0767 941 512";
  const emailAddress = settings?.email || "mvaperfectbusiness@gmail.com";
  const address = settings?.address || "jud. IF com. Chiajna str. Tineretului nr. 17 bl. 2 parter ap 24";

  const contactInfo = [
    { icon: Phone, title: t.contact?.phone || "Telefon", info: phoneDisplay, action: `tel:${phoneNumber}` },
    { icon: Mail, title: t.contact?.email || "Email", info: emailAddress, action: `mailto:${emailAddress}` },
    { icon: MapPin, title: t.contact?.address || "Adresă", info: address, action: null },
    { icon: Clock, title: t.contact?.workingHours || "Program", info: language === 'ro' ? "L-V 10:00-18:00 • S 10:00-15:00" : "Mon-Fri 10:00-18:00 • Sat 10:00-15:00", action: null }
  ];

  const inputClass = "bg-background border-border/50 focus:border-gold focus:ring-1 focus:ring-gold/20 h-11 text-sm";

  return (
    <section id="contact" className="py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-5xl mx-auto">
          
          <ScrollReveal>
            <header className="text-center mb-10 lg:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                <span className="text-foreground">{t.contact?.title || 'Contactează-ne'} </span>
                <span className="text-gradient-gold">{language === 'ro' ? 'Astăzi' : 'Today'}</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {language === 'ro' 
                  ? 'Suntem aici să răspundem la întrebările tale și să te ghidăm către apartamentul perfect.'
                  : 'We are here to answer your questions and guide you to the perfect apartment.'}
              </p>
            </header>
          </ScrollReveal>

          <div className="grid lg:grid-cols-5 gap-6 lg:gap-10">
            
            {/* Contact Info */}
            <ScrollReveal direction="left" className="lg:col-span-2 space-y-3">
              {contactInfo.map((item, i) => {
                const Icon = item.icon;
                const content = (
                  <div className="glass rounded-xl p-4 border border-border/50 hover:border-gold/30 transition-colors flex items-start gap-3">
                    <div className="w-9 h-9 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-0.5">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.info}</p>
                    </div>
                  </div>
                );
                return item.action ? <a key={i} href={item.action}>{content}</a> : <div key={i}>{content}</div>;
              })}

              {/* WhatsApp */}
              <div className="glass rounded-xl p-4 border border-gold/20">
                <div className="flex items-center gap-2 mb-3">
                  <WhatsAppIcon className="w-5 h-5 text-gold" />
                  <h3 className="text-sm font-bold text-foreground">WhatsApp</h3>
                </div>
                <a href={`https://wa.me/${phoneNumber.replace(/^0/, '40')}?text=Salut!%20Sunt%20interesat%20de%20apartamente.`} target="_blank" rel="noopener noreferrer">
                  <Button variant="luxury" className="w-full h-10 text-sm font-semibold">
                    <WhatsAppIcon className="w-4 h-4 mr-2" />Contactează-ne
                  </Button>
                </a>
              </div>
            </ScrollReveal>

            {/* Form */}
            <ScrollReveal direction="right" delay={0.15} className="lg:col-span-3">
              <Card className="glass border border-border/50">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-foreground mb-1">Trimite-ne un mesaj</h3>
                  <p className="text-xs text-muted-foreground mb-5">Completează formularul și îți vom răspunde rapid.</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="nume" className="text-xs font-medium text-foreground mb-1 block">Nume *</label>
                        <Input id="nume" name="nume" autoComplete="family-name" value={formData.nume} onChange={handleChange} placeholder="Numele tău" className={inputClass} required />
                      </div>
                      <div>
                        <label htmlFor="prenume" className="text-xs font-medium text-foreground mb-1 block">Prenume *</label>
                        <Input id="prenume" name="prenume" autoComplete="given-name" value={formData.prenume} onChange={handleChange} placeholder="Prenumele tău" className={inputClass} required />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="text-xs font-medium text-foreground mb-1 block">Email *</label>
                      <Input id="email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} placeholder="email@exemplu.com" className={inputClass} required />
                    </div>
                    <div>
                      <label htmlFor="telefon" className="text-xs font-medium text-foreground mb-1 block">Telefon *</label>
                      <Input id="telefon" name="telefon" autoComplete="tel" value={formData.telefon} onChange={handleChange} placeholder="+40767 941 512" className={inputClass} required />
                    </div>
                    <div>
                      <label htmlFor="mesaj" className="text-xs font-medium text-foreground mb-1 block">Mesaj *</label>
                      <Textarea id="mesaj" name="mesaj" value={formData.mesaj} onChange={handleChange} placeholder="Descrie-ne ce cauți..." rows={4} className="bg-background border-border/50 focus:border-gold focus:ring-1 focus:ring-gold/20 resize-none text-sm" required />
                    </div>
                    <Button type="submit" variant="luxury" size="lg" className="w-full h-11 text-sm font-bold" disabled={isSubmitting}>
                      {isSubmitting ? 'Se trimite...' : <><Send className="w-4 h-4 mr-2" />Trimite mesajul</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
