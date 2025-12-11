import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MortgageCalculator from '@/components/MortgageCalculator';
import { Calculator, CheckCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

const CalculatorIpotecar = () => {
  const benefits = [
    'Consultanță gratuită pentru credite imobiliare',
    'Parteneriate cu principalele bănci din România',
    'Dobânzi competitive și condiții avantajoase',
    'Asistență completă în procesul de creditare',
  ];

  return (
    <>
      <Helmet>
        <title>Calculator Credit | MVA - Estimează Rata Lunară</title>
        <meta
          name="description"
          content="Calculează rata lunară pentru creditul tău imobiliar. Estimare rapidă pe baza prețului, avansului și perioadei de creditare."
        />
        <meta name="keywords" content="calculator credit, credit imobiliar, rata lunara, avans, dobanda" />
        <link rel="canonical" href="https://mvaperfect.ro/calculator-credit" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
                <Calculator className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Calculator Credit</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Estimează rapid rata lunară pentru creditul tău imobiliar. Ajustează parametrii
                pentru a vedea cum influențează avansul și perioada de creditare rata lunară.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Calculator */}
              <MortgageCalculator defaultPrice={100000} />

              {/* Info Section */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">De ce să alegi MVA Imobiliare?</h2>
                  <ul className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">Ai nevoie de ajutor?</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Consultanții noștri îți pot oferi o evaluare personalizată și te pot ghida în
                    alegerea celei mai bune opțiuni de creditare.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild className="flex-1">
                      <a href="tel:+40767941512">
                        <Phone className="h-4 w-4 mr-2" />
                        Sună-ne
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <a
                        href="https://wa.me/40767941512?text=Bună! Aș dori mai multe informații despre creditele imobiliare."
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <WhatsAppIcon className="h-4 w-4 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-3">Sfaturi pentru credit</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Un avans mai mare reduce rata lunară și dobânda totală</li>
                    <li>• Perioada mai scurtă = dobândă totală mai mică</li>
                    <li>• Compară ofertele de la mai multe bănci</li>
                    <li>• Verifică costurile suplimentare (comisioane, asigurări)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CalculatorIpotecar;
