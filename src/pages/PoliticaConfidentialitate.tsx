import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { useLanguage } from "@/contexts/LanguageContext";

const PoliticaConfidentialitate = () => {
  const { language } = useLanguage();
  
  const isRomanian = language === 'ro';
  
  return (
    <>
      <BreadcrumbSchema items={[
        { name: isRomanian ? "Acasă" : "Home", url: "/" },
        { name: isRomanian ? "Politica de Confidențialitate" : "Privacy Policy", url: "/politica-confidentialitate" }
      ]} />
      <Helmet>
        <title>{isRomanian ? 'Politica de Confidențialitate | MVA Imobiliare' : 'Privacy Policy | MVA Imobiliare'}</title>
        <meta name="description" content={isRomanian 
          ? "Politica de confidențialitate MVA Imobiliare. Află cum protejăm și procesăm datele tale personale conform GDPR."
          : "MVA Imobiliare privacy policy. Learn how we protect and process your personal data in compliance with GDPR."
        } />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://mvaimobiliare.ro/politica-confidentialitate" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/politica-confidentialitate" />
        <meta property="og:title" content={isRomanian ? 'Politica de Confidențialitate | MVA Imobiliare' : 'Privacy Policy | MVA Imobiliare'} />
        <meta property="og:description" content={isRomanian 
          ? "Politica de confidențialitate MVA Imobiliare. Află cum protejăm și procesăm datele tale personale conform GDPR."
          : "MVA Imobiliare privacy policy. Learn how we protect and process your personal data in compliance with GDPR."
        } />
        <meta property="og:image" content="https://mvaimobiliare.ro/og-default.jpg" />
        <meta property="og:image:width" content="1216" />
        <meta property="og:image:height" content="640" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={isRomanian ? 'Politica de Confidențialitate | MVA Imobiliare' : 'Privacy Policy | MVA Imobiliare'} />
        <meta name="twitter:image" content="https://mvaimobiliare.ro/og-default.jpg" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-3 sm:px-4 py-16 sm:py-20 md:py-24 max-w-4xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8">
            {isRomanian ? 'Politica de Confidențialitate' : 'Privacy Policy'}
          </h1>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none space-y-6 sm:space-y-8">
            <p className="text-muted-foreground">
              {isRomanian 
                ? 'Ultima actualizare: Ianuarie 2025'
                : 'Last updated: January 2025'
              }
            </p>
            
            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {isRomanian ? '1. Introducere' : '1. Introduction'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'MVA Imobiliare SRL („noi", „al nostru" sau „Compania") respectă confidențialitatea vizitatorilor site-ului nostru. Această politică de confidențialitate explică modul în care colectăm, utilizăm, dezvăluim și protejăm informațiile dvs. atunci când vizitați site-ul nostru web mvaimobiliare.ro.'
                  : 'MVA Imobiliare SRL ("we", "our" or "Company") respects the privacy of our website visitors. This privacy policy explains how we collect, use, disclose and protect your information when you visit our website mvaimobiliare.ro.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {isRomanian ? '2. Datele pe care le colectăm' : '2. Data We Collect'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4">
                {isRomanian 
                  ? 'Putem colecta următoarele tipuri de informații:'
                  : 'We may collect the following types of information:'
                }
              </p>
              <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1.5 sm:space-y-2">
                <li>{isRomanian ? 'Informații personale (nume, email, telefon) furnizate prin formulare' : 'Personal information (name, email, phone) provided through forms'}</li>
                <li>{isRomanian ? 'Date de utilizare și navigare pe site' : 'Usage and browsing data on the site'}</li>
                <li>{isRomanian ? 'Informații tehnice (adresa IP, tipul browser-ului)' : 'Technical information (IP address, browser type)'}</li>
                <li>{isRomanian ? 'Cookie-uri și tehnologii similare' : 'Cookies and similar technologies'}</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {isRomanian ? '3. Scopul prelucrării datelor' : '3. Purpose of Data Processing'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4">
                {isRomanian 
                  ? 'Utilizăm datele colectate pentru:'
                  : 'We use the collected data for:'
                }
              </p>
              <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1.5 sm:space-y-2">
                <li>{isRomanian ? 'A vă furniza serviciile noastre imobiliare' : 'To provide you with our real estate services'}</li>
                <li>{isRomanian ? 'A răspunde solicitărilor și întrebărilor dvs.' : 'To respond to your requests and inquiries'}</li>
                <li>{isRomanian ? 'A îmbunătăți experiența pe site' : 'To improve your experience on the site'}</li>
                <li>{isRomanian ? 'A vă trimite informații despre proprietăți relevante (cu consimțământul dvs.)' : 'To send you information about relevant properties (with your consent)'}</li>
                <li>{isRomanian ? 'A respecta obligațiile legale' : 'To comply with legal obligations'}</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {isRomanian ? '4. Temeiul legal al prelucrării' : '4. Legal Basis for Processing'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Prelucrăm datele dvs. personale pe baza: consimțământului acordat, executării unui contract, obligațiilor legale sau intereselor noastre legitime (îmbunătățirea serviciilor).'
                  : 'We process your personal data based on: consent given, contract execution, legal obligations, or our legitimate interests (service improvement).'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {isRomanian ? '5. Partajarea datelor' : '5. Data Sharing'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Nu vindem datele dvs. personale. Putem partaja informații cu: furnizori de servicii (găzduire, analiză), autorități (când legea o impune), sau parteneri imobiliari (cu acordul dvs.).'
                  : 'We do not sell your personal data. We may share information with: service providers (hosting, analytics), authorities (when required by law), or real estate partners (with your consent).'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {isRomanian ? '6. Securitatea datelor' : '6. Data Security'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Implementăm măsuri tehnice și organizatorice pentru a proteja datele dvs., inclusiv criptare SSL, acces restricționat și backup-uri regulate.'
                  : 'We implement technical and organizational measures to protect your data, including SSL encryption, restricted access, and regular backups.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {isRomanian ? '7. Drepturile dvs. GDPR' : '7. Your GDPR Rights'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4">
                {isRomanian 
                  ? 'Conform GDPR, aveți dreptul la:'
                  : 'Under GDPR, you have the right to:'
                }
              </p>
              <ul className="list-disc list-inside text-sm sm:text-base text-muted-foreground space-y-1.5 sm:space-y-2">
                <li>{isRomanian ? 'Acces la datele dvs. personale' : 'Access your personal data'}</li>
                <li>{isRomanian ? 'Rectificarea datelor incorecte' : 'Rectification of incorrect data'}</li>
                <li>{isRomanian ? 'Ștergerea datelor („dreptul de a fi uitat")' : 'Erasure of data ("right to be forgotten")'}</li>
                <li>{isRomanian ? 'Restricționarea prelucrării' : 'Restriction of processing'}</li>
                <li>{isRomanian ? 'Portabilitatea datelor' : 'Data portability'}</li>
                <li>{isRomanian ? 'Opoziția la prelucrare' : 'Object to processing'}</li>
                <li>{isRomanian ? 'Retragerea consimțământului' : 'Withdraw consent'}</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {isRomanian ? '8. Cookie-uri' : '8. Cookies'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Site-ul nostru utilizează cookie-uri pentru a îmbunătăți experiența de navigare. Puteți gestiona preferințele cookie-urilor din setările browser-ului dvs. sau prin banner-ul de consimțământ afișat la prima vizită.'
                  : 'Our website uses cookies to improve your browsing experience. You can manage your cookie preferences through your browser settings or via the consent banner displayed on your first visit.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {isRomanian ? '9. Retenția datelor' : '9. Data Retention'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Păstrăm datele dvs. personale doar atât timp cât este necesar pentru scopurile menționate sau conform cerințelor legale. Datele inactive pot fi șterse după 3 ani.'
                  : 'We retain your personal data only as long as necessary for the stated purposes or as required by law. Inactive data may be deleted after 3 years.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                {isRomanian ? '10. Contact' : '10. Contact'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Pentru întrebări legate de confidențialitate sau pentru a vă exercita drepturile, contactați-ne la:'
                  : 'For privacy-related questions or to exercise your rights, contact us at:'
                }
              </p>
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm sm:text-base text-foreground font-medium">MVA Imobiliare SRL</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Email: contact@mvaimobiliare.ro</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Telefon: 0767 941 512</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Adresă: București, România</p>
              </div>
            </section>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default PoliticaConfidentialitate;
