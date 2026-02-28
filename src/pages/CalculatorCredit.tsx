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
        <link rel="canonical" href="https://mvaperfect.ro/calculator-credit" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
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
