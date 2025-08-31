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
  Send,
  MessageCircle 
} from "lucide-react"

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
    <section id="contact" className="py-24 bg-gradient-to-b from-secondary/20 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-20">
            <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-6">
              Hai să vorbim
            </Badge>
            
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              <span className="text-foreground">Contactează-ne </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Astăzi
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Suntem aici să răspundem la întrebările tale despre complexele rezidențiale 
              și să te ghidăm către apartamentul perfect pentru tine.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">
            
            {/* Contact Information */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              <div className="space-y-4 lg:space-y-6">
                {contactInfo.map((item, index) => {
                  const Icon = item.icon
                  const content = (
                    <div className="flex items-start space-x-3 sm:space-x-4 p-4 sm:p-6 rounded-xl lg:rounded-2xl bg-card/50 backdrop-blur-sm border border-gold/10 hover:border-gold/20 transition-all duration-300 group touch-manipulation">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gold/20 to-gold-dark/20 rounded-lg lg:rounded-xl flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold-dark/30 transition-all">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
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

              {/* WhatsApp CTA */}
              <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gold/20">
                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                  <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gold" />
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    Răspuns Imediat pe WhatsApp
                  </h3>
                </div>
                <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm">
                  Pentru răspunsuri rapide
                </p>
                <a href="https://wa.me/40767941512" target="_blank" rel="noopener noreferrer">
                  <Button variant="luxury" className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold touch-manipulation">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contactează-ne pe WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-2xl">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="mb-6 lg:mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                      Trimite-ne un mesaj
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Completează formularul și îți vom răspunde în cel mai scurt timp.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Nume *
                        </label>
                        <Input 
                          name="nume"
                          value={formData.nume}
                          onChange={handleChange}
                          placeholder="Numele tău" 
                          className="bg-background/50 border-border/50 focus:border-gold/50 h-11 sm:h-12 touch-manipulation" 
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Prenume *
                        </label>
                        <Input 
                          name="prenume"
                          value={formData.prenume}
                          onChange={handleChange}
                          placeholder="Prenumele tău" 
                          className="bg-background/50 border-border/50 focus:border-gold/50 h-11 sm:h-12 touch-manipulation" 
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Email *
                      </label>
                      <Input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@exemplu.com" 
                        className="bg-background/50 border-border/50 focus:border-gold/50 h-11 sm:h-12 touch-manipulation" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Telefon *
                      </label>
                      <Input 
                        name="telefon"
                        value={formData.telefon}
                        onChange={handleChange}
                        placeholder="+40767 941 512" 
                        className="bg-background/50 border-border/50 focus:border-gold/50 h-11 sm:h-12 touch-manipulation" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Mesaj *
                      </label>
                      <Textarea 
                        name="mesaj"
                        value={formData.mesaj}
                        onChange={handleChange}
                        placeholder="Descrie-ne ce tip de apartament cauți, bugetul tău sau orice întrebări ai despre complexele noastre..."
                        rows={4}
                        className="bg-background/50 border-border/50 focus:border-gold/50 resize-none min-h-[120px] touch-manipulation"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      variant="luxury" 
                      size="lg" 
                      className="w-full group h-12 sm:h-14 text-base font-semibold touch-manipulation" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Se trimite..."
                      ) : (
                        <>
                          Trimite Mesajul
                          <Send className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact