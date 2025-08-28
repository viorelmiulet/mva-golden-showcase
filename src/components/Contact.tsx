import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

import { useToast } from "@/hooks/use-toast"

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
    console.log('Form submitted with data:', formData);
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.nume || !formData.prenume || !formData.email || !formData.telefon || !formData.mesaj) {
        throw new Error('Vă rugăm să completați toate câmpurile obligatorii');
      }

      // Create WhatsApp message
      const message = `Salut! Am o întrebare prin formularul de contact:

*Nume:* ${formData.nume} ${formData.prenume}
*Email:* ${formData.email}
*Telefon:* ${formData.telefon}

*Mesaj:*
${formData.mesaj}`;

      // WhatsApp phone number (remove + and spaces)
      const whatsappNumber = '40767941512';
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      console.log('Opening WhatsApp URL:', whatsappUrl);
      
      // Try to open WhatsApp with fallback
      const opened = window.open(whatsappUrl, '_blank');
      
      if (!opened) {
        // Fallback: try to navigate to WhatsApp
        window.location.href = whatsappUrl;
      }

      toast({
        title: "Mesaj pregătit pentru WhatsApp!",
        description: "Se va deschide WhatsApp cu mesajul tău pre-completat.",
      });
      
      // Reset form after a short delay
      setTimeout(() => {
        setFormData({
          nume: '',
          prenume: '',
          email: '',
          telefon: '',
          mesaj: ''
        });
      }, 1000);

    } catch (error: any) {
      console.error('Error preparing WhatsApp message:', error);
      toast({
        title: "Eroare la pregătirea mesajului",
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

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-foreground">Contactează-ne </span>
              <span className="text-gold">Astăzi</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-gold-dark to-gold mx-auto mb-6"></div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Suntem aici să vă ajutăm să găsiți proprietatea perfectă sau să vă oferim 
              cele mai bune servicii imobiliare.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-2xl text-gold">Informații de Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                      <span className="text-gold text-xl">📞</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Telefon</p>
                      <p className="text-muted-foreground">+40767 941 512</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                      <span className="text-gold text-xl">📧</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Email</p>
                      <p className="text-muted-foreground">mvaperfectbusiness@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                      <span className="text-gold text-xl">📍</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Adresă</p>
                      <p className="text-muted-foreground">Strada Tineretului nr. 17 bloc 2, parter, ap. 24, Chiajna, Ilfov</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                      <span className="text-gold text-xl">🕒</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Program</p>
                      <p className="text-muted-foreground">NON-STOP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl text-gold">Trimite-ne un mesaj</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Nume
                      </label>
                      <Input 
                        name="nume"
                        value={formData.nume}
                        onChange={handleChange}
                        placeholder="Numele tău" 
                        className="bg-background/50" 
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Prenume
                      </label>
                      <Input 
                        name="prenume"
                        value={formData.prenume}
                        onChange={handleChange}
                        placeholder="Prenumele tău" 
                        className="bg-background/50" 
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Email
                    </label>
                    <Input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@exemplu.com" 
                      className="bg-background/50" 
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Telefon
                    </label>
                    <Input 
                      name="telefon"
                      value={formData.telefon}
                      onChange={handleChange}
                      placeholder="+40767 941 512" 
                      className="bg-background/50" 
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Mesaj
                    </label>
                    <Textarea 
                      name="mesaj"
                      value={formData.mesaj}
                      onChange={handleChange}
                      placeholder="Descrie-ne cum te putem ajuta..."
                      rows={4}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  
                  <Button type="submit" variant="luxury" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Se pregătește..." : "Trimite prin WhatsApp"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact