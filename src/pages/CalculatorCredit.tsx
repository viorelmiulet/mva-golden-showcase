import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import CreditSimulator from '@/components/CreditSimulator';
import { useLanguage } from '@/contexts/LanguageContext';

const CalculatorIpotecar = () => {
  const { t } = useLanguage();

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Acasă", url: "/" },
        { name: t.nav?.calculator || 'Calculator Credit', url: "/calculator-credit" }
      ]} />
      <Helmet>
        <title>Simulator Credit | MVA - Estimează Rata Lunară</title>
        <meta
          name="description"
          content="Simulează creditul tău imobiliar sau de nevoi personale. Calculează rata lunară, dobânda totală și vezi planul de amortizare complet."
        />
        <meta name="keywords" content="simulator credit, calculator credit, credit imobiliar, rata lunara, avans, dobanda, plan amortizare" />
        <link rel="canonical" href="https://mvaimobiliare.ro/calculator-credit" />
        
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/calculator-credit" />
        <meta property="og:title" content="Simulator Credit Imobiliar | MVA Imobiliare" />
        <meta property="og:description" content="Simulează creditul tău imobiliar sau de nevoi personale. Calculează rata lunară, dobânda totală și vezi planul de amortizare complet." />
        <meta property="og:image" content="https://mvaimobiliare.ro/mva-logo-luxury-horizontal.svg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Simulator Credit Imobiliar | MVA Imobiliare" />
        <meta name="twitter:description" content="Calculează rata lunară pentru creditul tău imobiliar. Simulator complet cu plan de amortizare." />
      </Helmet>

      <div className="min-h-screen" style={{ background: '#0A0C0F' }}>
        <Header />

        <main className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
          <div className="container mx-auto px-3 sm:px-4">
            <Breadcrumbs items={[{ label: t.nav?.calculator || 'Calculator Credit' }]} />
            <CreditSimulator />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CalculatorIpotecar;
