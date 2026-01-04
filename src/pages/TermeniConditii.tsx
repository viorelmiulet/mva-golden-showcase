import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

const TermeniConditii = () => {
  const { language } = useLanguage();
  
  const isRomanian = language === 'ro';
  
  return (
    <>
      <Helmet>
        <title>{isRomanian ? 'Termeni și Condiții | MVA Imobiliare' : 'Terms and Conditions | MVA Imobiliare'}</title>
        <meta name="description" content={isRomanian 
          ? "Termenii și condițiile de utilizare ale site-ului MVA Imobiliare. Informații despre serviciile imobiliare și obligațiile utilizatorilor."
          : "Terms and conditions of use for the MVA Imobiliare website. Information about real estate services and user obligations."
        } />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://mvaimobiliare.ro/termeni-conditii" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-24 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            {isRomanian ? 'Termeni și Condiții' : 'Terms and Conditions'}
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">
              {isRomanian 
                ? 'Ultima actualizare: Ianuarie 2025'
                : 'Last updated: January 2025'
              }
            </p>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '1. Acceptarea termenilor' : '1. Acceptance of Terms'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Prin accesarea și utilizarea site-ului mvaimobiliare.ro, acceptați să fiți legat de acești termeni și condiții. Dacă nu sunteți de acord cu oricare dintre acești termeni, vă rugăm să nu utilizați site-ul nostru.'
                  : 'By accessing and using the mvaimobiliare.ro website, you agree to be bound by these terms and conditions. If you disagree with any of these terms, please do not use our website.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '2. Descrierea serviciilor' : '2. Description of Services'}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {isRomanian 
                  ? 'MVA Imobiliare oferă servicii de intermediere imobiliară, inclusiv:'
                  : 'MVA Imobiliare offers real estate brokerage services, including:'
                }
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>{isRomanian ? 'Vânzare și cumpărare de proprietăți rezidențiale' : 'Buying and selling residential properties'}</li>
                <li>{isRomanian ? 'Închiriere de apartamente și case' : 'Apartment and house rentals'}</li>
                <li>{isRomanian ? 'Consultanță imobiliară și evaluări' : 'Real estate consulting and valuations'}</li>
                <li>{isRomanian ? 'Reprezentare în tranzacții imobiliare' : 'Representation in real estate transactions'}</li>
                <li>{isRomanian ? 'Servicii de regim hotelier' : 'Short-term rental services'}</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '3. Utilizarea site-ului' : '3. Website Usage'}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {isRomanian 
                  ? 'Vă angajați să utilizați site-ul doar în scopuri legale și în conformitate cu acești termeni. Nu aveți voie să:'
                  : 'You agree to use the website only for lawful purposes and in accordance with these terms. You may not:'
                }
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>{isRomanian ? 'Utilizați site-ul într-un mod care încalcă legile aplicabile' : 'Use the site in a way that violates applicable laws'}</li>
                <li>{isRomanian ? 'Transmiteți conținut dăunător sau ilegal' : 'Transmit harmful or illegal content'}</li>
                <li>{isRomanian ? 'Încercați să accesați neautorizat sistemele noastre' : 'Attempt unauthorized access to our systems'}</li>
                <li>{isRomanian ? 'Copiați sau redistribuiți conținutul fără permisiune' : 'Copy or redistribute content without permission'}</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '4. Informații despre proprietăți' : '4. Property Information'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Informațiile despre proprietăți sunt furnizate cu bună-credință și se bazează pe datele primite de la dezvoltatori și proprietari. Deși depunem eforturi pentru acuratețe, nu garantăm că toate informațiile sunt complete sau actualizate. Vă recomandăm să verificați detaliile înainte de a lua decizii de cumpărare.'
                  : 'Property information is provided in good faith and is based on data received from developers and owners. While we strive for accuracy, we do not guarantee that all information is complete or up-to-date. We recommend verifying details before making purchasing decisions.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '5. Prețuri și disponibilitate' : '5. Prices and Availability'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Prețurile afișate pe site sunt orientative și pot fi modificate fără notificare prealabilă. Disponibilitatea proprietăților este actualizată periodic, dar poate varia. Prețul final și disponibilitatea vor fi confirmate de agentul nostru.'
                  : 'Prices displayed on the site are indicative and may be changed without prior notice. Property availability is updated periodically but may vary. The final price and availability will be confirmed by our agent.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '6. Comisioane și plăți' : '6. Commissions and Payments'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Comisioanele de intermediere vor fi comunicate transparent înainte de semnarea oricărui contract. Plata comisionului se face conform termenilor stabiliți în contractul de intermediere. Nu percepem taxe pentru vizionări sau consultanță inițială.'
                  : 'Brokerage commissions will be communicated transparently before signing any contract. Commission payment is made according to the terms established in the brokerage contract. We do not charge fees for viewings or initial consultations.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '7. Proprietate intelectuală' : '7. Intellectual Property'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Tot conținutul site-ului (texte, imagini, logo-uri, grafică) este proprietatea MVA Imobiliare sau a licențiatorilor săi și este protejat de legile dreptului de autor. Reproducerea fără autorizare scrisă este interzisă.'
                  : 'All website content (texts, images, logos, graphics) is the property of MVA Imobiliare or its licensors and is protected by copyright laws. Reproduction without written authorization is prohibited.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '8. Limitarea răspunderii' : '8. Limitation of Liability'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'MVA Imobiliare nu va fi răspunzător pentru daune indirecte, incidentale sau consecințe rezultate din utilizarea site-ului sau imposibilitatea de a-l utiliza. Site-ul este furnizat „așa cum este" fără garanții de niciun fel.'
                  : 'MVA Imobiliare shall not be liable for indirect, incidental, or consequential damages resulting from the use of the site or inability to use it. The site is provided "as is" without warranties of any kind.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '9. Link-uri externe' : '9. External Links'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Site-ul nostru poate conține link-uri către site-uri terțe. Nu suntem responsabili pentru conținutul sau practicile de confidențialitate ale acestor site-uri externe.'
                  : 'Our website may contain links to third-party sites. We are not responsible for the content or privacy practices of these external websites.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '10. Modificări ale termenilor' : '10. Changes to Terms'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Ne rezervăm dreptul de a modifica acești termeni în orice moment. Modificările vor fi publicate pe această pagină cu data actualizării. Utilizarea continuă a site-ului după modificări constituie acceptarea noilor termeni.'
                  : 'We reserve the right to modify these terms at any time. Changes will be posted on this page with the update date. Continued use of the site after changes constitutes acceptance of the new terms.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '11. Legislație aplicabilă' : '11. Applicable Law'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Acești termeni sunt guvernați de legile României. Orice dispută va fi soluționată de instanțele competente din București.'
                  : 'These terms are governed by the laws of Romania. Any dispute will be resolved by the competent courts in Bucharest.'
                }
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {isRomanian ? '12. Contact' : '12. Contact'}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isRomanian 
                  ? 'Pentru întrebări legate de acești termeni, contactați-ne la:'
                  : 'For questions regarding these terms, contact us at:'
                }
              </p>
              <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                <p className="text-foreground font-medium">MVA Imobiliare SRL</p>
                <p className="text-muted-foreground">Email: contact@mvaimobiliare.ro</p>
                <p className="text-muted-foreground">Telefon: 0767 941 512</p>
                <p className="text-muted-foreground">Adresă: București, România</p>
              </div>
            </section>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default TermeniConditii;
