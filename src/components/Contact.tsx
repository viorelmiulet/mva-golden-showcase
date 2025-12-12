import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send
} from "lucide-react"
import WhatsAppIcon from "@/components/icons/WhatsAppIcon"

const Contact = () => {
  const [formData, setFormData] = useState({
    nume: '',
    prenume: '',
    email: '',
    telefon: '',
    mesaj: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Form submitted with data:', formData);
    setIsSubmitting(true);

    try {
      // Validate form data
      console.log('Validating form fields...');
      if (!formData.nume || !formData.prenume || !formData.email || !formData.telefon || !formData.mesaj) {
        console.error('Validation failed - missing fields:', {
          nume: !formData.nume,
          prenume: !formData.prenume,
          email: !formData.email,
          telefon: !formData.telefon,
          mesaj: !formData.mesaj
        });
        throw new Error('Vă rugăm să completați toate câmpurile obligatorii');
      }
      console.log('Validation passed!');

      // Send email through Resend
      console.log('Sending email through Resend...');
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          nume: formData.nume,
          prenume: formData.prenume,
          email: formData.email,
          telefon: formData.telefon,
          mesaj: formData.mesaj
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error('Eroare la trimiterea email-ului. Vă rugăm încercați din nou.');
      }

      console.log('Email sent successfully:', data);

      toast({
        title: "Mesaj trimis cu succes!",
        description: "Vă vom contacta în cel mai scurt timp posibil.",
      });
      
      // Reset form
      setFormData({
        nume: '',
        prenume: '',
        email: '',
        telefon: '',
        mesaj: ''
      });

    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Eroare la trimiterea mesajului",
        description: error.message || "Vă rugăm să încercați din nou.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Telefon",
      info: "0767 941 512",
      action: "tel:0767941512"
    },
    {
      icon: Mail,
      title: "Email",
      info: "mvaperfectbusiness@gmail.com",
      action: "mailto:mvaperfectbusiness@gmail.com"
    },
    {
      icon: MapPin,
      title: "Adresă",
      info: "jud. IF com. Chiajna str. Tineretului nr. 17 bl. 2 parter ap 24",
      action: null
    },
    {
      icon: Clock,
      title: "Program",
      info: "L-V 10:00-18:00 • S 10:00-15:00 • D închis",
      action: null
    }
  ]

  return (
    <section id="contact" className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-background to-gold/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(218,165,32,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(218,165,32,0.05),transparent_50%)]"></div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Header with Animation */}
          <div className="text-center mb-12 sm:mb-16 lg:mb-20 animate-fade-in">
            <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
              <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-gold/50 mr-3"></div>
              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/30 px-4 py-1.5 text-xs sm:text-sm font-semibold">
                Hai să vorbim
              </Badge>
              <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-gold/50 ml-3"></div>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 lg:mb-8">
              <span className="text-foreground">Contactează-ne </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent animate-pulse">
                Astăzi
              </span>
            </h2>
            
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Suntem aici să răspundem la întrebările tale despre complexele rezidențiale 
              și să te ghidăm către apartamentul perfect pentru tine.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12 items-start">
            
            {/* Contact Information */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                {contactInfo.map((item, index) => {
                  const Icon = item.icon
                  const content = (
                    <div className="relative overflow-hidden flex items-start space-x-3 sm:space-x-4 p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl bg-card backdrop-blur-sm border border-gold/10 hover:border-gold/30 transition-all duration-500 group touch-manipulation hover:shadow-[0_8px_30px_rgb(218,165,32,0.12)] hover:-translate-y-1">
                      {/* Hover Effect Background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-gold/20 via-gold/10 to-gold-dark/20 rounded-xl lg:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gold group-hover:text-gold-light transition-colors" />
                      </div>
                      
                      <div className="relative flex-1 min-w-0">
                        <h3 className="font-bold text-foreground mb-1.5 text-sm sm:text-base lg:text-lg group-hover:text-gold transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-xs sm:text-sm lg:text-base leading-relaxed break-words">
                          {item.info}
                        </p>
                      </div>
                    </div>
                  )

                  return item.action ? (
                    <a key={index} href={item.action} className="block">
                      {content}
                    </a>
                  ) : (
                    <div key={index}>
                      {content}
                    </div>
                  )
                })}
              </div>

              {/* WhatsApp CTA - Enhanced */}
              <div className="relative overflow-hidden bg-gradient-to-br from-gold/15 via-gold/8 to-gold/15 rounded-xl lg:rounded-2xl p-5 sm:p-6 lg:p-8 border-2 border-gold/30 shadow-[0_8px_30px_rgb(218,165,32,0.15)] hover:shadow-[0_12px_40px_rgb(218,165,32,0.25)] transition-all duration-500 hover:-translate-y-1">
                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gold/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gold/10 rounded-full blur-2xl"></div>
                
                <div className="relative">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gold/30 to-gold-dark/30 rounded-xl flex items-center justify-center animate-pulse">
                      <WhatsAppIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gold flex-shrink-0" />
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
                      Răspuns Imediat pe WhatsApp
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4 sm:mb-5 text-xs sm:text-sm lg:text-base">
                    Pentru răspunsuri rapide și consultanță personalizată
                  </p>
                  <a 
                    href="https://wa.me/40767941512?text=Salut!%20Sunt%20interesat%20de%20apartamente%20in%20complexele%20voastre%20din%20Chiajna.%20Imi%20puteti%20oferi%20mai%20multe%20detalii%3F" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="luxury" className="w-full h-11 sm:h-12 lg:h-14 text-sm sm:text-base font-bold touch-manipulation shadow-lg hover:shadow-xl transition-all group">
                      <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="truncate">Contactează-ne pe WhatsApp</span>
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form - Enhanced */}
            <div className="lg:col-span-3">
              <Card className="relative overflow-hidden border-0 bg-card backdrop-blur-sm shadow-2xl hover:shadow-[0_20px_60px_rgb(218,165,32,0.15)] transition-all duration-500">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-gold/10 to-transparent rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-gold/10 to-transparent rounded-full blur-3xl -z-10"></div>
                
                <CardContent className="p-5 sm:p-7 lg:p-10 relative">
                  <div className="mb-6 sm:mb-8 lg:mb-10">
                    <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gold/20 to-gold-dark/20 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                      </div>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                        Trimite-ne un mesaj
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                      Completează formularul și îți vom răspunde în cel mai scurt timp.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div className="space-y-2.5 group">
                        <label className="text-sm sm:text-base font-semibold text-foreground group-focus-within:text-gold transition-colors flex items-center">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full mr-2"></span>
                          Nume *
                        </label>
                        <Input 
                          name="nume"
                          value={formData.nume}
                          onChange={handleChange}
                          placeholder="Numele tău" 
                          className="bg-background border-border/50 focus:border-gold focus:ring-2 focus:ring-gold/20 h-11 sm:h-12 lg:h-14 text-sm sm:text-base touch-manipulation transition-all duration-300 hover:border-gold/50" 
                          required
                        />
                      </div>
                      <div className="space-y-2.5 group">
                        <label className="text-sm sm:text-base font-semibold text-foreground group-focus-within:text-gold transition-colors flex items-center">
                          <span className="w-1.5 h-1.5 bg-gold rounded-full mr-2"></span>
                          Prenume *
                        </label>
                        <Input 
                          name="prenume"
                          value={formData.prenume}
                          onChange={handleChange}
                          placeholder="Prenumele tău" 
                          className="bg-background border-border/50 focus:border-gold focus:ring-2 focus:ring-gold/20 h-11 sm:h-12 lg:h-14 text-sm sm:text-base touch-manipulation transition-all duration-300 hover:border-gold/50" 
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2.5 group">
                      <label className="text-sm sm:text-base font-semibold text-foreground group-focus-within:text-gold transition-colors flex items-center">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mr-2"></span>
                        Email *
                      </label>
                      <Input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@exemplu.com" 
                        className="bg-background border-border/50 focus:border-gold focus:ring-2 focus:ring-gold/20 h-11 sm:h-12 lg:h-14 text-sm sm:text-base touch-manipulation transition-all duration-300 hover:border-gold/50" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2.5 group">
                      <label className="text-sm sm:text-base font-semibold text-foreground group-focus-within:text-gold transition-colors flex items-center">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mr-2"></span>
                        Telefon *
                      </label>
                      <Input 
                        name="telefon"
                        value={formData.telefon}
                        onChange={handleChange}
                        placeholder="+40767 941 512" 
                        className="bg-background border-border/50 focus:border-gold focus:ring-2 focus:ring-gold/20 h-11 sm:h-12 lg:h-14 text-sm sm:text-base touch-manipulation transition-all duration-300 hover:border-gold/50" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2.5 group">
                      <label className="text-sm sm:text-base font-semibold text-foreground group-focus-within:text-gold transition-colors flex items-center">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mr-2"></span>
                        Mesaj *
                      </label>
                      <Textarea 
                        name="mesaj"
                        value={formData.mesaj}
                        onChange={handleChange}
                        placeholder="Descrie-ne ce tip de apartament cauți, bugetul tău sau orice întrebări ai despre complexele noastre..."
                        rows={5}
                        className="bg-background border-border/50 focus:border-gold focus:ring-2 focus:ring-gold/20 resize-none min-h-[120px] sm:min-h-[140px] lg:min-h-[160px] text-sm sm:text-base touch-manipulation transition-all duration-300 hover:border-gold/50"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      variant="luxury" 
                      size="lg" 
                      className="w-full group h-12 sm:h-14 lg:h-16 text-base sm:text-lg font-bold touch-manipulation shadow-lg hover:shadow-xl transition-all" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2">⏳</span>
                          Se trimite...
                        </span>
                      ) : (
                        <>
                          Trimite Mesajul
                          <Send className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300 flex-shrink-0" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Google Maps */}
          <div className="mt-12 sm:mt-16 lg:mt-20">
            <div className="relative overflow-hidden rounded-xl lg:rounded-2xl border border-gold/20 shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2849.5!2d25.9628!3d44.4431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b1fef8f8f8f8f8%3A0x1234567890abcdef!2sStrada%20Tineretului%2017%2C%20Chiajna%2C%20Ilfov!5e0!3m2!1sro!2sro!4v1702400000000"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale hover:grayscale-0 transition-all duration-500 sm:h-[350px] lg:h-[400px]"
                title="Locația MVA Imobiliare - Chiajna, Ilfov"
              />
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
                <div className="bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 sm:px-4 border border-gold/20">
                  <p className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gold flex-shrink-0" />
                    <span className="truncate">Chiajna, str. Tineretului nr. 17</span>
                  </p>
                </div>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Strada+Tineretului+17,+Chiajna,+Ilfov,+Romania"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <Button variant="luxury" size="sm" className="shadow-lg w-full sm:w-auto h-10 sm:h-9 touch-manipulation">
                    <MapPin className="w-4 h-4 mr-2" />
                    Navigare GPS
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact